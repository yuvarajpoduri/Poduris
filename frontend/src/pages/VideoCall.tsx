import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useAuth } from "../context/AuthContext";
import { socket } from "../utils/socket";
import Peer from "simple-peer";
import { 
  Mic, MicOff, Video, VideoOff, Phone, 
  ArrowRight, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPoduriName } from "../utils/formatUtils";
import { Buffer } from 'buffer';
import process from 'process';

// ============================================
// POLYFILLS - CRITICAL FOR VITE + SIMPLE-PEER
// ============================================
if (typeof window !== 'undefined') {
    if ((window as any).global === undefined) {
        (window as any).global = window;
    }
    if ((window as any).process === undefined) {
        (window as any).process = process;
    }
    if ((window as any).Buffer === undefined) {
        (window as any).Buffer = Buffer;
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

interface ActiveRoom {
  name: string;
  count: number;
}

// ============================================
// CONFIG
// ============================================
const MAX_PARTICIPANTS = 8;
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ============================================
// SUB-COMPONENT (Moved outside to prevent re-renders)
// ============================================
const VideoTile: React.FC<{
    stream?: MediaStream;
    isLocal?: boolean;
    name: string;
    avatar?: string;
    muted?: boolean;
    videoOff?: boolean;
}> = memo(({ stream, isLocal, name, avatar, muted, videoOff }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden border border-white/10 shadow-lg group transform transition-transform">
            {/* Video Element */}
            {stream && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal} // Always mute local video
                    className={`w-full h-full object-cover transition-opacity duration-300 ${videoOff ? 'opacity-0' : 'opacity-100'} ${isLocal ? 'scale-x-[-1]' : ''}`}
                />
            )}
            
            {/* Fallback / Video Off State */}
            {(!stream || videoOff) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    {avatar ? (
                        <img src={avatar} alt={name} className="w-20 h-20 rounded-full border-4 border-white/10" />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center text-3xl font-bold text-indigo-400">
                            {name.charAt(0)}
                        </div>
                    )}
                </div>
            )}

            {/* Name Label */}
            <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 z-10">
                <span className="text-white text-xs font-medium truncate max-w-[100px]">
                    {isLocal ? "You" : formatPoduriName(name)}
                </span>
                {muted && <MicOff className="w-3 h-3 text-red-400" />}
            </div>
        </div>
    );
});

