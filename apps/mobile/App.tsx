import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { store } from './src/store';
import { AppNavigator } from './src/navigation';
import { setCredentials } from './src/store/authSlice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AppInner() {
  useEffect(() => {
    // Restore auth on app launch
    async function restoreAuth() {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          store.dispatch(setCredentials({ userId: payload.sub, role: payload.role }));
        }
      } catch {}
    }
    restoreAuth();

    // Handle notification tap
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      // Navigation handled in navigator based on data.screen
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  );
}
