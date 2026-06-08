import type { UIMessage } from 'ai';

export type MessageMetadata = {
  usage?: { 
    inputTokens: number; 
    outputTokens: number; 
    totalTokens: number
  };
};

export type ChatMessage = UIMessage<MessageMetadata>;