// ============================================
// MAIN COMPONENT
// ============================================
export const VideoCall: React.FC = () => {
  const { user } = useAuth();
  const DEFAULT_ROOM = "Poduris Family";
  
  // --- State ---
  const [phase, setPhase] = useState<'lobby' | 'connecting' | 'incall'>('lobby');
  const [participantCount, setParticipantCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Media State
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peers, setPeers] = useState<PeerData[]>([]);

  // --- Refs ---
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<PeerData[]>([]);

  // ============================================
  // HELPERS & CLEANUP
  // ============================================
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
    }
  }, []);

  const destroyAllPeers = useCallback(() => {
    peersRef.current.forEach(p => {
      try {
        p.peer.destroy();
      } catch (e) {
        console.warn('[VideoCall] Peer destroy error:', e);
      }
    });
    peersRef.current = [];
    setPeers([]);
  }, []);

  const fullCleanup = useCallback(() => {
    socket.emit('leave-room');
    destroyAllPeers();
    stopLocalStream();
    setPhase('lobby');
    setError(null);
    setIsAudioMuted(false);
    setIsVideoOff(false);
  }, [destroyAllPeers, stopLocalStream]);

  // ============================================
  // PEER MANAGEMENT
  // ============================================
  const createPeer = useCallback((targetId: string, stream: MediaStream, isInitiator: boolean, incomingSignal?: any): Peer.Instance => {
    // ... (keep logic same as before, simplified for this diff) ...
    const peer = new Peer({
      initiator: isInitiator,
      trickle: false,
      stream: stream, 
      config: { iceServers: ICE_SERVERS }
    });

    peer.on('signal', (signal) => {
      if (isInitiator) {
        socket.emit('sending-signal', { userToSignal: targetId, callerId: socket.id, signal });
      } else {
        socket.emit('returning-signal', { signal, callerId: targetId });
      }
    });

    peer.on('stream', (remoteStream) => {
      setPeers(prevPeers => {
          const updated = prevPeers.map(p => 
              p.peerId === targetId ? { ...p, stream: remoteStream } : p
          );
          peersRef.current = updated;
          return updated;
      });
    });

    peer.on('error', (err) => {
      console.error('[VideoCall] Peer error:', err.message);
    });
    
    if (!isInitiator && incomingSignal) {
        peer.signal(incomingSignal);
    }

    return peer;
  }, []);


  // ============================================
  // SOCKET LISTENERS
  // ============================================
  useEffect(() => {
    const handleConnect = () => {
      socket.emit('get-active-rooms');
    };

    const handleActiveRooms = (rooms: ActiveRoom[]) => {
      const room = rooms.find(r => r.name === DEFAULT_ROOM);
      setParticipantCount(room ? room.count : 0);
    };

    const handleRoomFull = () => {
      setError(`Room is full (max ${MAX_PARTICIPANTS}).`);
      fullCleanup();
    };

    const handleAllUsers = (users: { id: string; name: string; avatar?: string }[]) => {
      const tryConnect = () => {
        const stream = localStreamRef.current;
        if (!stream) {
          setTimeout(tryConnect, 100);
          return;
        }

        const newPeers: PeerData[] = [];
        users.forEach(u => {
            if (peersRef.current.find(p => p.peerId === u.id)) return;

            const peer = createPeer(u.id, stream, true);
            newPeers.push({
                peerId: u.id,
                peer,
                userName: u.name,
                userAvatar: u.avatar
            });
        });
        
        peersRef.current = [...peersRef.current, ...newPeers];
        setPeers(peersRef.current);
      };
      tryConnect();
    };

    const handleUserJoined = (payload: { signal: any; callerId: string; name: string; avatar?: string }) => {
      const tryAnswer = () => {
        const stream = localStreamRef.current;
        if (!stream) {
          setTimeout(tryAnswer, 100);
          return;
        }

        const existing = peersRef.current.find(p => p.peerId === payload.callerId);
        if (existing) {
          existing.peer.signal(payload.signal);
          return;
        }

        const peer = createPeer(payload.callerId, stream, false, payload.signal);
        const newPeer: PeerData = {
            peerId: payload.callerId,
            peer,
            userName: payload.name,
            userAvatar: payload.avatar
        };
        peersRef.current = [...peersRef.current, newPeer];
        setPeers(peersRef.current);
      };
      tryAnswer();
    };

    const handleReturnedSignal = (payload: { signal: any; id: string }) => {
      const item = peersRef.current.find(p => p.peerId === payload.id);
      if (item) {
        item.peer.signal(payload.signal);
      }
    };

    const handleUserLeft = (userId: string) => {
      const peerObj = peersRef.current.find(p => p.peerId === userId);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      peersRef.current = peersRef.current.filter(p => p.peerId !== userId);
      setPeers(peersRef.current);
    };

    socket.on('connect', handleConnect);
    socket.on('active-rooms-update', handleActiveRooms);
    socket.on('room-full', handleRoomFull);
    socket.on('all-users', handleAllUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('receiving-returned-signal', handleReturnedSignal);
    socket.on('user-left', handleUserLeft);

    // Initial fetch
    if (socket.connected) {
        handleConnect();
    } else {
        socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('active-rooms-update', handleActiveRooms);
      socket.off('room-full', handleRoomFull);
      socket.off('all-users', handleAllUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('receiving-returned-signal', handleReturnedSignal);
      socket.off('user-left', handleUserLeft);
      fullCleanup();
    };
  }, [createPeer, fullCleanup]);

  // Handle visibility changes for mobile
  useEffect(() => {
     const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
           if (!socket.connected) socket.connect();
           socket.emit('get-active-rooms');
        }
     };
     document.addEventListener('visibilitychange', handleVisibility);
     return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);



// ============================================
// ACTIONS
// ============================================
  const joinVideoCall = async () => {
    setError(null);
    setPhase('connecting');
    stopLocalStream();
    destroyAllPeers();

    try {
        console.log('[VideoCall] Requesting media access...');
        
        // Relaxed constraints for better mobile compatibility
        // Uses 'ideal' constraints instead of strict ones to avoid OverconstrainedError
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 24 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        localStreamRef.current = stream;

        // Join room
        socket.emit('join-room', {
            roomName: DEFAULT_ROOM,
            userName: user?.nickname || user?.name || 'Guest',
            userAvatar: user?.avatar,
        });

        setPhase('incall');
        
    } catch (err: any) {
        console.error('Media Error:', err);
        setPhase('lobby');
        if (err.name === 'NotAllowedError') setError("Camera access denied. Please allow permissions in settings.");
        else if (err.name === 'NotFoundError') setError("No camera found/detected.");
        else if (err.name === 'NotReadableError') setError("Camera is in use. Close other apps using camera.");
        else if (err.name === 'OverconstrainedError') setError("Camera resolution not supported.");
        else setError(`Unable to access camera: ${err.message}`);
    }
  };

  const toggleAudio = () => {
      if (localStreamRef.current) {
          const track = localStreamRef.current.getAudioTracks()[0];
          if (track) {
              track.enabled = !track.enabled;
              setIsAudioMuted(!track.enabled);
          }
      }
  };

  const toggleVideo = () => {
      if (localStreamRef.current) {
          const track = localStreamRef.current.getVideoTracks()[0];
          if (track) {
              track.enabled = !track.enabled;
              setIsVideoOff(!track.enabled);
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
                    className="h-full flex flex-col items-center justify-center p-6 text-center"
                >
                    <div className="w-full max-w-sm flex flex-col items-center gap-8">
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
                                <h1 className="text-4xl font-black tracking-tight mb-2">
                                    Family Call
                                </h1>
                                <p className="text-gray-400 max-w-[260px] mx-auto text-sm leading-relaxed">
                                    {participantCount > 0 
                                      ? "Join the ongoing conversation with your family."
                                      : "Start a call and wait for others to join."}
                                </p>
                            </div>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl w-full"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-red-400" />
                                    <p className="text-red-300 text-sm font-medium">{error}</p>
                                </div>
                            </motion.div>
                        )}

                        <button
                            onClick={joinVideoCall}
                            className="w-full relative group overflow-hidden bg-white text-black font-bold text-lg py-5 rounded-3xl transition-transform active:scale-95 shadow-xl shadow-white/10"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                Join Call
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">
                                <Mic className="w-3 h-3" />
                                <span>Voice Clear</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">
                                <Video className="w-3 h-3" />
                                <span>HD Video</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* CONNECTING */}
            {phase === 'connecting' && (
                <motion.div 
                    key="connecting"
                    className="h-full flex flex-col items-center justify-center gap-6"
                >
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="w-8 h-8 text-indigo-500" />
                        </div>
                    </div>
                    <p className="text-gray-400 font-medium animate-pulse">Connecting to Family Room...</p>
                </motion.div>
            )}

            {/* IN-CALL */}
            {phase === 'incall' && (
                <motion.div 
                    key="incall"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col relative"
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
                        <div className="flex items-center gap-3 pointer-events-auto">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                            <h2 className="font-semibold text-lg drop-shadow-md">Family Call</h2>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium text-gray-300 pointer-events-auto">
                            {peers.length + 1} Online
                        </div>
                    </div>

                    {/* Video Grid */}
                    <div className={`
                        flex-1 p-2 sm:p-4 grid gap-2 sm:gap-4 overflow-y-auto content-center
                        ${(peers.length + 1) <= 1 ? 'grid-cols-1' : ''}
                        ${(peers.length + 1) === 2 ? 'grid-cols-1 sm:grid-cols-2' : ''}
                        ${(peers.length + 1) > 2 ? 'grid-cols-2 lg:grid-cols-3' : ''}
                    `}>
                        {/* Local Video */}
                        <div className="aspect-[3/4] sm:aspect-video w-full max-h-full mx-auto relative overflow-hidden rounded-2xl">
                             <VideoTile 
                                stream={localStreamRef.current || undefined}
                                isLocal={true}
                                name={user.nickname || user.name}
                                avatar={user.avatar}
                                muted={isAudioMuted}
                                videoOff={isVideoOff}
                            />
                        </div>

                        {/* Remote Peers */}
                        {peers.map(peer => (
                             <div key={peer.peerId} className="aspect-[3/4] sm:aspect-video w-full max-h-full mx-auto relative overflow-hidden rounded-2xl">
                                <VideoTile 
                                    stream={peer.stream}
                                    name={peer.userName}
                                    avatar={peer.userAvatar}
                                    // Remote mute state is not synced yet, default to false
                                />
                            </div>
                        ))}
                    </div>

                    {/* Controls Bar */}
                    <div className="p-6 flex justify-center items-end bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-8 z-20">
                        <div className="flex items-center gap-4 bg-gray-900/80 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl">
                            {/* Mute Toggle */}
                            <button
                                onClick={toggleAudio}
                                className={`p-3.5 rounded-full transition-all duration-200 ${
                                    isAudioMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>

                            {/* Hangup */}
                            <button
                                onClick={fullCleanup}
                                className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                            >
                                <Phone className="w-7 h-7 rotate-[135deg]" />
                            </button>

                            {/* Video Toggle */}
                            <button
                                onClick={toggleVideo}
                                className={`p-3.5 rounded-full transition-all duration-200 ${
                                    isVideoOff ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};
