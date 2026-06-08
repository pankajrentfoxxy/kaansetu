import AsyncStorage from '@react-native-async-storage/async-storage';

// Web fallback: SecureStore doesn't exist on web
export const SecureStore = {
  getItemAsync: (key: string) => AsyncStorage.getItem(key),
  setItemAsync: (key: string, value: string) => AsyncStorage.setItem(key, value),
  deleteItemAsync: (key: string) => AsyncStorage.removeItem(key),
};
