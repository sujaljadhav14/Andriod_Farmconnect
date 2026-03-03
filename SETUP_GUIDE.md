# FarmConnect React Native - Setup Guide

## âœ… Completed Setup

### 1. Project Structure
- âœ… React Native project initialized
- âœ… Navigation structure (React Navigation)
- âœ… Context providers (Auth, Language)
- âœ… API service configuration
- âœ… Constants and utilities

### 2. Authentication Screens
- âœ… Login Screen (Phone + Password)
- âœ… Register Screen
- âœ… OTP Login Screen
- âœ… Splash Screen
- âœ… Home Screen

### 3. Navigation Structure
- âœ… Auth Navigator (Login, Register, OTP)
- âœ… Role-based Navigators (Farmer, Trader, Transport, Admin)
- âœ… Bottom Tab Navigation for each role
- âœ… Stack Navigation for nested screens

### 4. Dashboard Screens (Placeholders)
- âœ… Farmer Dashboard
- âœ… Trader Dashboard
- âœ… Transport Dashboard
- âœ… Admin Dashboard

## ðŸ“‹ Next Steps

### Immediate Actions Required:

1. **Copy Translation Files**
   - Copy `en.json`, `hi.json`, `mr.json` from:
     `../FarmConnect-WebApp/frontend/src/translations/`
   - To: `src/translations/`

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Android Setup**
   - Ensure Android Studio is installed
   - Set up Android SDK
   - Create Android emulator or connect physical device

4. **Backend Configuration**
   - Update API_BASE_URL in `src/services/api.js`
   - Ensure backend server is running
   - Default: `http://localhost:8080/api`

### Phase 2: Feature Implementation

1. **Farmer Features**
   - [ ] Add Crop Screen (with image picker)
   - [ ] My Crops List Screen
   - [ ] Crop Details Screen
   - [ ] Order Management
   - [ ] Weather Integration
   - [ ] Market Prices
   - [ ] Community Forum

2. **Trader Features**
   - [ ] Browse Crops Screen (with filters)
   - [ ] Crop Details View
   - [ ] Make Proposal Screen
   - [ ] Order Tracking
   - [ ] Analytics Dashboard

3. **Transport Features**
   - [ ] Vehicle Management (Add/Edit)
   - [ ] Available Orders List
   - [ ] Delivery Tracking
   - [ ] Route Planning
   - [ ] Earnings Dashboard

4. **Common Features**
   - [ ] KYC Verification Screens (all roles)
   - [ ] Profile Management
   - [ ] Settings Screen
   - [ ] Notifications

### Phase 3: Advanced Features

1. **Real-time Updates**
   - [ ] Socket.IO integration
   - [ ] Push notifications
   - [ ] Live order tracking

2. **Media Handling**
   - [ ] Image picker for crops
   - [ ] Document upload for KYC
   - [ ] PDF viewer for agreements

3. **Maps Integration**
   - [ ] Location picker
   - [ ] Route visualization
   - [ ] Delivery tracking map

## ðŸ”§ Configuration

### API Configuration
Update `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://YOUR_BACKEND_URL/api';
```

### Environment Variables
Create `.env` file:
```
API_BASE_URL=http://localhost:8080/api
SOCKET_URL=http://localhost:8080
```

## ðŸ“± Running the App

1. **Start Metro Bundler**
   ```bash
   npm start
   ```

2. **Run on Android**
   ```bash
   npm run android
   ```

3. **Run on iOS** (if configured)
   ```bash
   npm run ios
   ```

## ðŸ› Troubleshooting

### Common Issues:

1. **Translation files missing**
   - Copy translation files from web app
   - Ensure files are in `src/translations/`

2. **API connection errors**
   - Check backend server is running
   - Verify API_BASE_URL is correct
   - Check network connectivity

3. **Navigation errors**
   - Ensure all screen components exist
   - Check navigation imports

4. **Build errors**
   - Run `cd android && ./gradlew clean`
   - Clear Metro cache: `npm start -- --reset-cache`

## ðŸ“š Resources

- React Native Docs: https://reactnative.dev/docs/getting-started
- React Navigation: https://reactnavigation.org/
- Backend API: See `../FarmConnect-WebApp/backend/`


