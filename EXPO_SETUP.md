# Expo Setup Guide

## What is Expo?

Expo is a framework and platform for React Native that makes mobile app development easier. You don't need Android Studio or Xcode to get started!

## Quick Start

### 1. Install Expo CLI (if not already installed)
```bash
npm install -g expo-cli
```

### 2. Start the development server
```bash
npm start
```

This will:
- Start Metro bundler
- Show a QR code in terminal
- Open Expo DevTools in browser

### 3. Test on Your Phone (Easiest Method)

**For Android:**
1. Install "Expo Go" app from Google Play Store
2. Open Expo Go app
3. Scan the QR code from terminal/browser
4. App loads instantly!

**For iOS:**
1. Install "Expo Go" app from App Store
2. Open Expo Go app
3. Scan the QR code from terminal/browser
4. App loads instantly!

### 4. Test on Emulator

**Android Emulator:**
```bash
npm run android
```
(Make sure Android Studio emulator is running)

**iOS Simulator (Mac only):**
```bash
npm run ios
```

## Development Workflow

1. **Start Expo**: `npm start`
2. **Make changes** to your code
3. **See updates instantly** - Expo reloads automatically
4. **Shake device** or press `r` in terminal to reload manually

## Building for Production

When ready to build APK/IPA:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK (Android)
eas build --platform android --profile preview

# Build IPA (iOS)
eas build --platform ios --profile preview
```

## Troubleshooting

**Issue: Metro bundler not starting**
- Clear cache: `npm start -- --reset-cache`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Issue: Can't connect to Expo Go**
- Make sure phone and computer are on same WiFi network
- Try tunnel mode: `npm start -- --tunnel`

**Issue: App not updating**
- Shake device and tap "Reload"
- Or press `r` in terminal

## Benefits Over React Native CLI

✅ No Android Studio/Xcode setup  
✅ Test on real device instantly  
✅ Share app with QR code  
✅ Over-the-air updates  
✅ Easier asset management  
✅ Built-in APIs (camera, location, etc.)

