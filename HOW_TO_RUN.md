# FarmConnect Mobile App — How To Run

> **React Native (Expo SDK 54) + Node.js backend + MongoDB**

---

## Prerequisites

| Tool | Version | Check with |
|------|---------|-----------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| MongoDB | Running locally | `mongosh` or MongoDB Compass |
| Expo Go app | Latest | Install on Android/iOS from app store |

---

## Step 1 — Find Your Local IP (REQUIRED for physical device)

Open **Command Prompt** and run:
```
ipconfig
```
Look for **IPv4 Address** under your active WiFi adapter, e.g. `192.168.0.103`.

Then open `src/config/api.js` and update **both** lines:
```js
export const API_BASE_URL = 'http://YOUR_IP:5050'; // <-- UPDATE THIS
export const SOCKET_URL   = 'http://YOUR_IP:5050'; // <-- UPDATE THIS
```

> ⚠️ **Do this every time your IP changes** (e.g. reconnected to WiFi, different network).  
> Your IP **will change** if you restart your router or connect to a different network.

---

## Step 2 — Start MongoDB

Make sure MongoDB is running on the default port `27017`.

```bash
# If installed as a Windows service, it may already be running.
# Otherwise start it manually:
mongod --dbpath "C:\data\db"
```

Or use **MongoDB Compass** and connect to `mongodb://127.0.0.1:27017`.

---

## Step 3 — Start the Backend Server

Open a **new terminal** in the project folder:

```bash
cd backend
npm install        # Only needed on first run
npm start          # or: node server.js
```

**Expected output:**
```
Server running on port 5050
MongoDB connected
```

> Backend runs on **port 5050**.  
> Backend URL: `http://YOUR_IP:5050`  
> Health check: `http://YOUR_IP:5050/health`

---

## Step 4 — Start the Expo (React Native) Frontend

Open a **separate terminal** in the project root:

```bash
npx expo start
```

Then on your phone:
1. Open the **Expo Go** app
2. Scan the **QR code** shown in the terminal
3. The app will bundle and launch on your device

> ⚠️ Your phone and your PC **must be on the same WiFi network**.

---

## Credentials for Testing

| Role | Phone | Password |
|------|-------|----------|
| Admin | `9999999999` | `admin123` |
| Any other | Register a new account | — |

---

## Known Errors & What They Mean

| Error | Cause | Fix |
|-------|-------|-----|
| `API Error [/api/auth/profile]: Route not found` | ~~Wrong endpoint~~ | ✅ Fixed — now uses `/api/auth/me` |
| `Couldn't find screen named 'AdminMain'` | Admin navigator not built yet | ✅ Fixed — admin falls back to RolePicker |
| `Socket connection error: websocket error` | Socket.IO server not implemented | ⏳ Non-fatal, ignore until Phase 9 |
| `ECONNREFUSED` or `Network Error` | Backend not running OR wrong IP | Start backend & check your IP in `api.js` |
| `MongoNetworkError` | MongoDB not running | Start MongoDB first |

---

## Project Structure (Quick Reference)

```
Andriod_Farmconnect/
├── backend/              ← Node.js + Express backend
│   ├── server.js         ← Main server (all routes in one file)
│   ├── models/           ← Mongoose models (User, Crop, Proposal, Order)
│   ├── .env              ← MongoDB URI, JWT secret, port
│   └── uploads/          ← Uploaded images stored here
├── src/
│   ├── config/
│   │   ├── api.js        ← ⚠️ UPDATE IP HERE when WiFi changes
│   │   └── constants.js  ← App-wide constants
│   ├── services/         ← API service layers
│   ├── screens/          ← All UI screens
│   ├── navigation/       ← React Navigation setup
│   └── context/          ← Auth & App context
├── context/
│   ├── PROGRESS_TRACKER.md  ← Development progress log
│   └── AGENT_HANDOFF.md     ← Context for next dev session
└── HOW_TO_RUN.md            ← This file
```

---

## Development Progress

Phases completed through March 2026:

| Phase | Status |
|-------|--------|
| 0. Foundation (API, Auth, Navigation) | ✅ Done |
| 1. Authentication (Login/Register/OTP) | ✅ Done |
| 2. Crop Management | ✅ Done |
| 3. Proposals System | ✅ Done |
| 4. Orders System | ✅ Done |
| 5. Transport Module | ⏳ Not started |
| 6. Payment Tracking | ⏳ Not started |
| 7. Additional Features (Weather, Market…) | ⏳ Not started |
| 8. Admin Dashboard | ⏳ Not started |
| 9. Real-time / Socket.IO | ⏳ Not started |

---

## Quick Troubleshooting Checklist

If the app doesn't connect to the backend on your phone:

- [ ] Is MongoDB running? (`mongosh` or check Compass)
- [ ] Is the backend running? (Terminal shows `Server running on port 5050`)
- [ ] Is your phone on the **same WiFi** as your PC?
- [ ] Did you update the IP in `src/config/api.js`? Run `ipconfig` to check.
- [ ] Is port `5050` blocked by Windows Firewall? Try `http://YOUR_IP:5050/health` in phone browser.
