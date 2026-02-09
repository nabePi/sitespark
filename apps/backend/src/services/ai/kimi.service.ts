import { env } from '../config/env';
import logger from '../config/logger';
import { IntentAnalysis, DesignTokens, GeneratedContent } from '../types';

const kimiLogger = logger.child({ component: 'KimiService' });

interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface KimiRequest {
  model: string;
  messages: KimiMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

interface KimiResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

export class KimiService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = env.KIMI_API_KEY || '';
    this.apiUrl = env.KIMI_API_URL;
    this.model = env.KIMI_MODEL;

    if (!this.apiKey) {
      kimiLogger.warn('KIMI_API_KEY not configured, AI features will be disabled');
    }
  }

  private async makeRequest(request: KimiRequest): Promise<KimiResponse> {
    if (!this.apiKey) {
      throw new Error('KIMI_API_KEY not configured');
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async generateIntentParser(prompt: string): Promise<IntentAnalysis> {
    kimiLogger.debug({ prompt }, 'Generating intent analysis');

    const systemPrompt = `You are an expert website designer and developer. Analyze the user's prompt and extract key information for website generation.

Respond with a JSON object in this exact format:
{
  "intent": "brief description of what the user wants",
  "category": "business|portfolio|blog|ecommerce|landing|personal|other",
  "features": ["feature1", "feature2", ...],
  "targetAudience": "description of target audience",
  "tone": "professional|casual|friendly|luxury|playful|technical",
  "style": "modern|minimal|bold|elegant|vibrant|corporate"
}`;

    const request: KimiRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    };

    const response = await this.makeRequest(request);
    const content = response.choices[0]?.message?.content || '{}';

    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      
      const analysis = JSON.parse(jsonStr) as IntentAnalysis;
      kimiLogger.debug({ analysis }, 'Intent analysis generated');
      return analysis;
    } catch (error) {
      kimiLogger.error({ content, error }, 'Failed to parse intent analysis');
      // Return default analysis
      return {
        intent: prompt.substring(0, 100),
        category: 'business',
        features: ['home', 'about', 'contact'],
        targetAudience: 'general',
        tone: 'professional',
        style: 'modern',
      };
    }
  }

  async generateContent(intent: IntentAnalysis, prompt: string): Promise<GeneratedContent> {
    kimiLogger.debug({ intent }, 'Generating content');

    const systemPrompt = `You are an expert copywriter and content strategist. Create compelling website content based on the user's intent.

Respond with a JSON object in this exact format:
{
  "title": "Website Title (max 60 chars)",
  "headline": "Main hero headline (attention-grabbing)",
  "subheadline": "Supporting subheadline",
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "heading": "Hero heading",
      "content": "Hero paragraph content"
    },
    {
      "id": "features",
      "type": "features",
      "heading": "Key Features",
      "content": "Intro paragraph",
      "items": ["Feature 1", "Feature 2", "Feature 3"]
    },
    {
      "id": "about",
      "type": "about",
      "heading": "About Us",
      "content": "About paragraph content"
    },
    {
      "id": "cta",
      "type": "cta",
      "heading": "Call to Action",
      "content": "CTA paragraph content"
    }
  ],
  "seo": {
    "title": "SEO Title (max 60 chars)",
    "description": "Meta description (max 160 chars)",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
}`;

    const userPrompt = `Intent: ${intent.intent}
Category: ${intent.category}
Target Audience: ${intent.targetAudience}
Tone: ${intent.tone}
Style: ${intent.style}
Original Prompt: ${prompt}`;

    const request: KimiRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    };

    const response = await this.makeRequest(request);
    const content = response.choices[0]?.message?.content || '{}';

    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      
      const generatedContent = JSON.parse(jsonStr) as GeneratedContent;
      kimiLogger.debug('Content generated successfully');
      return generatedContent;
    } catch (error) {
      kimiLogger.error({ content, error }, 'Failed to parse generated content');
      // Return default content
      return {
        title: 'My Website',
        headline: 'Welcome to My Website',
        subheadline: 'We provide amazing services',
        sections: [
          {
            id: 'hero',
            type: 'hero',
            heading: 'Welcome',
            content: 'We are here to help you succeed.',
          },
        ],
        seo: {
          title: 'My Website',
          description: 'Welcome to our amazing website',
          keywords: ['website', 'services'],
        },
      };
    }
  }

  async generateDesignTokens(intent: IntentAnalysis): Promise<DesignTokens> {
    kimiLogger.debug({ intent }, 'Generating design tokens');

    const systemPrompt = `You are an expert UI/UX designer. Create a cohesive design system based on the website intent.

Respond with a JSON object in this exact format:
{
  "colors": {
    "primary": "#HEXCODE (main brand color)",
    "secondary": "#HEXCODE (accent color)",
    "accent": "#HEXCODE (highlight color)",
    "background": "#HEXCODE (page background)",
    "surface": "#HEXCODE (card/surface background)",
    "text": "#HEXCODE (main text)",
    "textMuted": "#HEXCODE (secondary text)"
  },
  "typography": {
    "headingFont": "system-ui|serif|sans-serif|monospace",
    "bodyFont": "system-ui|serif|sans-serif|monospace",
    "baseSize": "16px",
    "scale": 1.25
  },
  "spacing": {
    "unit": "1rem",
    "scale": [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8]
  },
  "borderRadius": {
    "small": "0.25rem",
    "medium": "0.5rem",
    "large": "1rem"
  },
  "shadows": {
    "small": "0 1px 2px rgba(0,0,0,0.1)",
    "medium": "0 4px 6px rgba(0,0,0,0.1)",
    "large": "0 10px 15px rgba(0,0,0,0.1)"
  }
}`;

    const userPrompt = `Intent: ${intent.intent}
Category: ${intent.category}
Target Audience: ${intent.targetAudience}
Tone: ${intent.tone}
Style: ${intent.style}`;

    const request: KimiRequest = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1500,
    };

    const response = await this.makeRequest(request);
    const content = response.choices[0]?.message?.content || '{}';

    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      
      const tokens = JSON.parse(jsonStr) as DesignTokens;
      kimiLogger.debug('Design tokens generated successfully');
      return tokens;
    } catch (error) {
      kimiLogger.error({ content, error }, 'Failed to parse design tokens');
      // Return default tokens
      return {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#F59E0B',
          background: '#FFFFFF',
          surface: '#F3F4F6',
          text: '#111827',
          textMuted: '#6B7280',
        },
        typography: {
          headingFont: 'system-ui',
          bodyFont: 'system-ui',
          baseSize: '16px',
          scale: 1.25,
        },
        spacing: {
          unit: '1rem',
          scale: [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8],
        },
        borderRadius: {
          small: '0.25rem',
          medium: '0.5rem',
          large: '1rem',
        },
        shadows: {
          small: '0 1px 2px rgba(0,0,0,0.1)',
          medium: '0 4px 6px rgba(0,0,0,0.1)',
          large: '0 10px 15px rgba(0,0,0,0.1)',
        },
      };
    }
  }

  async *streamChat(messages: KimiMessage[]): AsyncGenerator<string> {
    if (!this.apiKey) {
      throw new Error('KIMI_API_KEY not configured');
    }

    const request: KimiRequest = {
      model: this.model,
      messages,
      stream: true,
      temperature: 0.7,
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const kimiService = new KimiService();