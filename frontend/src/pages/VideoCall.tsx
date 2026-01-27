import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { socket } from "../utils/socket";
import Peer from "simple-peer";
import { 
  Video, VideoOff, Mic, MicOff, Phone, 
  Users, Plus, 
  Pin, PinOff, Monitor, Settings, ArrowRight
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
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [pinnedUserId, setPinnedUserId] = useState<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeRooms, setActiveRooms] = useState<{ name: string, count: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketIdRef = useRef<string>();
  const peersRef = useRef<PeerState[]>([]);
  const userVideoRef = useRef<HTMLVideoElement>(null);

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

    return () => {
      socket.off("room-full");
      socket.off("active-rooms-update");
      clearInterval(interval);
      stopStream();
    };
  }, [inCall]);

  const stopStream = () => {
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop());
      setUserStream(null);
    }
  };

  const startCall = async () => {
    if (!roomName.trim()) return;
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera/Microphone access is not supported by your browser or requires a secure (HTTPS) connection.");
      return;
    }

    try {
      console.log("Requesting media devices...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });

      console.log("Media stream obtained:", stream.id);
      setUserStream(stream);
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }

      setInCall(true);

      socket.emit("join-room", {
        roomName,
        userName: user?.nickname || user?.name,
        userAvatar: user?.avatar
      });

      socket.on("all-users", (users: { id: string, name: string, avatar: string }[]) => {
        const peers: PeerState[] = [];
        users.forEach(u => {
          const peer = createPeer(u.id, stream);
          peersRef.current.push({
            peerID: u.id,
            peer,
            name: u.name,
            avatar: u.avatar
          });
          peers.push({
            peerID: u.id,
            peer,
            name: u.name,
            avatar: u.avatar
          });
        });
        setPeers(peers);
      });

      socket.on("user-joined", (payload: { signal: any, callerId: string, name: string, avatar: string }) => {
        const peer = addPeer(payload.signal, payload.callerId, stream);
        const peerObj = {
          peerID: payload.callerId,
          peer,
          name: payload.name,
          avatar: payload.avatar
        };
        peersRef.current.push(peerObj);
        setPeers(prev => [...prev, peerObj]);
      });

      socket.on("receiving-returned-signal", (payload: { signal: any, id: string }) => {
        const item = peersRef.current.find(p => p.peerID === payload.id);
        if (item) {
          item.peer.signal(payload.signal);
        }
      });

      socket.on("user-left", (id: string) => {
        const peerObj = peersRef.current.find(p => p.peerID === id);
        if (peerObj) {
          peerObj.peer.destroy();
        }
        const filteredPeers = peersRef.current.filter(p => p.peerID !== id);
        peersRef.current = filteredPeers;
        setPeers(filteredPeers);
        if (pinnedUserId === id) setPinnedUserId(null);
      });

    } catch (err: any) {
      console.error("Failed to get media devices:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera/Microphone permission denied. Please enable it in settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera or microphone found on this device.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError("Camera/Microphone is already in use by another app.");
      } else {
        setError(`Error: ${err.message || "Could not access camera/microphone. Please check permissions."}`);
      }
    }
  };

  const createPeer = (userToSignal: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("sending-signal", { userToSignal, callerId: socket.id, signal });
    });

    peer.on("stream", stream => {
      updatePeerStream(userToSignal, stream);
    });

    return peer;
  };

  const addPeer = (incomingSignal: any, callerId: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("returning-signal", { signal, callerId });
    });

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    peer.on("stream", stream => {
      updatePeerStream(callerId, stream);
    });

    return peer;
  };

  const updatePeerStream = (peerID: string, stream: MediaStream) => {
    setPeers(prev => prev.map(p => {
      if (p.peerID === peerID) {
        return { ...p, stream };
      }
      return p;
    }));
  };

  const endCall = () => {
    stopStream();
    socket.emit("leave-room");
    peersRef.current.forEach(p => p.peer.destroy());
    peersRef.current = [];
    setPeers([]);
    setInCall(false);
    setPinnedUserId(null);
    setIsScreenSharing(false);
  };

  const toggleMute = () => {
    if (userStream) {
      userStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (userStream) {
      userStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ cursor: true } as any);
        const videoTrack = screenStream.getVideoTracks()[0];
        
        peersRef.current.forEach(p => {
          if (userStream) {
            p.peer.replaceTrack(
              userStream.getVideoTracks()[0],
              videoTrack,
              userStream
            );
          }
        });

        videoTrack.onended = () => {
          stopScreenShare();
        };

        if (userVideoRef.current) {
          userVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (userStream && userVideoRef.current) {
      userVideoRef.current.srcObject = userStream;
      setIsScreenSharing(false);
    }
  };

  const VideoTile = ({ stream, name, avatar, isLocal, id, index }: { stream?: MediaStream, name: string, avatar?: string, isLocal?: boolean, id: string, index: number }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const borderColor = USER_COLORS[index % USER_COLORS.length];
    const bgColor = BG_COLORS[index % BG_COLORS.length];

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    const isPinned = pinnedUserId === id;

    return (
      <motion.div 
        layout
        className={`relative rounded-3xl overflow-hidden bg-gray-900 border-2 ${borderColor} shadow-2xl transition-all duration-500 group ${
          isPinned ? 'ring-4 ring-accent-blue ring-offset-4 ring-offset-gray-950' : ''
        }`}
      >
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center ${bgColor}`}>
            {avatar ? (
              <img src={avatar} alt={name} className="w-24 h-24 rounded-full object-cover border-4 border-white/10 shadow-2xl" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold text-white shadow-2xl">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="mt-4 text-white/50 font-medium text-sm uppercase tracking-widest">{isLocal ? "You" : name}</p>
          </div>
        )}

        {/* Overlay Info */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
          <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLocal ? 'bg-green-500' : 'bg-accent-blue'}`}></div>
            <span className="text-white text-xs font-bold">{isLocal ? "Me" : formatPoduriName(name)}</span>
          </div>
          
          <div className="flex space-x-2 pointer-events-auto">
             {!isLocal && (
               <button 
                 onClick={() => setPinnedUserId(isPinned ? null : id)}
                 className={`p-2 rounded-full backdrop-blur-md border border-white/10 transition-all ${
                   isPinned ? 'bg-accent-blue text-white' : 'bg-black/40 text-white/70 hover:bg-white hover:text-black'
                 }`}
                 title={isPinned ? "Unpin user" : "Pin user"}
               >
                 {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
               </button>
             )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col bg-gray-950 text-white rounded-[40px] overflow-hidden shadow-2xl border border-white/5 mx-auto max-w-7xl relative">
      <AnimatePresence mode="wait">
        {!inCall ? (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col items-center justify-center p-8 space-y-12"
          >
            <div className="text-center space-y-4">
               <div className="w-24 h-24 bg-gradient-to-tr from-accent-blue to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-accent-blue/20 rotate-12">
                 <Video className="w-12 h-12 text-white -rotate-12" />
               </div>
               <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-sm">
                 Family <span className="text-accent-blue italic">Studio</span>
               </h2>
               <p className="text-white/40 max-w-md mx-auto font-medium">
                 Connect with up to 8 family members in high-quality video. Secure, private, and smooth.
               </p>
            </div>

            <div className="w-full max-w-md space-y-6">
               <div className="relative group">
                 <input
                   type="text"
                   value={roomName}
                   onChange={(e) => setRoomName(e.target.value)}
                   placeholder="Enter room name..."
                   className="w-full bg-white/5 border-2 border-white/10 rounded-3xl px-8 py-5 text-lg font-bold focus:outline-none focus:border-accent-blue focus:bg-white/10 transition-all placeholder:text-white/20"
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-2xl border border-white/10 group-focus-within:border-accent-blue/50 transition-colors">
                    <Users className="w-5 h-5 text-white/30 group-focus-within:text-accent-blue transition-colors" />
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
                         className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
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
                     {error.includes("camera/microphone") && (
                       <div className="mt-3 text-[10px] text-red-400/60 font-medium leading-relaxed">
                         <p>• Ensure your browser has permission.</p>
                         <p>• For APK: Go to Phone Settings → Apps → Poduris → Permissions → Enable Camera & Microphone.</p>
                         <p>• Make sure no other app is using the camera.</p>
                       </div>
                     )}
                   </div>
                 </motion.div>
               )}

               <button
                 onClick={startCall}
                 disabled={!roomName.trim()}
                 className="w-full bg-gradient-to-tr from-accent-blue to-indigo-600 hover:from-accent-blue/90 hover:to-indigo-600/90 disabled:opacity-30 disabled:cursor-not-allowed py-5 rounded-3xl font-black text-xl shadow-2xl shadow-accent-blue/20 transition-all active:scale-95 flex items-center justify-center space-x-3"
               >
                 <span>{activeRooms.some(r => r.name === roomName) ? "Join Connection" : "Start Connection"}</span>
                 <Plus className="w-6 h-6" />
               </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl opacity-40">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-video bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center italic text-xs font-bold text-white/20 uppercase tracking-tighter">
                    Ready {i+1}
                  </div>
                ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4">
               <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                     <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></span>
                     <h3 className="text-xl font-bold tracking-tight">{roomName}</h3>
                  </div>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{peers.length + 1} Members Active</p>
               </div>
               
               <div className="flex items-center space-x-4">
                  <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all">
                     <Settings className="w-5 h-5 text-white/60" />
                  </button>
                  <button 
                    onClick={endCall}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/30"
                  >
                    <Phone className="w-4 h-4 rotate-[135deg]" />
                    <span>Leave</span>
                  </button>
               </div>
            </div>

            {/* Video Grid */}
            <div className={`flex-1 grid gap-6 ${
              pinnedUserId 
                ? 'grid-cols-4 grid-rows-4' 
                : peers.length === 0 
                  ? 'place-items-center' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              
              {/* Pinned View */}
              {pinnedUserId && (
                <div className="col-span-4 row-span-3">
                   {pinnedUserId === 'local' ? (
                      <VideoTile
                        id="local"
                        index={0}
                        isLocal
                        name={user.nickname || user.name}
                        avatar={user.avatar}
                        stream={userStream!}
                      />
                   ) : (
                      <VideoTile
                        id={pinnedUserId}
                        index={peers.findIndex(p => p.peerID === pinnedUserId) + 1}
                        name={peers.find(p => p.peerID === pinnedUserId)?.name || ""}
                        avatar={peers.find(p => p.peerID === pinnedUserId)?.avatar}
                        stream={peers.find(p => p.peerID === pinnedUserId)?.stream}
                      />
                   )}
                </div>
              )}

              {/* Normal Grid */}
              <AnimatePresence>
                {(!pinnedUserId || pinnedUserId !== 'local') && (
                  <VideoTile
                    id="local"
                    index={0}
                    isLocal
                    name={user.nickname || user.name}
                    avatar={user.avatar}
                    stream={userStream!}
                  />
                )}
                
                {peers.map((peer, index) => (
                  (pinnedUserId !== peer.peerID) && (
                    <VideoTile
                      key={peer.peerID}
                      id={peer.peerID}
                      index={index + 1}
                      name={peer.name}
                      avatar={peer.avatar}
                      stream={peer.stream}
                    />
                  )
                ))}
              </AnimatePresence>
            </div>

            {/* Floating Controls */}
            <motion.div 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center p-2 bg-black/60 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-3xl space-x-2"
            >
               <button
                 onClick={toggleMute}
                 className={`p-4 rounded-3xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'hover:bg-white/10 text-white'}`}
               >
                 {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
               </button>
               <button
                 onClick={toggleVideo}
                 className={`p-4 rounded-3xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'hover:bg-white/10 text-white'}`}
               >
                 {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
               </button>
               <div className="w-px h-10 bg-white/10 mx-2"></div>
               <button
                 onClick={toggleScreenShare}
                 className={`p-4 rounded-3xl transition-all ${isScreenSharing ? 'bg-accent-blue text-white' : 'hover:bg-white/10 text-white'}`}
               >
                 <Monitor className="w-6 h-6" />
               </button>
               <button
                 onClick={() => setPinnedUserId(pinnedUserId === 'local' ? null : 'local')}
                 className={`p-4 rounded-3xl transition-all ${pinnedUserId === 'local' ? 'bg-accent-blue text-white' : 'hover:bg-white/10 text-white'}`}
               >
                 <Pin className="w-6 h-6" />
               </button>
               <button
                 onClick={endCall}
                 className="p-4 bg-red-500 text-white rounded-3xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20"
               >
                 <Phone className="w-6 h-6 rotate-[135deg]" />
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
