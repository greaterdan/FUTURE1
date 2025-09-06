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
  private getApiConfig(provider: string, apiKeys: Record<string, string>) {
    const configs = {
      grok4: {
        baseUrl: 'https://api.x.ai/v1/chat/completions',
        model: 'grok-4-latest',
        // Use environment variable for API key
        apiKey: process.env.NEXT_PUBLIC_XAI_API_KEY || ''
      },
      gpt4: {
        baseUrl: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4',
        // Users must provide their own OpenAI API key
        apiKey: apiKeys.gpt4 || ''
      },
      claude: {
        baseUrl: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-sonnet-20240229',
        // Users must provide their own Claude API key
        apiKey: apiKeys.claude || ''
      },
      gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        model: 'gemini-pro',
        // Users must provide their own Gemini API key
        apiKey: apiKeys.gemini || ''
      }
    };
    
    return configs[provider as keyof typeof configs] || configs.grok4;
  }

  async sendMessage(
    messages: ChatMessage[],
    provider: string = 'grok4',
    apiKeys: Record<string, string> = {},
    temperature: number = 0.7
  ): Promise<string> {
    try {
      const config = this.getApiConfig(provider, apiKeys);
      
      if (!config.apiKey) {
        if (provider === 'grok4') {
          throw new Error('Grok API key not available. Please contact support.');
        } else {
          throw new Error(`No API key found for ${provider}. Please configure your API key in settings.`);
        }
      }
      
      console.log(`🌐 Making API call to ${provider}...`, { model: config.model, temperature, messageCount: messages.length });
      
      let requestBody: any;
      let headers: any = {
        'Content-Type': 'application/json',
      };

      // Handle different API formats
      if (provider === 'claude') {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        requestBody = {
          model: config.model,
          max_tokens: 1000,
          temperature,
          messages: messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : msg.role,
            content: msg.content
          }))
        };
      } else if (provider === 'gemini') {
        headers['x-goog-api-key'] = config.apiKey;
        requestBody = {
          contents: [{
            parts: [{
              text: messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')
            }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens: 1000
          }
        };
      } else {
        // Grok and OpenAI use the same format
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        requestBody = {
          messages,
          model: config.model,
          stream: false,
          temperature,
        };
      }
      
      const response = await fetch(config.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`Chat API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: any = await response.json();
      console.log('📥 API Response:', data);
      
      let content: string;
      
      // Handle different API response formats
      if (provider === 'claude') {
        if (data.content && data.content.length > 0) {
          content = data.content[0].text;
        } else {
          throw new Error('No content in Claude response');
        }
      } else if (provider === 'gemini') {
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
          content = data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('No content in Gemini response');
        }
      } else {
        // Grok and OpenAI use the same format
        if (data.choices && data.choices.length > 0) {
          content = data.choices[0].message.content;
        } else {
          console.error('❌ No choices in response:', data);
          throw new Error('No response from chat API');
        }
      }
      
      console.log('💬 Response content:', content);
      return content;
    } catch (error) {
      console.error('❌ Chat service error:', error);
      throw error;
    }
  }

  async analyzeToken(
    tokenData: any,
    companionName: string,
    userMessage: string,
    provider: string = 'grok4',
    apiKeys: Record<string, string> = {}
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

    return this.sendMessage(messages, provider, apiKeys, 0.7);
  }

  async getCompanionResponse(
    companionName: string,
    conversationHistory: ChatMessage[],
    userMessage: string,
    provider: string = 'grok4',
    apiKeys: Record<string, string> = {}
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

    return this.sendMessage(messages, provider, apiKeys, 0.7);
  }
}

export const chatService = new ChatService();
export type { ChatMessage };
