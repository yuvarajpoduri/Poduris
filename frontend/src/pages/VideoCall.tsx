import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { socket } from "../utils/socket";
import Peer from "simple-peer";
import { 
  Mic, MicOff, Phone, 
  Users, Plus, 
  ArrowRight, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPoduriName } from "../utils/formatUtils";

const USER_COLORS = [
  'border-indigo-500',
  'border-emerald-500',
  'border-rose-500',
  'border-amber-500',
  'border-cyan-500',
  'border-fuchsia-500',
  'border-violet-500',
  'border-sky-500'
];

const BG_COLORS = [
  'bg-indigo-500/10',
  'bg-emerald-500/10',
  'bg-rose-500/10',
  'bg-amber-500/10',
  'bg-cyan-500/10',
  'bg-fuchsia-500/10',
  'bg-violet-500/10',
  'bg-sky-500/10'
];

interface PeerState {
  peerID: string;
  peer: Peer.Instance;
  name: string;
  avatar?: string;
  stream?: MediaStream;
}

export const VideoCall: React.FC = () => {
  const { user } = useAuth();
  const [inCall, setInCall] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [peers, setPeers] = useState<PeerState[]>([]);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [activeRooms, setActiveRooms] = useState<{ name: string, count: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  const socketIdRef = useRef<string>();
  const peersRef = useRef<PeerState[]>([]);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      socketIdRef.current = socket.id;
    });

    socket.on("room-full", () => {
      setError("This room is full (max 8 members).");
      setInCall(false);
      stopStream();
    });

    socket.on("active-rooms-update", (rooms: { name: string, count: number }[]) => {
      setActiveRooms(rooms);
    });

    socket.emit("get-active-rooms");
    const interval = setInterval(() => {
      if (!inCall) socket.emit("get-active-rooms");
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && inCall) {
        // Optional: Can either end call or just mute/stop video
        console.log("App hidden, cleaning up...");
      }
    };

    const handleBeforeUnload = () => {
      stopStream();
      socket.emit("leave-room");
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      socket.off("room-full");
      socket.off("active-rooms-update");
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      clearInterval(interval);
      stopStream();
    };
  }, [inCall]);

  useEffect(() => {
    // Check permission status on mount
    if (navigator.permissions && (navigator.permissions as any).query) {
      (navigator.permissions as any).query({ name: 'microphone' }).then((result: any) => {
        setMicPermission(result.state);
        result.onchange = () => setMicPermission(result.state);
      }).catch(() => setMicPermission('unknown'));
    }
  }, []);

  const requestMicAccess = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If successful, stop it immediately, we just wanted to trigger the prompt
      stream.getTracks().forEach(t => t.stop());
      setMicPermission('granted');
      return true;
    } catch (err: any) {
      console.error("Manual mic request failed:", err);
      setMicPermission('denied');
      setError("Microphone access denied. Please allow it to use voice calling.");
      return false;
    }
  };

  const stopStream = () => {
    console.log("Stopping all media tracks...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop());
      setUserStream(null);
    }
    if (userVideoRef.current) {
      userVideoRef.current.srcObject = null;
    }
  };

  const startCall = async () => {
    if (!roomName.trim()) return;
    setError(null);

    try {
      console.log("Starting voice call...");
      
      // Secondary check for mobile users who might have missed the prompt
      if (micPermission !== 'granted') {
        const granted = await requestMicAccess();
        if (!granted) return;
      }

      stopStream();
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      console.log("Microphone access obtained");
      streamRef.current = stream;
      setUserStream(stream);
      
      setInCall(true);
      socket.emit("join-room", {
        roomName,
        userName: user?.nickname || user?.name,
        userAvatar: user?.avatar
      });

      // Simple voice activity detection for local user
      setupVoiceActivityDetector(stream, 'local');

    } catch (err: any) {
      console.error("Microphone access error:", err);
      let errorMsg = "Could not access microphone.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = "Microphone permission denied. Please allow access in settings.";
      }
      setError(errorMsg);
      setInCall(false);
    }
  };

  const setupVoiceActivityDetector = (stream: MediaStream, id: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVoice = () => {
        if (!stream.active) {
          audioContext.close();
          return;
        }
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((p, c) => p + c, 0) / bufferLength;
        
        if (average > 30) { // Voice threshold
          setActiveSpeakers(prev => new Set(prev).add(id));
        } else {
          setActiveSpeakers(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
        requestAnimationFrame(checkVoice);
      };
      checkVoice();
    } catch (e) {
      console.error("Voice detection failed", e);
    }
  };

  useEffect(() => {
    if (!inCall || !userStream) return;

    const handleAllUsers = (users: { id: string, name: string, avatar: string }[]) => {
      const newPeers: PeerState[] = [];
      users.forEach(u => {
        if (peersRef.current.find(p => p.peerID === u.id)) return;
        
        const peer = createPeer(u.id, userStream);
        const peerObj = {
          peerID: u.id,
          peer,
          name: u.name,
          avatar: u.avatar
        };
        peersRef.current.push(peerObj);
        newPeers.push(peerObj);
      });
      setPeers(prev => [...prev, ...newPeers]);
    };

    const handleUserJoined = (payload: { signal: any, callerId: string, name: string, avatar: string }) => {
      const existingPeer = peersRef.current.find(p => p.peerID === payload.callerId);
      if (existingPeer) {
        if (payload.signal) existingPeer.peer.signal(payload.signal);
        return;
      }

      const peer = addPeer(payload.signal, payload.callerId, userStream);
      const peerObj = {
        peerID: payload.callerId,
        peer,
        name: payload.name,
        avatar: payload.avatar
      };
      peersRef.current.push(peerObj);
      setPeers(prev => [...prev, peerObj]);
    };

    const handleReturnedSignal = (payload: { signal: any, id: string }) => {
      const item = peersRef.current.find(p => p.peerID === payload.id);
      if (item && payload.signal) {
        try {
          item.peer.signal(payload.signal);
        } catch (err) {
          console.error("Error signaling peer:", err);
        }
      }
    };

    const handleUserLeft = (id: string) => {
      const peerObj = peersRef.current.find(p => p.peerID === id);
      if (peerObj) {
        peerObj.peer.destroy();
      }
      const filteredPeers = peersRef.current.filter(p => p.peerID !== id);
      peersRef.current = filteredPeers;
      setPeers(filteredPeers);
    };

    socket.on("all-users", handleAllUsers);
    socket.on("user-joined", handleUserJoined);
    socket.on("receiving-returned-signal", handleReturnedSignal);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("all-users", handleAllUsers);
      socket.off("user-joined", handleUserJoined);
      socket.off("receiving-returned-signal", handleReturnedSignal);
      socket.off("user-left", handleUserLeft);
    };
  }, [inCall, userStream]);

  const createPeer = (userToSignal: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
        ]
      }
    });

    peer.on("signal", signal => {
      if (socket.id) {
        socket.emit("sending-signal", { userToSignal, callerId: socket.id, signal });
      }
    });

    peer.on("stream", stream => {
      updatePeerStream(userToSignal, stream);
      setupVoiceActivityDetector(stream, userToSignal);
    });

    peer.on("error", err => {
      console.error("Peer error:", err);
    });

    return peer;
  };

  const addPeer = (incomingSignal: any, callerId: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
        ]
      }
    });

    peer.on("signal", signal => {
      socket.emit("returning-signal", { signal, callerId });
    });

    if (incomingSignal) {
      try {
        peer.signal(incomingSignal);
      } catch (err) {
        console.error("Error setting incoming signal:", err);
      }
    }

    peer.on("stream", stream => {
      updatePeerStream(callerId, stream);
      setupVoiceActivityDetector(stream, callerId);
    });

    peer.on("error", err => {
      console.error("Peer error:", err);
    });

    return peer;
  };

  const updatePeerStream = (peerID: string, stream: MediaStream) => {
    // Update both state and ref
    peersRef.current = peersRef.current.map(p => {
      if (p.peerID === peerID) {
        return { ...p, stream };
      }
      return p;
    });

    setPeers(prev => prev.map(p => {
      if (p.peerID === peerID) {
        return { ...p, stream };
      }
      return p;
    }));
  };

  const endCall = () => {
    console.log("Ending call and cleaning up...");
    socket.emit("leave-room");
    
    // Destroy all peer connections
    peersRef.current.forEach(p => {
      try {
        p.peer.destroy();
      } catch (err) {
        console.error("Error destroying peer:", err);
      }
    });
    
    peersRef.current = [];
    setPeers([]);
    
    // Stop local stream
    stopStream();
    
    setInCall(false);
    setError(null);
  };

  const toggleMute = () => {
    if (userStream) {
      userStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };



  const VoiceTile = ({ stream, name, avatar, isLocal, id, index }: { stream?: MediaStream, name: string, avatar?: string, isLocal?: boolean, id: string, index: number }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const borderColor = USER_COLORS[index % USER_COLORS.length];
    const bgColor = BG_COLORS[index % BG_COLORS.length];
    const isSpeaking = activeSpeakers.has(id);

    useEffect(() => {
      if (audioRef.current && stream && !isLocal) {
        audioRef.current.srcObject = stream;
      }
    }, [stream, isLocal]);

    return (
      <motion.div 
        layout
        className={`relative aspect-square rounded-2xl sm:rounded-[40px] overflow-hidden bg-gray-900 border-2 ${borderColor} shadow-2xl flex items-center justify-center group transition-all duration-300 ${
          isSpeaking ? 'scale-105 ring-4 ring-accent-blue/50' : ''
        }`}
      >
        {!isLocal && <audio ref={audioRef} autoPlay playsInline />}
        
        <div className={`w-full h-full flex flex-col items-center justify-center ${bgColor} relative`}>
            {/* Pulsing Voice Animation */}
            {isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-32 h-32 rounded-full bg-accent-blue/20"
                />
                <motion.div 
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  className="w-32 h-32 rounded-full bg-accent-blue/10"
                />
              </div>
            )}

            <motion.div 
              animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="relative z-10"
            >
              {avatar ? (
                <img src={avatar} alt={name} className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/10 shadow-2xl" />
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white/10 flex items-center justify-center text-xl sm:text-3xl font-bold text-white shadow-2xl">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              {isSpeaking && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full border-2 border-gray-900 shadow-xl">
                   <Activity className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
            <p className="mt-4 text-white/50 font-bold text-xs uppercase tracking-widest relative z-10">
              {isLocal ? "Me" : formatPoduriName(name)}
            </p>
            {isSpeaking && (
               <div className="mt-2 flex space-x-1 relative z-10">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      className="w-1 bg-accent-blue rounded-full"
                    />
                  ))}
               </div>
            )}
        </div>
      </motion.div>
    );
  };

  if (!user) return null;

  return (
    <div className="h-[100dvh] sm:h-auto sm:min-h-[calc(100vh-120px)] flex flex-col bg-gray-950 text-white sm:rounded-[40px] overflow-hidden shadow-2xl border border-white/5 mx-auto max-w-7xl relative">
      <AnimatePresence mode="wait">
        {!inCall ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 space-y-8 sm:space-y-12"
          >
             <div className="text-center space-y-3 sm:space-y-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-tr from-accent-blue to-purple-600 rounded-[30px] sm:rounded-[40px] mx-auto flex items-center justify-center shadow-2xl shadow-accent-blue/20 rotate-12 relative">
                  <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-white -rotate-12 z-10" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-white rounded-[30px] sm:rounded-[40px]"
                  />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                  Family <span className="text-accent-blue italic">Voice</span>
                </h2>
                <p className="text-white/40 max-w-[280px] sm:max-w-md mx-auto font-medium text-sm sm:text-base">
                  Crystal clear private audio calls for the poduri family. No camera, no pressure.
                </p>
             </div>

            <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
               <div className="relative group">
                 <input
                   type="text"
                   value={roomName}
                   onChange={(e) => setRoomName(e.target.value)}
                   placeholder="Enter room name..."
                   className="w-full bg-white/5 border-2 border-white/10 rounded-2xl sm:rounded-3xl px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-bold focus:outline-none focus:border-accent-blue focus:bg-white/10 transition-all placeholder:text-white/20"
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-white/10 rounded-xl border border-white/10 group-focus-within:border-accent-blue/50 transition-colors">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white/30 group-focus-within:text-accent-blue transition-colors" />
                 </div>
               </div>

               {activeRooms.length > 0 && (
                 <div className="space-y-3">
                   <p className="text-xs font-bold text-white/40 uppercase tracking-widest px-2">Active Family Rooms</p>
                   <div className="grid grid-cols-1 gap-2">
                     {activeRooms.map((room) => (
                       <button
                         key={room.name}
                         onClick={() => {
                           setRoomName(room.name);
                         }}
                         className="flex items-center justify-between p-3 sm:p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                           <span className="font-bold text-white/80 group-hover:text-white">{room.name}</span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className="text-xs font-bold text-white/40">{room.count}/8 Joined</span>
                           <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-accent-blue group-hover:translate-x-1 transition-all" />
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
               )}

               {error && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   className="space-y-3"
                 >
                   <div className="bg-red-400/10 p-4 rounded-2xl border border-red-400/20">
                     <p className="text-red-400 text-center font-bold text-sm">
                       {error}
                     </p>
                      {error.includes("microphone") && (
                        <div className="mt-3 text-[10px] text-red-400/60 font-medium leading-relaxed">
                          <p>• Ensure your browser has microphone permission.</p>
                          <p>• For APK: Go to Phone Settings → Apps → Poduris → Permissions → Enable Microphone.</p>
                        </div>
                      )}
                   </div>
                 </motion.div>
               )}

                {micPermission !== 'granted' && (
                  <button
                    onClick={requestMicAccess}
                    className="w-full bg-white/5 border-2 border-dashed border-accent-blue/30 hover:border-accent-blue/60 p-4 rounded-2xl flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center space-x-3">
                       <div className="p-2 bg-accent-blue/10 rounded-xl">
                          <Mic className="w-5 h-5 text-accent-blue" />
                       </div>
                       <div className="text-left">
                          <p className="font-bold text-sm text-white/80">Enable Microphone</p>
                          <p className="text-[10px] text-white/40">Required for audio calling</p>
                       </div>
                    </div>
                    <div className="px-3 py-1 bg-accent-blue/20 rounded-lg text-[10px] font-black text-accent-blue uppercase tracking-widest group-hover:bg-accent-blue group-hover:text-white transition-all">
                       Allow Access
                    </div>
                  </button>
                )}

                <button
                  onClick={() => startCall()}
                  disabled={!roomName.trim()}
                  className="w-full bg-gradient-to-tr from-accent-blue to-indigo-600 hover:from-accent-blue/90 hover:to-indigo-600/90 disabled:opacity-30 disabled:cursor-not-allowed py-5 rounded-3xl font-black text-xl shadow-2xl shadow-accent-blue/20 transition-all active:scale-95 flex items-center justify-center space-x-3"
                >
                  <span>{activeRooms.some(r => r.name === roomName) ? "Join Connection" : "Start Connection"}</span>
                  <Plus className="w-6 h-6" />
                </button>
            </div>

          </motion.div>
        ) : (
          <motion.div 
            key="call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            {/* Header */}
             <div className="flex justify-between items-center px-2">
                <div className="space-y-0.5">
                   <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight">{roomName}</h3>
                   </div>
                   <p className="text-[10px] sm:text-xs text-white/40 font-bold uppercase tracking-widest">{peers.length + 1} Members Active</p>
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4">
                   <div className="hidden xs:flex px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 items-center space-x-2">
                      <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-accent-blue" />
                      <span className="text-[10px] sm:text-xs font-bold text-white/60">Voice Mode</span>
                   </div>
                   <button 
                     onClick={endCall}
                     className="flex items-center space-x-1.5 sm:space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-red-500 hover:bg-red-600 rounded-xl sm:rounded-2xl font-bold transition-all shadow-lg shadow-red-500/30 text-sm sm:text-base"
                   >
                     <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-[135deg]" />
                     <span>Hang Up</span>
                   </button>
                </div>
             </div>

              <div className="flex-1 grid gap-3 sm:gap-8 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-6xl mx-auto w-full content-center px-1 sm:px-2">
              <VoiceTile
                id="local"
                index={0}
                isLocal
                name={user.nickname || user.name}
                avatar={user.avatar}
                stream={userStream!}
              />
              
              <AnimatePresence>
                {peers.map((peer, index) => (
                  <VoiceTile
                    key={peer.peerID}
                    id={peer.peerID}
                    index={index + 1}
                    name={peer.name}
                    avatar={peer.avatar}
                    stream={peer.stream}
                  />
                ))}
              </AnimatePresence>
            </div>

             <motion.div 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="fixed bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center p-2 sm:p-3 bg-black/60 backdrop-blur-2xl rounded-2xl sm:rounded-[32px] border border-white/10 shadow-3xl space-x-2 sm:space-x-4"
            >
               <button
                 onClick={toggleMute}
                 className={`p-3.5 sm:p-5 rounded-xl sm:rounded-3xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white'}`}
               >
                 {isMuted ? <MicOff className="w-6 h-6 sm:w-7 sm:h-7" /> : <Mic className="w-6 h-6 sm:w-7 sm:h-7" />}
               </button>
               
               <div className="flex flex-col items-center px-2 sm:px-4">
                  <div className="flex space-x-1 mb-1">
                     {[...Array(5)].map((_, i) => (
                        <motion.div
                           key={i}
                           animate={!isMuted ? { height: [4, 12, 4], transition: { duration: 0.6, repeat: Infinity, delay: i * 0.1 } } : { height: 2 }}
                           className={`w-1 ${isMuted ? 'bg-white/20' : 'bg-accent-blue'} rounded-full sm:w-1.5`}
                        />
                     ))}
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter text-white/40">
                    {isMuted ? 'Muted' : 'Speaking'}
                  </span>
               </div>

               <button
                 onClick={endCall}
                 className="p-3.5 sm:p-5 bg-red-500 text-white rounded-xl sm:rounded-3xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
               >
                 <Phone className="w-6 h-6 sm:w-7 sm:h-7 rotate-[135deg]" />
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
