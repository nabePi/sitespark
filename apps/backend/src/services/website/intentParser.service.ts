import { aiRouter } from '../ai/aiRouter';
import logger from '../../config/logger';
import { IntentAnalysis } from '../../types';

const parserLogger = logger.child({ component: 'IntentParserService' });

export class IntentParserService {
  async parseIntent(prompt: string): Promise<IntentAnalysis> {
    parserLogger.debug({ prompt: prompt.substring(0, 100) }, 'Parsing intent');

    try {
      const intent = await aiRouter.generateIntentParser(prompt);
      parserLogger.info({ 
        intent: intent.intent, 
        category: intent.category,
        features: intent.features.length 
      }, 'Intent parsed successfully');
      return intent;
    } catch (error) {
      parserLogger.error({ error }, 'Failed to parse intent');
      // Return default intent
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

  extractKeywords(intent: IntentAnalysis): string[] {
    const keywords = new Set<string>();
    
    // Add category as keyword
    keywords.add(intent.category);
    
    // Add features
    intent.features.forEach(feature => keywords.add(feature.toLowerCase()));
    
    // Add style and tone
    keywords.add(intent.style);
    keywords.add(intent.tone);
    
    // Extract words from intent description
    const words = intent.intent
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3);
    words.forEach(word => keywords.add(word));
    
    return Array.from(keywords);
  }

  determinePageStructure(intent: IntentAnalysis): string[] {
    const basePages = ['home'];
    
    const categoryPages: Record<string, string[]> = {
      business: ['about', 'services', 'contact'],
      portfolio: ['about', 'projects', 'contact'],
      blog: ['about', 'blog', 'contact'],
      ecommerce: ['products', 'about', 'contact'],
      landing: ['features', 'pricing', 'contact'],
      personal: ['about', 'blog', 'contact'],
    };
    
    const pages = [...basePages, ...(categoryPages[intent.category] || ['about', 'contact'])];
    
    // Add pages based on features
    if (intent.features.includes('blog')) {
      if (!pages.includes('blog')) pages.push('blog');
    }
    if (intent.features.includes('shop') || intent.features.includes('store')) {
      if (!pages.includes('products')) pages.push('products');
    }
    if (intent.features.includes('gallery') || intent.features.includes('portfolio')) {
      if (!pages.includes('gallery')) pages.push('gallery');
    }
    
    return [...new Set(pages)];
  }
}

export const intentParserService = new IntentParserService();