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
    mockSelfie: builder.mutation<any, void>({
      query: () => ({ url: '/worker/kyc/mock-selfie', method: 'POST' }),
      invalidatesTags: ['Worker'],
    }),
    mockAddress: builder.mutation<any, { city?: string; state?: string; pincode?: string }>({
      query: (body) => ({ url: '/worker/kyc/mock-address', method: 'POST', body }),
      invalidatesTags: ['Worker'],
    }),
    mockAadhaar: builder.mutation<any, void>({
      query: () => ({ url: '/worker/kyc/mock-aadhaar', method: 'POST' }),
      invalidatesTags: ['Worker'],
    }),
    mockPan: builder.mutation<any, void>({
      query: () => ({ url: '/worker/kyc/mock-pan', method: 'POST' }),
      invalidatesTags: ['Worker'],
    }),
    mockBgc: builder.mutation<any, void>({
      query: () => ({ url: '/worker/kyc/mock-bgc', method: 'POST' }),
      invalidatesTags: ['Worker'],
    }),
    applyJob: builder.mutation<any, string>({
      query: (matchId) => ({ url: `/worker/jobs/${matchId}/apply`, method: 'POST' }),
      invalidatesTags: ['Matches'],
    }),
    getApplications: builder.query<any[], void>({
      query: () => '/worker/applications',
      providesTags: ['Matches'],
    }),
    getWorkerOffers: builder.query<any[], void>({
      query: () => '/worker/offers',
      providesTags: ['Matches'],
    }),
    acceptOffer: builder.mutation<any, string>({
      query: (hireId) => ({ url: `/worker/offers/${hireId}/accept`, method: 'PUT' }),
      invalidatesTags: ['Matches'],
    }),
    rejectOffer: builder.mutation<any, string>({
      query: (hireId) => ({ url: `/worker/offers/${hireId}/reject`, method: 'PUT' }),
      invalidatesTags: ['Matches'],
    }),
    getReferral: builder.query<any, void>({
      query: () => '/worker/referral',
      providesTags: ['Referral'],
    }),
    applyReferral: builder.mutation<any, { code: string }>({
      query: (body) => ({ url: '/worker/referral/apply', method: 'POST', body }),
      invalidatesTags: ['Referral', 'Worker'],
    }),
    redeemPoints: builder.mutation<any, { reward: 'boost' | 'pan_india' }>({
      query: (body) => ({ url: '/worker/redeem', method: 'POST', body }),
      invalidatesTags: ['Referral', 'Worker'],
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
  useMockSelfieMutation,
  useMockAddressMutation,
  useMockAadhaarMutation,
  useMockPanMutation,
  useMockBgcMutation,
  useApplyJobMutation,
  useGetApplicationsQuery,
  useGetWorkerOffersQuery,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useGetReferralQuery,
  useApplyReferralMutation,
  useRedeemPointsMutation,
} = workerApi;
