---
description: How to maintain and test WebRTC video calls in a Mobile WebView/APK environment.
---

# WebRTC Mobile WebView Maintenance Workflow

Follow these steps when updating the Video Call feature to ensure it remains compatible with Android APKs.

## 1. Media Stream Handling
- Always call `track.stop()` on all tracks before requesting a new stream.
- Store the stream in a `useRef` to ensure it can be accessed for cleanup even if the component state is lagging.
- Use `pagehide` and `beforeunload` events to clean up streams when the user closes the app or navigates away.

## 2. Testing in APK (AppsGeyser)
1. Generate the APK with **Camera** and **Microphone** permissions enabled in the AppsGeyser dashboard.
2. Install the APK on a physical Android device (Emulators often have WebRTC issues).
3. **Permission Check**: Go to `Settings > Apps > [Your App] > Permissions` and ensure Camera and Mic are "Allowed".
4. **Conflict Test**:
   - Open the System Camera app, then switch to your app and try to start a call. It should show a clear "Already in use" error.
   - Close the System Camera and try again. It should work.
5. **Background Test**:
   - While in a call, press the Home button.
   - Wait 10 seconds.
   - Re-open the app. The tracks should have been cleaned up or handle reconnection gracefully.

## 3. Common Issues & Fixes
| Issue | Potential Cause | Fix |
|-------|-----------------|-----|
| "In use by another app" | Orphaned tracks from previous session | Call `.stop()` on all tracks in `useEffect` cleanup. |
| Black screen | Autoplay restriction | Add `playsInline` and `muted` to the `<video>` tag. |
| Cannot connect | Symmetric NAT / Firewall | Ensure STUN/TURN servers are configured in the Peer object. |
| Low quality | High resolution request | Use `ideal: 640x480` for best compatibility on mobile. |
