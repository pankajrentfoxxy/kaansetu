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
    searchWorkers: builder.query<any[], { q?: string; skill_type?: string; city?: string; min_experience?: number; verified?: boolean }>({
      query: (params) => {
        const sp = new URLSearchParams();
        if (params.q) sp.set('q', params.q);
        if (params.skill_type) sp.set('skill_type', params.skill_type);
        if (params.city) sp.set('city', params.city);
        if (params.min_experience) sp.set('min_experience', String(params.min_experience));
        if (params.verified) sp.set('verified', 'true');
        return `/employer/workers/search?${sp.toString()}`;
      },
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
    getHires: builder.query<any[], void>({
      query: () => '/employer/hires',
      providesTags: ['Matches'],
    }),
    esignHire: builder.mutation<any, { hireId: string; employer_signature_name: string }>({
      query: ({ hireId, ...body }) => ({ url: `/employer/hire/${hireId}/esign`, method: 'PUT', body }),
      invalidatesTags: ['Matches'],
    }),
    getApplications: builder.query<any[], void>({
      query: () => '/employer/applications',
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
  useSearchWorkersQuery,
  useAddShortlistMutation,
  useGetShortlistQuery,
  useConfirmHireMutation,
  useGetHiresQuery,
  useEsignHireMutation,
  useGetApplicationsQuery,
  useGetCaseAlertsQuery,
  useMarkAlertActionMutation,
  useMockEmployerBusinessMutation,
  useMockEmployerPanMutation,
} = employerApi;
