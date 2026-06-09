import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { SecureStore } from '../../utils/storage';

// EXPO_PUBLIC_ vars are baked at bundle time. Fallback ensures dev always works.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://gentle-cooperation-production-ca4c.up.railway.app';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/v1`,
    prepareHeaders: async (headers) => {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Worker', 'Employer', 'Requirements', 'Matches', 'Notifications', 'CaseAlerts'],
  endpoints: () => ({}),
});
