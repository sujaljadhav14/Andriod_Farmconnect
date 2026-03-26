# FarmConnect Mobile

FarmConnect Mobile is an Expo + React Native application for agricultural marketplace workflows. The app currently supports role-based preview flows for farmers, traders, and transporters, with a cleaned crop-management integration and an optional backend prototype for crop data.

## Overview

This repository contains:

- A mobile app built with Expo and React Native
- Role-based navigation for farmer, trader, and transporter flows
- Localized UI using JSON translation files and AsyncStorage
- A farmer crop flow that works in demo mode by default
- An optional Node.js + Express + MongoDB backend for crop data

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81
- React Navigation 7
- AsyncStorage
- Express
- MongoDB with Mongoose

## Project Structure

```text
Andriod_Farmconnect/
├── backend/                  Optional crop backend prototype
├── src/
│   ├── constants/            Shared constants
│   ├── context/              React context providers
│   ├── navigation/           App and role navigators
│   ├── screens/
│   │   ├── farmer/           Farmer screens
│   │   ├── trader/           Trader screens
│   │   └── transport/        Transport screens
│   ├── services/             App-side service helpers
│   ├── translations/         Translation JSON files
│   ├── transport/            Transport dashboard module
│   └── App.js                Root app component
├── app.json
├── index.js
└── package.json
```

## Current App State

- The app runs on `main` as a working preview branch
- Farmer, trader, and transporter flows are available
- Most screens are still prototype/demo oriented
- Farmer crop creation and listing are integrated
- Crop data uses demo fallback unless a backend URL is configured

## Mobile Setup

### Requirements

- Node.js 18 or newer
- npm
- Expo-compatible Android emulator, iOS simulator, or Expo Go

### Install

```bash
npm install
```

### Start The App

```bash
npx expo start
```

### Platform Commands

```bash
npm run android
npm run ios
npm run web
```

## Backend Setup

The backend is optional. The mobile app can still run without it in demo mode.

### Backend Location

- `backend/server.js`
- `backend/models/Crop.js`
- `backend/.env.example`

### Start Backend

```bash
cd backend
npm install
npm start
```

### Backend Environment

Create `backend/.env` and set:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5050
```

## Connecting The App To Backend

The farmer crop flow uses:

- `src/services/cropService.js`

Update `CROP_API_BASE_URL` in that file to point to your running backend.

Examples:

- Android emulator: `http://10.0.2.2:5050`
- Physical phone on same Wi-Fi: `http://YOUR_PC_LOCAL_IP:5050`

If `CROP_API_BASE_URL` is empty, the app uses demo mode.

## Recommended UI Test Flow

1. Start the backend if you want real crop persistence.
2. Start the Expo app.
3. Open the app and choose `Farmer`.
4. Open `My Crops`.
5. Tap the `+` button.
6. Add a crop.
7. Return to `My Crops` and verify the item appears.
8. Reload the app and confirm the crop still exists if backend mode is enabled.

## Known Limitations

- Several screens still use mock or preview data
- Translation coverage is partial across the app
- Transport code is split across two areas of `src/`
- The backend is a focused crop prototype, not a full production API

## Branch Note

The current `main` branch contains a selective integration of the useful crop-flow work from `mahek-dev`. That older branch was not merged blindly because it diverged before newer UI work landed on `main`.
