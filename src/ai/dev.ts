import { config } from 'dotenv';
config();

import '@/ai/flows/send-chat-message.ts';
import '@/ai/flows/get-code-feedback.ts';
import '@/ai/flows/award-skill-badge.ts';
import '@/ai/flows/generate-badge-icon.ts';
