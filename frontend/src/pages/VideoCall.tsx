import React, { useState, useEffect, useRef, useCallback } from "react";
import Peer from "simple-peer";
import { useAuth } from "../context/AuthContext";
import { socket } from "../utils/socket";
import { 
  Video, Mic, MicOff, VideoOff, Phone, 
  Users, Activity, ArrowRight, ShieldCheck, 
  Smartphone, Globe 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// POLYFILLS (Required for simple-peer in Vite)
// ============================================
import * as buffer from "buffer";

if (typeof window !== 'undefined') {
  if (!window.global) window.global = window;
  if (!window.Buffer) window.Buffer = buffer.Buffer;
  if (!window.process) {
    // @ts-ignore
    window.process = { env: {}, nextTick: (cb: any) => setTimeout(cb, 0) };
  }
}

// ============================================
// TYPES
// ============================================
interface PeerData {
  peerId: string;
  peer: Peer.Instance;
  userName: string;
  userAvatar?: string;
  stream?: MediaStream;
}

const ROOM_NAME = "PodurisFamilyBox";

export const VideoCall: React.FC = () => {
  const { user } = useAuth();
  
  // --- State ---
  const [phase, setPhase] = useState<'lobby' | 'incall'>('lobby');
  const [participantCount, setParticipantCount] = useState(0);
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Media Toggle State
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // --- Refs ---
  const peersRef = useRef<PeerData[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(socket);

  // ============================================
  // LOBBY: Participant Presence
  // ============================================
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleActiveRooms = (rooms: any[]) => {
      const room = rooms.find((r: any) => r.name === ROOM_NAME);
      setParticipantCount(room ? room.count : 0);
    };

    socket.on('active-rooms-update', handleActiveRooms);
    socket.emit('get-active-rooms');

    return () => {
      socket.off('active-rooms-update', handleActiveRooms);
    };
  }, []);


  // ============================================
  // MEDIA: Management
  // ============================================
  const getMedia = useCallback(async (retryCount = 0): Promise<MediaStream | null> => {
    try {
        // 1. AGGRESSIVE CLEANUP: Stop any existing tracks to free up hardware
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => {
                t.stop();
                t.enabled = false;
            });
            localStreamRef.current = null;
        }

        console.log(`Requesting user media (Attempt ${retryCount + 1})...`);
        
        // 2. Request new stream
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 640 }, 
                height: { ideal: 480 },
                frameRate: { max: 24 } // Reduced framerate for better stability
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        setLocalStream(stream);
        localStreamRef.current = stream;
        return stream;

    } catch (err: any) {
        console.error("Media Access Error:", err.name, err);

        // 3. RETRY LOGIC for "Camera In Use" (NotReadableError)
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            if (retryCount < 2) {
                console.warn("Camera busy, waiting 1s and retrying...");
                setError("Camera busy, retrying in 1s...");
                await new Promise(r => setTimeout(r, 1000));
                return getMedia(retryCount + 1);
            }
            setError("Camera is in use by another app. Please close other apps and try again.");
        } else if (err.name === 'NotAllowedError') {
            setError("Camera permission denied. Please allow access in browser settings.");
        } else {
            setError(`Could not access camera: ${err.message}`);
        }
        return null;
    }
  }, []);

  const cleanupCall = useCallback(() => {
     // Destroy all peers
     peersRef.current.forEach(p => p.peer.destroy());
     peersRef.current = [];
     setPeers([]);

     // Stop local media
     if (localStreamRef.current) {
         localStreamRef.current.getTracks().forEach(track => track.stop());
         localStreamRef.current = null;
     }
     setLocalStream(null);

     // Leave room
     socket.emit('leave-room');
     setPhase('lobby');
  }, []);

  // ============================================
  // WEBRTC: Peer Logic
  // ============================================
  const createPeer = (userToSignal: string, callerId: string, stream: MediaStream, isInitiator: boolean) => {
    const peer = new Peer({
        initiator: isInitiator,
        trickle: false,
        stream: stream,
    });

    peer.on('signal', (signal) => {
        if (isInitiator) {
            socket.emit('sending-signal', { userToSignal, callerId, signal });
        } else {
            socket.emit('returning-signal', { signal, callerId });
        }
    });

    peer.on('stream', (remoteStream) => {
        setPeers(prev => {
            const exists = prev.find(p => p.peerId === userToSignal);
            if (exists) {
                return prev.map(p => p.peerId === userToSignal ? { ...p, stream: remoteStream } : p);
            }
            return prev;
        });
    });

    peer.on('error', (err) => {
        console.error("Peer Error:", err);
    });

    return peer;
  };

  const joinCall = async () => {
      setError(null);
      const stream = await getMedia();
      if (!stream) return; // Stop if media failed

      setPhase('incall');
      
      socket.emit('join-room', {
          roomName: ROOM_NAME,
          userName: user?.nickname || user?.name || 'Guest',
          userAvatar: user?.avatar,
      });

      // Socket Listeners for Signaling
      socket.on('all-users', (usersInRoom: any[]) => {
          const peersArr: PeerData[] = [];
          
          usersInRoom.forEach(userID => {
              // Create peer as initiator
              const peer = createPeer(userID.id, socket.id, stream, true);
              peersArr.push({
                  peerId: userID.id,
                  peer,
                  userName: userID.name || 'Family Member',
                  userAvatar: userID.avatar
              });
          });
          
          peersRef.current = peersArr;
          setPeers(peersArr);
      });

      socket.on('user-joined', (payload: any) => {
          const peer = createPeer(payload.callerId, socket.id, stream, false);
          
          // Accept the signal immediately as we are the receiver
          peer.signal(payload.signal);

          const peerObj = {
              peerId: payload.callerId,
              peer,
              userName: payload.name || 'Family Member',
              userAvatar: payload.avatar
          };

          peersRef.current = [...peersRef.current, peerObj];
          setPeers(prev => [...prev, peerObj]);
      });

      socket.on('receiving-returned-signal', (payload: any) => {
          const item = peersRef.current.find(p => p.peerId === payload.id);
          if (item) {
              item.peer.signal(payload.signal);
          }
      });

      socket.on('user-left', (id: string) => {
          const item = peersRef.current.find(p => p.peerId === id);
          if (item) item.peer.destroy();
          
          const filtered = peersRef.current.filter(p => p.peerId !== id);
          peersRef.current = filtered;
          setPeers(filtered);
      });
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioMuted(!audioTrack.enabled);
        }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
        }
    }
  };


  // ============================================
  // RENDER
  // ============================================
  if (!user) return <div className="h-screen bg-gray-950 flex items-center justify-center text-white">Please login.</div>;

  return (
    <div className="h-[100dvh] sm:h-[calc(100vh-100px)] w-full bg-gray-950 text-white overflow-hidden sm:rounded-[32px] border border-white/5 relative flex flex-col">
        <AnimatePresence mode="wait">
            
            {/* LOBBY */}
            {phase === 'lobby' && (
                <motion.div 
                    key="lobby"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
                >
                   {/* ... (Keep existing Lobby UI but wire joinCall) ... */}
                   {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[128px]" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[128px]" />
                    </div>

                    <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
                        {/* Title Section */}
                        <div className="space-y-4">
                            <div className="relative w-32 h-32 mx-auto">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-pulse" />
                                <div className="absolute inset-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <Video className="w-14 h-14 text-white" />
                                </div>
                                {participantCount > 0 && (
                                    <div className="absolute -right-2 -top-2 bg-green-500 border-4 border-gray-950 text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                                        {participantCount} Active
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tight mb-2">Family Call</h1>
                                <p className="text-gray-400 max-w-[260px] mx-auto text-sm leading-relaxed">
                                    Join the secure family room. Unlimited & Free forever using P2P.
                                </p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm w-full">
                                {error}
                            </div>
                        )}

                        {/* Join Button */}
                        <button
                            onClick={joinCall}
                            className="w-full relative group overflow-hidden bg-white text-black font-bold text-lg py-5 rounded-3xl transition-transform active:scale-95 shadow-xl shadow-white/10"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Start Camera & Join
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        
                        {/* Features Grid */}
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <div className="flex flex-col items-center gap-1 text-xs font-medium text-gray-500 bg-white/5 p-3 rounded-2xl">
                                <Smartphone className="w-4 h-4 mb-1 text-indigo-400" />
                                <span>Mobile Ready</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-xs font-medium text-gray-500 bg-white/5 p-3 rounded-2xl">
                                <Globe className="w-4 h-4 mb-1 text-purple-400" />
                                <span>Direct P2P</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-xs font-medium text-gray-500 bg-white/5 p-3 rounded-2xl">
                                <ShieldCheck className="w-4 h-4 mb-1 text-emerald-400" />
                                <span>Encrypted</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-xs font-medium text-gray-500 bg-white/5 p-3 rounded-2xl">
                                <Activity className="w-4 h-4 mb-1 text-orange-400" />
                                <span>Low Latency</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* IN-CALL UI */}
            {phase === 'incall' && (
                <motion.div 
                    key="incall"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-black flex flex-col"
                >
                    {/* VIDEO GRID */}
                    <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
                        
                        {/* Local User */}
                        <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-white/10 aspect-video sm:aspect-auto">
                            {localStream && (
                                <video
                                    ref={el => { if(el) el.srcObject = localStream }}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`w-full h-full object-cover scale-x-[-1] ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
                                />
                            )}
                            <div className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-lg text-xs font-bold">You</div>
                            {(!localStream || isVideoOff) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center text-3xl font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Remote Peers */}
                        {peers.map(peer => (
                             <VideoTile key={peer.peerId} peer={peer} />
                        ))}

                    </div>

                    {/* CONTROLS BAR */}
                    <div className="p-6 bg-black/80 backdrop-blur-md flex justify-center gap-4 border-t border-white/10">
                        <button onClick={toggleAudio} className={`p-4 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-gray-800'} text-white transition-all active:scale-95`}>
                            {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                        <button onClick={cleanupCall} className="p-4 rounded-full bg-red-600 text-white transition-all active:scale-95 px-8 flex items-center gap-2">
                             <Phone className="w-6 h-6 rotate-[135deg]" />
                        </button>
                        <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-800'} text-white transition-all active:scale-95`}>
                            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

// Sub-Component for Remote Video
const VideoTile: React.FC<{ peer: PeerData }> = ({ peer }) => {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (peer.stream && ref.current) {
            ref.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    return (
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-white/10 aspect-video sm:aspect-auto group">
            {peer.stream && (
                <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
            )}
            {!peer.stream && (
                <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-xl font-bold animate-pulse">
                         {peer.userName.charAt(0)}
                     </div>
                </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/50 px-3 py-1 rounded-lg text-xs font-bold truncate max-w-[120px]">
                {peer.userName}
            </div>
        </div>
    );
};
