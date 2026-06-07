# Building KaamSetu APK

## Prerequisites
- Node.js 20+
- Expo account at expo.dev
- EAS CLI: `npm install -g eas-cli`
- Android Studio (for local builds)

## Steps

### 1. Install dependencies
```bash
cd apps/mobile
npm install
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure project
```bash
eas build:configure
```

### 4. Add Firebase config
- Go to Firebase Console → Project Settings → Google Services
- Download `google-services.json`
- Place it at `apps/mobile/google-services.json`

### 5. Set environment variables
```bash
cp ../../.env.example .env
# Fill in all required values, especially:
# EXPO_PUBLIC_API_URL=https://your-api-domain.com
```

### 6. Add required assets
Create placeholder assets:
- `assets/icon.png` — 1024×1024 app icon (blue #1A56A0 background)
- `assets/splash.png` — 1284×2778 splash screen
- `assets/adaptive-icon.png` — 1024×1024 adaptive icon foreground
- `assets/notification.wav` — notification sound

### 7. Build development APK (for testing)
```bash
eas build --platform android --profile development
# Takes ~10 minutes; download link sent to your Expo account email
```

### 8. Build preview APK (for internal distribution)
```bash
eas build --platform android --profile preview
```

### 9. Build production AAB (for Play Store)
```bash
eas build --platform android --profile production
# Submit to Play Store:
eas submit --platform android
```

### 10. Local testing (requires Android Studio + emulator)
```bash
npx expo run:android --variant debug
```

## Environment Variables for EAS
Set secrets in your EAS project dashboard or use:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.kaamsetu.com
```
