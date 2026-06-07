import { baseApi } from './baseApi';

export const workerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkerProfile: builder.query<any, void>({
      query: () => '/worker/profile',
      providesTags: ['Worker'],
    }),
    updatePersonal: builder.mutation<any, any>({
      query: (body) => ({ url: '/worker/profile/personal', method: 'PUT', body }),
      invalidatesTags: ['Worker'],
    }),
    updateSkills: builder.mutation<any, any>({
      query: (body) => ({ url: '/worker/profile/skills', method: 'PUT', body }),
      invalidatesTags: ['Worker'],
    }),
    updateHistory: builder.mutation<any, any>({
      query: (body) => ({ url: '/worker/profile/history', method: 'PUT', body }),
      invalidatesTags: ['Worker'],
    }),
    updateLocation: builder.mutation<any, any>({
      query: (body) => ({ url: '/worker/profile/location', method: 'PUT', body }),
      invalidatesTags: ['Worker'],
    }),
    toggleWork: builder.mutation<{ is_open_to_work: boolean }, void>({
      query: () => ({ url: '/worker/profile/toggle-work', method: 'PUT' }),
      invalidatesTags: ['Worker'],
    }),
    initiateAadhaar: builder.mutation<any, { client_id: string }>({
      query: (body) => ({ url: '/worker/kyc/initiate-aadhaar', method: 'POST', body }),
      invalidatesTags: ['Worker'],
    }),
    verifyPan: builder.mutation<any, { pan_number: string }>({
      query: (body) => ({ url: '/worker/kyc/verify-pan', method: 'POST', body }),
      invalidatesTags: ['Worker'],
    }),
    initiateBgc: builder.mutation<any, void>({
      query: () => ({ url: '/worker/kyc/initiate-bgc', method: 'POST' }),
      invalidatesTags: ['Worker'],
    }),
    getJobs: builder.query<any[], void>({
      query: () => '/worker/jobs',
      providesTags: ['Matches'],
    }),
    getNotifications: builder.query<any[], void>({
      query: () => '/worker/notifications',
      providesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetWorkerProfileQuery,
  useUpdatePersonalMutation,
  useUpdateSkillsMutation,
  useUpdateHistoryMutation,
  useUpdateLocationMutation,
  useToggleWorkMutation,
  useInitiateAadhaarMutation,
  useVerifyPanMutation,
  useInitiateBgcMutation,
  useGetJobsQuery,
  useGetNotificationsQuery,
} = workerApi;
