# FarmConnect - React Native Mobile App (Expo)

A React Native mobile application built with Expo for agricultural commerce platform connecting Farmers, Traders, and Transporters.

## Project Structure

```
Andriod_Farmconnect/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ screens/          # All screen components
â”‚   â”‚   â”œâ”€â”€ auth/         # Login, Register, OTP screens
â”‚   â”‚   â”œâ”€â”€ farmer/       # Farmer-specific screens
â”‚   â”‚   â”œâ”€â”€ trader/       # Trader-specific screens
â”‚   â”‚   â”œâ”€â”€ transport/    # Transporter-specific screens
â”‚   â”‚   â””â”€â”€ admin/        # Admin screens
â”‚   â”œâ”€â”€ components/       # Reusable components
â”‚   â”œâ”€â”€ navigation/       # Navigation configuration
â”‚   â”œâ”€â”€ context/          # React Context providers
â”‚   â”œâ”€â”€ services/         # API services
â”‚   â”œâ”€â”€ utils/            # Utility functions
â”‚   â”œâ”€â”€ constants/        # App constants
â”‚   â””â”€â”€ translations/     # i18n translations
â”œâ”€â”€ android/             # Android native code
â”œâ”€â”€ ios/                  # iOS native code (future)
â””â”€â”€ package.json
```

## Features

- **Multi-Role Support**: Farmer, Trader, Transporter, Admin
- **Authentication**: Phone OTP + Password login
- **KYC Verification**: Document upload and verification
- **Crop Management**: Add, edit, view crops with images
- **Order Management**: Full order lifecycle
- **Weather Integration**: Real-time weather data
- **Market Prices**: Live market price tracking
- **Transport Management**: Vehicle and delivery management
- **Multilingual**: English, Hindi, Marathi support
- **Real-time Updates**: Socket.IO integration

## Prerequisites

- Node.js (>=18)
- npm or yarn
- Expo Go app on your phone (for testing) OR Android Studio (for emulator)

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start Expo development server:
```bash
npm start
```

3. Run on device/emulator:
   - **Option A - Expo Go (Easiest)**: 
     - Install Expo Go app on your Android/iOS device
     - Scan the QR code shown in terminal/browser
   
   - **Option B - Android Emulator**:
     ```bash
     npm run android
     ```
     (Make sure Android Studio and emulator are set up)
   
   - **Option C - iOS Simulator** (Mac only):
     ```bash
     npm run ios
     ```

## Benefits of Expo

âœ… **No Android Studio setup needed** - Test on your phone with Expo Go  
âœ… **Faster development** - Hot reload and instant updates  
âœ… **Easy testing** - Share QR code with team members  
âœ… **Simpler deployment** - Build APK/IPA without native code knowledge

## Backend API

The app connects to the existing FarmConnect backend API. Make sure the backend server is running.

Default API URL: `http://localhost:8080/api` (update in `src/services/api.js`)

## Environment Variables

Create a `.env` file:
```
API_BASE_URL=http://your-backend-url/api
SOCKET_URL=http://your-backend-url
```


