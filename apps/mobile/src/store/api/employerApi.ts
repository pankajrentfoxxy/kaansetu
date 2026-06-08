import { baseApi } from './baseApi';

export const employerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployerProfile: builder.query<any, void>({
      query: () => '/employer/profile',
      providesTags: ['Employer'],
    }),
    updateEmployerProfile: builder.mutation<any, any>({
      query: (body) => ({ url: '/employer/profile', method: 'PUT', body }),
      invalidatesTags: ['Employer'],
    }),
    verifyGst: builder.mutation<any, { gst_number: string }>({
      query: (body) => ({ url: '/employer/kyc/verify-gst', method: 'POST', body }),
      invalidatesTags: ['Employer'],
    }),
    postRequirement: builder.mutation<any, any>({
      query: (body) => ({ url: '/employer/requirements', method: 'POST', body }),
      invalidatesTags: ['Requirements', 'Matches'],
    }),
    getRequirements: builder.query<any[], void>({
      query: () => '/employer/requirements',
      providesTags: ['Requirements'],
    }),
    getRequirementMatches: builder.query<any[], string>({
      query: (id) => `/employer/requirements/${id}/matches`,
      providesTags: ['Matches'],
    }),
    addShortlist: builder.mutation<any, { worker_id: string; requirement_id: string }>({
      query: (body) => ({ url: '/employer/shortlist', method: 'POST', body }),
    }),
    getShortlist: builder.query<any[], void>({
      query: () => '/employer/shortlist',
    }),
    confirmHire: builder.mutation<any, { worker_id: string; requirement_id: string; offer_salary: number; start_date: string }>({
      query: (body) => ({ url: '/employer/hire', method: 'POST', body }),
    }),
    getCaseAlerts: builder.query<any[], void>({
      query: () => '/employer/case-alerts',
      providesTags: ['CaseAlerts'],
    }),
    markAlertAction: builder.mutation<any, { id: string; action: string }>({
      query: ({ id, action }) => ({ url: `/employer/case-alerts/${id}/action`, method: 'POST', body: { action } }),
      invalidatesTags: ['CaseAlerts'],
    }),
    mockEmployerBusiness: builder.mutation<any, void>({
      query: () => ({ url: '/employer/kyc/mock-business', method: 'POST' }),
      invalidatesTags: ['Employer'],
    }),
    mockEmployerPan: builder.mutation<any, void>({
      query: () => ({ url: '/employer/kyc/mock-pan', method: 'POST' }),
      invalidatesTags: ['Employer'],
    }),
  }),
});

export const {
  useGetEmployerProfileQuery,
  useUpdateEmployerProfileMutation,
  useVerifyGstMutation,
  usePostRequirementMutation,
  useGetRequirementsQuery,
  useGetRequirementMatchesQuery,
  useAddShortlistMutation,
  useGetShortlistQuery,
  useConfirmHireMutation,
  useGetCaseAlertsQuery,
  useMarkAlertActionMutation,
  useMockEmployerBusinessMutation,
  useMockEmployerPanMutation,
} = employerApi;
