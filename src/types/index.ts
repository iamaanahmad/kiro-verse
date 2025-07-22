export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  txHash: string;
  date: string;
  icon: string; // Can be a lucide-react icon name OR a base64 data URI for generated images
}
