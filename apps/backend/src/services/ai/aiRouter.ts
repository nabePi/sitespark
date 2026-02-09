import { KimiService } from './kimi.service';
import logger from '../../config/logger';
import { IntentAnalysis, DesignTokens, GeneratedContent } from '../../types';

const aiRouterLogger = logger.child({ component: 'AIRouter' });

interface AIService {
  generateIntentParser(prompt: string): Promise<IntentAnalysis>;
  generateContent(intent: IntentAnalysis, prompt: string): Promise<GeneratedContent>;
  generateDesignTokens(intent: IntentAnalysis): Promise<DesignTokens>;
}

export class AIRouter {
  private primaryService: KimiService;
  private fallbackServices: AIService[] = [];
  private useFallback: boolean = false;

  constructor() {
    this.primaryService = new KimiService();
  }

  private async withFallback<T>(
    operation: (service: AIService) => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      if (!this.useFallback) {
        const result = await operation(this.primaryService);
        return result;
      }
    } catch (error) {
      aiRouterLogger.warn({ error, operation: operationName }, 'Primary AI service failed');
      
      // Try fallback services
      for (const service of this.fallbackServices) {
        try {
          const result = await operation(service);
          aiRouterLogger.info({ operation: operationName }, 'Fallback AI service succeeded');
          return result;
        } catch (fallbackError) {
          aiRouterLogger.warn({ error: fallbackError, operation: operationName }, 'Fallback AI service failed');
        }
      }
      
      // If all fail, return mock data
      aiRouterLogger.warn({ operation: operationName }, 'All AI services failed, using mock data');
      return this.getMockData(operationName);
    }
    
    return this.getMockData(operationName);
  }

  private getMockData<T>(operationName: string): T {
    switch (operationName) {
      case 'generateIntentParser':
        return {
          intent: 'Business website',
          category: 'business',
          features: ['home', 'about', 'services', 'contact'],
          targetAudience: 'general',
          tone: 'professional',
          style: 'modern',
        } as T;
      
      case 'generateContent':
        return {
          title: 'My Website',
          headline: 'Welcome to Our Website',
          subheadline: 'We provide excellent services',
          sections: [
            { id: 'hero', type: 'hero', heading: 'Welcome', content: 'We are here to help you succeed.' },
            { id: 'features', type: 'features', heading: 'Features', content: 'What we offer', items: ['Feature 1', 'Feature 2', 'Feature 3'] },
          ],
          seo: { title: 'My Website', description: 'Welcome to our website', keywords: ['website'] },
        } as T;
      
      case 'generateDesignTokens':
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
          typography: { headingFont: 'system-ui', bodyFont: 'system-ui', baseSize: '16px', scale: 1.25 },
          spacing: { unit: '1rem', scale: [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8] },
          borderRadius: { small: '0.25rem', medium: '0.5rem', large: '1rem' },
          shadows: {
            small: '0 1px 2px rgba(0,0,0,0.1)',
            medium: '0 4px 6px rgba(0,0,0,0.1)',
            large: '0 10px 15px rgba(0,0,0,0.1)',
          },
        } as T;
      
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  async generateIntentParser(prompt: string): Promise<IntentAnalysis> {
    return this.withFallback(
      (service) => service.generateIntentParser(prompt),
      'generateIntentParser'
    );
  }

  async generateContent(intent: IntentAnalysis, prompt: string): Promise<GeneratedContent> {
    return this.withFallback(
      (service) => service.generateContent(intent, prompt),
      'generateContent'
    );
  }

  async generateDesignTokens(intent: IntentAnalysis): Promise<DesignTokens> {
    return this.withFallback(
      (service) => service.generateDesignTokens(intent),
      'generateDesignTokens'
    );
  }

  enableFallback(): void {
    this.useFallback = true;
    aiRouterLogger.info('Fallback mode enabled');
  }

  disableFallback(): void {
    this.useFallback = false;
    aiRouterLogger.info('Fallback mode disabled');
  }
}

export const aiRouter = new AIRouter();