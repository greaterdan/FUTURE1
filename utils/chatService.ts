interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class ChatService {
  private apiKey: string;
  private baseUrl: string = 'https://api.x.ai/v1/chat/completions';

  constructor() {
    this.apiKey = 'xai-tKe80gHI5lhwzS1FpskofUiAQ57YgsZYicuJqzqq9cC5vVzziGMzmyDeSCznfIPQIM1Zj40iHKctCrsb';
  }

  async sendMessage(
    messages: ChatMessage[],
    model: string = 'grok-4-latest',
    temperature: number = 0.7
  ): Promise<string> {
    try {
      console.log('🌐 Making API call to X.AI...', { model, temperature, messageCount: messages.length });
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          messages,
          model,
          stream: false,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`Chat API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      console.log('📥 API Response:', data);
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        console.log('💬 Response content:', content);
        return content;
      } else {
        console.error('❌ No choices in response:', data);
        throw new Error('No response from chat API');
      }
    } catch (error) {
      console.error('❌ Chat service error:', error);
      throw error;
    }
  }

  async analyzeToken(
    tokenData: any,
    companionName: string,
    userMessage: string
  ): Promise<string> {
    const systemPrompt = `You are ${companionName}, an expert cryptocurrency analyst and trading companion. You specialize in analyzing Solana tokens and providing insights about their market performance, technical indicators, and trading opportunities.

Token Information:
- Name: ${tokenData.name || 'Unknown'}
- Symbol: ${tokenData.symbol || 'Unknown'}
- Mint: ${tokenData.mint}
- Status: ${tokenData.status || 'Unknown'}
- Price: $${tokenData.price_usd || 'N/A'}
- Market Cap: $${tokenData.marketcap || 'N/A'}
- Created: ${tokenData.created_at || 'Unknown'}

Provide helpful, accurate, and actionable insights about this token. Be conversational but professional. If you don't have enough information, say so and suggest what additional data might be helpful.`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    return this.sendMessage(messages, 'grok-4-latest', 0.7);
  }

  async getCompanionResponse(
    companionName: string,
    conversationHistory: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    const systemPrompt = `You are ${companionName}, an expert cryptocurrency analyst and trading companion. You help users analyze tokens, understand market trends, and make informed trading decisions. Be helpful, accurate, and conversational.`;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ];

    return this.sendMessage(messages, 'grok-4-latest', 0.7);
  }
}

export const chatService = new ChatService();
export type { ChatMessage };
