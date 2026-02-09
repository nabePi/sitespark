import { aiRouter } from '../ai/aiRouter';
import logger from '../../config/logger';
import { IntentAnalysis, GeneratedContent, ContentSection } from '../../types';

const contentLogger = logger.child({ component: 'ContentGeneratorService' });

export class ContentGeneratorService {
  async generateContent(
    intent: IntentAnalysis,
    prompt: string
  ): Promise<GeneratedContent> {
    contentLogger.debug({ intent: intent.intent }, 'Generating content');

    try {
      const content = await aiRouter.generateContent(intent, prompt);
      contentLogger.info({ 
        title: content.title,
        sections: content.sections.length 
      }, 'Content generated successfully');
      return content;
    } catch (error) {
      contentLogger.error({ error }, 'Failed to generate content');
      // Return default content
      return this.getDefaultContent(intent);
    }
  }

  private getDefaultContent(intent: IntentAnalysis): GeneratedContent {
    const categoryHeadlines: Record<string, { headline: string; subheadline: string }> = {
      business: {
        headline: 'Transform Your Business Today',
        subheadline: 'We provide innovative solutions to help your business grow and succeed.',
      },
      portfolio: {
        headline: 'Showcasing Creative Excellence',
        subheadline: 'Explore our portfolio of stunning work and creative solutions.',
      },
      blog: {
        headline: 'Insights & Inspiration',
        subheadline: 'Discover thought-provoking articles and expert insights.',
      },
      ecommerce: {
        headline: 'Quality Products, Exceptional Service',
        subheadline: 'Shop our curated collection of premium products.',
      },
      landing: {
        headline: 'Your Solution Starts Here',
        subheadline: 'Join thousands of satisfied customers who trust our platform.',
      },
      personal: {
        headline: 'Welcome to My World',
        subheadline: 'A glimpse into my journey, thoughts, and creative endeavors.',
      },
    };

    const defaults = categoryHeadlines[intent.category] || categoryHeadlines.business;

    const sections: ContentSection[] = [
      {
        id: 'hero',
        type: 'hero',
        heading: defaults.headline,
        content: defaults.subheadline,
      },
      {
        id: 'features',
        type: 'features',
        heading: 'Key Features',
        content: 'Discover what makes us unique and why our customers choose us.',
        items: intent.features.slice(0, 3).map(f => f.charAt(0).toUpperCase() + f.slice(1)),
      },
      {
        id: 'about',
        type: 'about',
        heading: 'About Us',
        content: `We are dedicated to serving ${intent.targetAudience} with ${intent.tone} solutions that make a difference.`,
      },
      {
        id: 'cta',
        type: 'cta',
        heading: 'Get Started Today',
        content: 'Ready to take the next step? Contact us to learn more about how we can help.',
      },
    ];

    return {
      title: intent.intent.substring(0, 50),
      headline: defaults.headline,
      subheadline: defaults.subheadline,
      sections,
      seo: {
        title: intent.intent.substring(0, 60),
        description: defaults.subheadline.substring(0, 160),
        keywords: intent.features.slice(0, 5),
      },
    };
  }

  generateNavigationLinks(pages: string[]): Array<{ label: string; href: string }> {
    return pages.map(page => ({
      label: page.charAt(0).toUpperCase() + page.slice(1),
      href: page === 'home' ? '/' : `/${page}`,
    }));
  }

  generateFooterContent(): { copyright: string; links: Array<{ label: string; href: string }> } {
    return {
      copyright: `© ${new Date().getFullYear()} All rights reserved.`,
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Contact', href: '/contact' },
      ],
    };
  }
}

export const contentGeneratorService = new ContentGeneratorService();