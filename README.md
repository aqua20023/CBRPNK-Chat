# CBRPNK Chat

React Native chat app scaffold shaped around the industrial cyberpunk reference board you shared: heavy condensed typography, rounded telemetry cards, ink-black canvas, and a muted mustard / olive / salmon / fog palette.

## What is already built

- A fresh Expo-based React Native shell
- Responsive inbox and conversation layouts
- Foldered inbox categories like Telegram
- Search for chats and in-thread content
- Message states: sent, delivered, seen
- Typing indicator and online/offline presence cues
- Reply flow, reactions, forward, edit, delete, and pin interactions
- Voice note, file, poll, location, and link-preview message cards
- Call overlay for voice/video/screen-share entry points
- Theme toggle that keeps the same visual language across dark and light modes

## Suggested production stack for the remaining backend work

- Realtime messaging: `Socket.io`, `Firebase`, or `Supabase Realtime`
- Push notifications: `expo-notifications`
- Media uploads and file previews: object storage plus signed URLs
- Voice/video/screen sharing: `LiveKit`, `Daily`, or custom WebRTC SFU
- Auth and presence: Firebase Auth, Clerk, Supabase Auth, or your own JWT backend

## Project structure

- [App.js](</C:/Users/JAI VERMA/Documents/New project/App.js>)
- [src/screens/CyberChatApp.js](</C:/Users/JAI VERMA/Documents/New project/src/screens/CyberChatApp.js>)
- [src/components/MessageBubble.js](</C:/Users/JAI VERMA/Documents/New project/src/components/MessageBubble.js>)
- [src/components/ComposerDock.js](</C:/Users/JAI VERMA/Documents/New project/src/components/ComposerDock.js>)
- [src/theme/theme.js](</C:/Users/JAI VERMA/Documents/New project/src/theme/theme.js>)
- [src/data/mockData.js](</C:/Users/JAI VERMA/Documents/New project/src/data/mockData.js>)

## Run locally

1. Install dependencies with `npm install`
2. Start Expo with `npx expo start`
3. Open Android, iOS, or web from the Expo dev tools

## Next build steps

1. Wire the UI state to a real backend for live messages, receipts, and presence.
2. Add auth, profile setup, and media upload flows.
3. Replace the call overlay with a proper WebRTC room implementation.
4. Add animations, haptics, and custom font assets to push the aesthetic even further.
