import axios from 'axios';
import { logger } from '../utils/logger';

export const smsService = {
  async sendOtp(mobile: string, otp: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV] OTP for ${mobile}: ${otp}`);
      return;
    }
    try {
      await axios.post(
        'https://api.msg91.com/api/v5/otp',
        {
          template_id: process.env.MSG91_OTP_TEMPLATE_ID,
          mobile: `91${mobile}`,
          authkey: process.env.MSG91_API_KEY,
          otp,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      logger.error('MSG91 OTP send failed', err);
      throw new Error('Failed to send OTP');
    }
  },

  async sendAlert(mobile: string, message: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[DEV] SMS to ${mobile}: ${message}`);
      return;
    }
    try {
      await axios.get('https://api.msg91.com/api/sendhttp.php', {
        params: {
          authkey: process.env.MSG91_API_KEY,
          mobiles: `91${mobile}`,
          message,
          sender: process.env.MSG91_SENDER_ID ?? 'KAMSETU',
          route: 4,
          country: 91,
        },
      });
    } catch (err) {
      logger.error('MSG91 SMS send failed', err);
    }
  },
};
