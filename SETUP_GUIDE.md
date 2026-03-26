# Setup Guide

This project currently runs as an Expo preview app on the `main` branch.

## Requirements

- Node.js 18 or newer
- npm
- Expo-compatible Android emulator, iOS simulator, or Expo Go

## Install

```bash
npm install
```

## Start The App

```bash
npx expo start
```

Optional shortcuts:

```bash
npm run android
npm run ios
npm run web
```

## What To Expect On `main`

- A role picker landing screen
- Preview flows for farmer, trader, and transporter roles
- Local language persistence via AsyncStorage
- Mock data in most dashboards and screens
- A crop service layer with demo fallback for farmer crop flows
- An optional backend prototype under `backend/`

## What Is Not On `main`

- Production login or OTP auth
- Real-time Socket.IO integration
- A production-ready backend deployment

## Branch-Specific Note

`origin/mahek-dev` introduced the crop backend spike. Current `main` now includes a cleaned version of that work, but the original branch is still an older divergence point and should not be merged blindly.
