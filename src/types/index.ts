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
  icon: string;
}
