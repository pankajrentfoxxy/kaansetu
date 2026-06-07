import axios from 'axios';
import { logger } from '../utils/logger';

const BASE_URL = process.env.AUTHBRIDGE_API_URL ?? 'https://api.authbridge.com';
const API_KEY = process.env.AUTHBRIDGE_API_KEY ?? '';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  timeout: 30000,
});

export interface WorkerCheckPayload {
  full_name: string;
  dob?: string;
  father_name?: string;
  masked_aadhaar?: string;
  address?: string;
  city?: string;
  state?: string;
}

export const authrbridge = {
  async initiateCheck(worker: WorkerCheckPayload, checkType: string = 'ONBOARDING'): Promise<string> {
    try {
      const res = await client.post('/v1/criminal-check/initiate', {
        candidate: {
          name: worker.full_name,
          dob: worker.dob,
          father_name: worker.father_name,
          aadhaar_last4: worker.masked_aadhaar?.slice(-4),
          address: worker.address,
          city: worker.city,
          state: worker.state,
        },
        check_type: checkType,
        webhook_url: `${process.env.API_BASE_URL ?? 'http://localhost:3000'}/api/v1/webhooks/authbridge`,
      });
      return res.data.reference_id;
    } catch (err) {
      logger.error('Authbridge initiate check failed', err);
      throw new Error('Background check initiation failed');
    }
  },
};
