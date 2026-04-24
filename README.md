# CBRPNK Chat

React Native chat app scaffold shaped around the industrial cyberpunk reference board you shared: heavy condensed typography, rounded telemetry cards, ink-black canvas, and a muted mustard / olive / salmon / fog palette.

## What is already built

- A fresh Expo-based React Native shell
- A dedicated `Chats` tab for personal and group conversations
- Custom chat list filters for friends, groups, unread, priority, and pinned threads
- Search for chats and in-thread content
- Message states: sent, delivered, seen
- Typing indicator and online/offline presence cues
- Reply flow, reactions, forward, edit, delete, and pin interactions
- Voice note, file, poll, location, and link-preview message cards
- Call overlay for voice/video/screen-share entry points
- Theme toggle that keeps the same visual language across dark and light modes
- Frontend API and Socket.io connection scaffolding
- A full `/backend` service with MongoDB, JWT auth, Socket.io, Cloudinary hooks, and FCM hooks

## Project structure

- [App.js](</C:/Users/JAI VERMA/Documents/New project/App.js>)
- [src/screens/CyberChatApp.js](</C:/Users/JAI VERMA/Documents/New project/src/screens/CyberChatApp.js>)
- [src/components/MessageBubble.js](</C:/Users/JAI VERMA/Documents/New project/src/components/MessageBubble.js>)
- [src/components/ComposerDock.js](</C:/Users/JAI VERMA/Documents/New project/src/components/ComposerDock.js>)
- [src/config/network.js](</C:/Users/JAI VERMA/Documents/New project/src/config/network.js>)
- [src/services/chatApi.js](</C:/Users/JAI VERMA/Documents/New project/src/services/chatApi.js>)
- [src/services/socketClient.js](</C:/Users/JAI VERMA/Documents/New project/src/services/socketClient.js>)
- [src/theme/theme.js](</C:/Users/JAI VERMA/Documents/New project/src/theme/theme.js>)
- [src/data/mockData.js](</C:/Users/JAI VERMA/Documents/New project/src/data/mockData.js>)
- [backend/src/index.js](</C:/Users/JAI VERMA/Documents/New project/backend/src/index.js>)
- [backend/src/controllers](</C:/Users/JAI VERMA/Documents/New project/backend/src/controllers>)
- [backend/src/models](</C:/Users/JAI VERMA/Documents/New project/backend/src/models>)
- [backend/src/routes](</C:/Users/JAI VERMA/Documents/New project/backend/src/routes>)
- [backend/src/sockets](</C:/Users/JAI VERMA/Documents/New project/backend/src/sockets>)
- [backend/.env.example](</C:/Users/JAI VERMA/Documents/New project/backend/.env.example>)

## Run locally

### Backend

1. Copy `backend/.env.example` to `backend/.env`
2. Fill in `MONGODB_URI`, `JWT_SECRET`, and any optional Cloudinary or Firebase credentials
3. Start MongoDB
4. Run `cd backend`
5. Run `npm install`
6. Run `npm run dev`

### Frontend

1. Install dependencies with `npm install`
2. If you are testing on a physical phone, update `BACKEND_HOST` in [src/config/network.js](</C:/Users/JAI VERMA/Documents/New project/src/config/network.js>) to your computer's LAN IP
3. Start Expo with `npx expo start`
4. Open Android with `npx expo start --android` or web with `npx expo start --web`

## Notes

- Use `npx expo ...`, not `expo ...`, unless you have Expo CLI installed globally.
- If Expo Go says the project is incompatible, update Expo Go from the Play Store before scanning the QR code again.
- Do not run a second `npm audit fix --force` here. The current audit output shows that it would downgrade Expo to `46.0.21`, which would break this SDK 55 project.
- The default Android emulator backend host is `10.0.2.2`. A physical device needs your computer's real LAN IP instead.

## Next build steps

1. Replace the seeded frontend state with live auth, chat, and message queries from the new backend.
2. Add a real sign-in and register flow that stores the JWT and opens the socket connection.
3. Replace the call overlay with a proper WebRTC room implementation.
4. Add animations, haptics, and custom font assets to push the aesthetic even further.
