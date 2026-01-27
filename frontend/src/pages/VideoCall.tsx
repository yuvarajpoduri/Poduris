import React from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../components/Layout";

const APP_ID = "vpaas-magic-cookie-0fa7884906584167b4b2f088143582e0";
const ROOM_NAME = "Poduris";

export const VideoCall: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center text-white">
        Please login.
      </div>
    );
  }

  return (
    <Layout>
      <div className="h-[80vh] w-full bg-gray-950 text-white overflow-hidden rounded-3xl border border-white/5 relative flex flex-col shadow-2xl">
        <JitsiMeeting
          domain="8x8.vc"
          roomName={`${APP_ID}/${ROOM_NAME}`}
          configOverwrite={{
            startWithAudioMuted: true,
            disableThirdPartyRequests: true,
            prejoinPageEnabled: true,
            // Colors and theming to better match the app
            defaultRemoteDisplayName: "Family Member",
          }}
          interfaceConfigOverwrite={{
            // Try to customize the interface to look cleaner
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "closedcaptions",
              "desktop",
              "fullscreen",
              "fodeviceselection",
              "hangup",
              "profile",
              "chat",
              "recording",
              "livestreaming",
              "etherpad",
              "sharedvideo",
              "settings",
              "raisehand",
              "videoquality",
              "filmstrip",
              "tileview",
              "videobackgroundblur",
              "download",
              "help",
              "mute-everyone",
            ],
          }}
          userInfo={{
            displayName: user.name || user.nickname || "Family Member",
            email: user.email,
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
            iframeRef.style.background = "#030712"; // matches bg-gray-950
          }}
        />
      </div>
    </Layout>
  );
};

