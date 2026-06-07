import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    sendOtp: builder.mutation<{ success: boolean; expires_in: number }, { mobile: string }>({
      query: (body) => ({ url: '/auth/send-otp', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation<
      { access_token: string; refresh_token: string; user: { id: string; role: string; is_new_user: boolean } },
      { mobile: string; otp: string; role?: string }
    >({
      query: (body) => ({ url: '/auth/verify-otp', method: 'POST', body }),
    }),
    refreshToken: builder.mutation<{ access_token: string; refresh_token: string }, { refresh_token: string }>({
      query: (body) => ({ url: '/auth/refresh', method: 'POST', body }),
    }),
  }),
});

export const { useSendOtpMutation, useVerifyOtpMutation, useRefreshTokenMutation } = authApi;
