import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

export const config = {
  port: process.env.PORT || 5000,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TXVkRzmlwp305z',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'tQldJcIG4nEg8lldZIxIybdA',
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};
