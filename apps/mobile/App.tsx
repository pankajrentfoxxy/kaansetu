import React, { useEffect, Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SecureStore } from './src/utils/storage';
import { store } from './src/store';
import { AppNavigator } from './src/navigation';
import { setCredentials } from './src/store/authSlice';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message + '\n' + e.stack };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={err.box}>
          <Text style={err.title}>Render Error</Text>
          <Text style={err.msg}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  useEffect(() => {
    async function restoreAuth() {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (!token) return;
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          store.dispatch(setCredentials({ userId: payload.sub, role: payload.role }));
        }
      } catch {}
    }
    restoreAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppInner />
      </Provider>
    </ErrorBoundary>
  );
}

const err = StyleSheet.create({
  box: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#1a1a1a' },
  title: { color: 'red', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  msg: { color: '#fff', fontSize: 12, fontFamily: 'monospace' },
});
