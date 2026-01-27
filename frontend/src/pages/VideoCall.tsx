import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { socket } from "../utils/socket";
import Peer from "simple-peer";
import { Mic, MicOff, Phone, Users, Plus, ArrowRight, Activity, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPoduriName } from "../utils/formatUtils";
import { Buffer } from 'buffer';

// ============================================
// POLYFILLS - Mandatory for WebView/APK
// ============================================
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
  (window as any).process = { env: {}, browser: true };
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
// CONSTANTS
// ============================================
const MAX_PARTICIPANTS = 8;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const COLORS = [
  { border: 'border-indigo-500', bg: 'bg-indigo-500/20' },
  { border: 'border-emerald-500', bg: 'bg-emerald-500/20' },
  { border: 'border-rose-500', bg: 'bg-rose-500/20' },
  { border: 'border-amber-500', bg: 'bg-amber-500/20' },
  { border: 'border-cyan-500', bg: 'bg-cyan-500/20' },
  { border: 'border-fuchsia-500', bg: 'bg-fuchsia-500/20' },
  { border: 'border-violet-500', bg: 'bg-violet-500/20' },
  { border: 'border-sky-500', bg: 'bg-sky-500/20' },
];

// ============================================
// MAIN COMPONENT
// ============================================
export const VideoCall: React.FC = () => {
  const { user } = useAuth();
  
  // --- Core State ---
  const [phase, setPhase] = useState<'lobby' | 'connecting' | 'incall'>('lobby');
  const [roomName, setRoomName] = useState('');
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);

  // --- Refs (stable across renders) ---
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<PeerData[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // ============================================
  // CLEANUP UTILITIES
  // ============================================
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[VoiceCall] Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const destroyAllPeers = useCallback(() => {
    peersRef.current.forEach(p => {
      try {
        p.peer.destroy();
      } catch (e) {
        console.warn('[VoiceCall] Peer destroy error:', e);
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
    setIsMuted(false);
    setActiveSpeaker(null);
  }, [destroyAllPeers, stopLocalStream]);

  // ============================================
  // PEER CREATION
  // ============================================
  const createPeer = useCallback((targetId: string, stream: MediaStream, isInitiator: boolean, incomingSignal?: any): Peer.Instance => {
    console.log(`[VoiceCall] Creating peer for ${targetId}, initiator: ${isInitiator}`);
    
    const peer = new Peer({
      initiator: isInitiator,
      trickle: false,
      stream,
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
      console.log('[VoiceCall] Received remote stream from:', targetId);
      // Update the peer's stream in our ref and state
      peersRef.current = peersRef.current.map(p => 
        p.peerId === targetId ? { ...p, stream: remoteStream } : p
      );
      setPeers([...peersRef.current]);
    });

    peer.on('error', (err) => {
      console.error('[VoiceCall] Peer error:', err.message);
    });

    peer.on('close', () => {
      console.log('[VoiceCall] Peer closed:', targetId);
    });

    // If we're answering, signal with the incoming offer
    if (!isInitiator && incomingSignal) {
      try {
        peer.signal(incomingSignal);
      } catch (e) {
        console.error('[VoiceCall] Error signaling peer:', e);
      }
    }

    return peer;
  }, []);

  // ============================================
  // VOICE ACTIVITY DETECTION (simple)
  // ============================================
  const setupVoiceDetection = useCallback((stream: MediaStream, id: string) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      const source = ctx.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const check = () => {
        if (!localStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        
        if (avg > 25) {
          setActiveSpeaker(id);
        }
        
        requestAnimationFrame(check);
      };
      check();
    } catch (e) {
      console.warn('[VoiceCall] Voice detection setup failed:', e);
    }
  }, []);

  // ============================================
  // SOCKET EVENT HANDLERS
  // ============================================
  useEffect(() => {
    const handleConnect = () => {
      console.log('[VoiceCall] Socket connected:', socket.id);
      socket.emit('get-active-rooms');
    };

    const handleActiveRooms = (rooms: ActiveRoom[]) => {
      console.log('[VoiceCall] Active rooms:', rooms);
      setActiveRooms(rooms);
    };

    const handleRoomFull = () => {
      setError(`Room is full (max ${MAX_PARTICIPANTS} members). Try another room.`);
      fullCleanup();
    };

    const handleAllUsers = (users: { id: string; name: string; avatar?: string }[]) => {
      console.log('[VoiceCall] Existing users in room:', users.length);
      
      // Wait a bit for stream to be ready if needed
      const tryConnect = () => {
        const stream = localStreamRef.current;
        if (!stream) {
          console.log('[VoiceCall] Waiting for local stream...');
          setTimeout(tryConnect, 100);
          return;
        }

        // Create peer connections to all existing users
        users.forEach(u => {
          if (peersRef.current.find(p => p.peerId === u.id)) return;
          
          const peer = createPeer(u.id, stream, true);
          const peerData: PeerData = {
            peerId: u.id,
            peer,
            userName: u.name,
            userAvatar: u.avatar,
          };
          peersRef.current.push(peerData);
        });
        setPeers([...peersRef.current]);
      };
      
      tryConnect();
    };

    const handleUserJoined = (payload: { signal: any; callerId: string; name: string; avatar?: string }) => {
      console.log('[VoiceCall] New user joined:', payload.name);
      
      const tryAnswer = () => {
        const stream = localStreamRef.current;
        if (!stream) {
          console.log('[VoiceCall] Waiting for stream to answer...');
          setTimeout(tryAnswer, 100);
          return;
        }

        // Check if peer already exists
        const existing = peersRef.current.find(p => p.peerId === payload.callerId);
        if (existing) {
          if (payload.signal) {
            try {
              existing.peer.signal(payload.signal);
            } catch (e) {}
          }
          return;
        }

        // Create answering peer
        const peer = createPeer(payload.callerId, stream, false, payload.signal);
        const peerData: PeerData = {
          peerId: payload.callerId,
          peer,
          userName: payload.name,
          userAvatar: payload.avatar,
        };
        peersRef.current.push(peerData);
        setPeers([...peersRef.current]);
      };
      
      tryAnswer();
    };

    const handleReturnedSignal = (payload: { signal: any; id: string }) => {
      console.log('[VoiceCall] Returned signal from:', payload.id);
      const item = peersRef.current.find(p => p.peerId === payload.id);
      if (item) {
        try {
          item.peer.signal(payload.signal);
        } catch (e) {
          console.error('[VoiceCall] Error on returned signal:', e);
        }
      }
    };

    const handleUserLeft = (userId: string) => {
      console.log('[VoiceCall] User left:', userId);
      const peerObj = peersRef.current.find(p => p.peerId === userId);
      if (peerObj) {
        try {
          peerObj.peer.destroy();
        } catch (e) {}
      }
      peersRef.current = peersRef.current.filter(p => p.peerId !== userId);
      setPeers([...peersRef.current]);
    };

    // Register all listeners
    socket.on('connect', handleConnect);
    socket.on('active-rooms-update', handleActiveRooms);
    socket.on('room-full', handleRoomFull);
    socket.on('all-users', handleAllUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('receiving-returned-signal', handleReturnedSignal);
    socket.on('user-left', handleUserLeft);

    // Initial fetch if already connected
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup on unmount
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

  // ============================================
  // VISIBILITY CHANGE HANDLER (Mobile APK critical)
  // ============================================
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && phase === 'incall') {
        console.log('[VoiceCall] App backgrounded - ending call');
        fullCleanup();
      }
      if (document.visibilityState === 'visible') {
        socket.emit('get-active-rooms');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', fullCleanup);
    window.addEventListener('beforeunload', fullCleanup);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', fullCleanup);
      window.removeEventListener('beforeunload', fullCleanup);
    };
  }, [phase, fullCleanup]);

  // ============================================
  // JOIN CALL
  // ============================================
  const joinCall = async () => {
    if (!roomName.trim()) return;
    
    setError(null);
    setPhase('connecting');
    
    // Clean any previous state
    stopLocalStream();
    destroyAllPeers();

    try {
      console.log('[VoiceCall] Requesting microphone...');
      
      // Request microphone with mobile-friendly constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Lower sample rate for better mobile compatibility
          sampleRate: 22050,
        },
        video: false,
      });

      console.log('[VoiceCall] Microphone access granted');
      localStreamRef.current = stream;

      // Setup voice detection
      setupVoiceDetection(stream, 'local');

      // Join the socket room
      socket.emit('join-room', {
        roomName: roomName.trim(),
        userName: user?.nickname || user?.name || 'Guest',
        userAvatar: user?.avatar,
      });

      // Transition to incall immediately - don't wait for all-users
      setPhase('incall');

    } catch (err: any) {
      console.error('[VoiceCall] Microphone error:', err);
      
      let message = 'Could not access microphone.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Microphone permission denied. Please allow access in your device settings.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Microphone is in use by another app. Close other apps and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No microphone found on this device.';
      }
      
      setError(message);
      setPhase('lobby');
    }
  };

  // ============================================
  // TOGGLE MUTE
  // ============================================
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  // ============================================
  // UI COMPONENTS
  // ============================================
  const ParticipantTile: React.FC<{
    name: string;
    avatar?: string;
    stream?: MediaStream;
    isLocal?: boolean;
    isSpeaking?: boolean;
    colorIndex: number;
  }> = ({ name, avatar, stream, isLocal, isSpeaking, colorIndex }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const color = COLORS[colorIndex % COLORS.length];

    useEffect(() => {
      if (audioRef.current && stream && !isLocal) {
        audioRef.current.srcObject = stream;
        audioRef.current.play().catch(() => {});
      }
    }, [stream, isLocal]);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`
          relative aspect-square rounded-3xl overflow-hidden 
          bg-gray-900 border-2 ${color.border}
          flex flex-col items-center justify-center
          ${isSpeaking ? 'ring-4 ring-green-500/50 scale-105' : ''}
          transition-transform duration-200
        `}
      >
        {!isLocal && stream && <audio ref={audioRef} autoPlay playsInline />}
        
        <div className={`w-full h-full flex flex-col items-center justify-center ${color.bg}`}>
          {/* Avatar */}
          <div className="relative">
            {avatar ? (
              <img 
                src={avatar} 
                alt={name} 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white/10"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                <Activity className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          
          {/* Name */}
          <p className="mt-3 text-xs sm:text-sm font-bold text-white/70 text-center px-2 truncate max-w-full">
            {isLocal ? 'You' : formatPoduriName(name)}
          </p>
          
          {/* Sound bars for speaking */}
          {isSpeaking && (
            <div className="flex gap-0.5 mt-2">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [4, 12, 4] }}
                  transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.1 }}
                  className="w-1 bg-green-500 rounded-full"
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ============================================
  // RENDER LOGIC
  // ============================================
  if (!user) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-950 text-white">
        <p>Please log in to use Voice Call.</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] sm:min-h-[calc(100vh-120px)] flex flex-col bg-gray-950 text-white sm:rounded-[40px] overflow-hidden border border-white/5 max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {/* ========== LOBBY VIEW ========== */}
        {phase === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-6 gap-8"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[28px] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/30 rotate-6">
                <Mic className="w-12 h-12 text-white -rotate-6" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black">
                Family <span className="text-indigo-400">Voice</span>
              </h1>
              <p className="text-white/40 max-w-xs mx-auto text-sm">
                Private audio calls for the family. Simple and secure.
              </p>
            </div>

            {/* Room Input */}
            <div className="w-full max-w-sm space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name..."
                  className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-lg font-medium focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all placeholder:text-white/20"
                />
                <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              </div>

              {/* Active Rooms */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Active Rooms</span>
                  <button
                    onClick={() => socket.emit('get-active-rooms')}
                    className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                </div>

                {activeRooms.length > 0 ? (
                  <div className="space-y-2">
                    {activeRooms.map((room) => (
                      <button
                        key={room.name}
                        onClick={() => setRoomName(room.name)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="font-bold text-white/80">{room.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white/40">{room.count}/{MAX_PARTICIPANTS}</span>
                          <ArrowRight className="w-4 h-4 text-white/20" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white/5 border border-dashed border-white/10 rounded-xl">
                    <p className="text-xs font-medium text-white/30 text-center">No active rooms</p>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                      <p className="text-red-400/60 text-xs mt-1">
                        For APK: Settings → Apps → Poduris → Permissions → Microphone
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Join Button */}
              <button
                onClick={joinCall}
                disabled={!roomName.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {activeRooms.some(r => r.name === roomName) ? 'Join Room' : 'Create Room'}
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========== CONNECTING VIEW ========== */}
        {phase === 'connecting' && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6"
          >
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Connecting...</h2>
              <p className="text-white/40 text-sm mt-1">Joining "{roomName}"</p>
            </div>
          </motion.div>
        )}

        {/* ========== IN-CALL VIEW ========== */}
        {phase === 'incall' && (
          <motion.div
            key="incall"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-4 sm:p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <h2 className="text-lg sm:text-xl font-bold">{roomName}</h2>
                </div>
                <p className="text-xs text-white/40 mt-0.5">{peers.length + 1} in call</p>
              </div>
              
              <button
                onClick={fullCleanup}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-sm transition-all"
              >
                <Phone className="w-4 h-4 rotate-[135deg]" />
                <span className="hidden sm:inline">Leave</span>
              </button>
            </div>

            {/* Participants Grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 content-center max-w-4xl mx-auto w-full">
              {/* Local User */}
              <ParticipantTile
                name={user.nickname || user.name}
                avatar={user.avatar}
                isLocal
                isSpeaking={activeSpeaker === 'local'}
                colorIndex={0}
              />
              
              {/* Remote Peers */}
              {peers.map((peer, index) => (
                <ParticipantTile
                  key={peer.peerId}
                  name={peer.userName}
                  avatar={peer.userAvatar}
                  stream={peer.stream}
                  isSpeaking={activeSpeaker === peer.peerId}
                  colorIndex={index + 1}
                />
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all ${
                  isMuted 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* Status */}
              <div className="text-center px-2">
                <div className="flex gap-1 justify-center mb-1">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={!isMuted ? { height: [3, 10, 3] } : { height: 3 }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      className={`w-1 rounded-full ${isMuted ? 'bg-white/20' : 'bg-indigo-400'}`}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase">
                  {isMuted ? 'Muted' : 'Live'}
                </span>
              </div>

              {/* Hang Up */}
              <button
                onClick={fullCleanup}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
              >
                <Phone className="w-6 h-6 rotate-[135deg]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
