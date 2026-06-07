import axios from 'axios';
import { logger } from '../utils/logger';

const BASE_URL = process.env.SUREPASS_BASE_URL ?? 'https://kyc-api.surepass.app';
const API_KEY = process.env.SUREPASS_API_KEY ?? '';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${API_KEY}` },
  timeout: 30000,
});

export const surepassService = {
  async downloadAadhaar(clientId: string) {
    const res = await client.get(`/api/v1/digilocker/download-aadhaar/${clientId}`);
    return res.data;
  },

  async verifyPan(panNumber: string) {
    const res = await client.post('/api/v1/pan/pan', { id_number: panNumber });
    return res.data;
  },

  async verifyGst(gstNumber: string) {
    const res = await client.post('/api/v1/gst/gst', { id_number: gstNumber });
    return res.data;
  },

  initiateDigiLockerSession(): string {
    return `https://kyc-api.surepass.app/api/v1/digilocker/generate-url?token=${API_KEY}`;
  },
};
