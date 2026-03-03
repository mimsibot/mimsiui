import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'mimsiui.session';

async function setValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getValue(key: string) {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteValue(key: string) {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function persistSession(session: object) {
  await setValue(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession<T>() {
  const raw = await getValue(SESSION_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function clearSession() {
  await deleteValue(SESSION_KEY);
}
