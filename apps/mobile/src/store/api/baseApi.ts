import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { SecureStore } from '../../utils/storage';
import { logout } from '../authSlice';

// EXPO_PUBLIC_ vars are baked at bundle time. Fallback ensures dev always works.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}/api/v1`,
  prepareHeaders: async (headers) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Try to swap an expired access token for a fresh one using the stored refresh token.
// Returns true on success. Shared by the 401 interceptor below and App.tsx bootstrap.
export async function tryRefreshSession(): Promise<boolean> {
  const refresh = await SecureStore.getItemAsync('refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.access_token || !data.refresh_token) return false;
    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// Single-flight guard so a burst of 401s triggers only one refresh.
let refreshing: Promise<boolean> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args, api, extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    if (!refreshing) refreshing = tryRefreshSession().finally(() => { refreshing = null; });
    const ok = await refreshing;
    if (ok) {
      result = await rawBaseQuery(args, api, extraOptions); // retry with new token
    } else {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      api.dispatch(logout());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Worker', 'Employer', 'Requirements', 'Matches', 'Notifications', 'CaseAlerts', 'Referral'],
  endpoints: () => ({}),
});
