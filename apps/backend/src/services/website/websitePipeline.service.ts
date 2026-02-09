import { intentParserService } from './intentParser.service';
import { contentGeneratorService } from './contentGenerator.service';
import { designGeneratorService } from './designGenerator.service';
import logger from '../../config/logger';
import {
  WebsiteGenerationInput,
  WebsiteGenerationResult,
  GenerationProgressData,
} from '../../types';

const pipelineLogger = logger.child({ component: 'WebsitePipelineService' });

export type ProgressCallback = (progress: GenerationProgressData) => void;

export class WebsitePipelineService {
  async generateWebsite(
    input: WebsiteGenerationInput,
    onProgress?: ProgressCallback
  ): Promise<WebsiteGenerationResult> {
    pipelineLogger.info({ userId: input.userId }, 'Starting website generation pipeline');

    try {
      // Stage 1: Intent Analysis
      this.reportProgress(onProgress, {
        stage: 'intent',
        progress: 10,
        message: 'Analyzing your requirements...',
      });

      const intent = await intentParserService.parseIntent(input.prompt);
      pipelineLogger.debug({ intent }, 'Intent analysis complete');

      this.reportProgress(onProgress, {
        stage: 'design',
        progress: 30,
        message: 'Creating your design system...',
      });

      // Stage 2: Design Tokens (parallel with content)
      const tokensPromise = designGeneratorService.generateDesignTokens(intent);

      this.reportProgress(onProgress, {
        stage: 'content',
        progress: 50,
        message: 'Generating compelling content...',
      });

      // Stage 3: Content Generation
      const contentPromise = contentGeneratorService.generateContent(intent, input.prompt);

      // Wait for both parallel operations
      const [tokens, content] = await Promise.all([tokensPromise, contentPromise]);

      this.reportProgress(onProgress, {
        stage: 'assembly',
        progress: 70,
        message: 'Assembling your website...',
      });

      // Stage 4: HTML Generation
      const html = designGeneratorService.generateHTMLLayout(content, tokens);

      this.reportProgress(onProgress, {
        stage: 'assembly',
        progress: 85,
        message: 'Applying styles...',
      });

      // Stage 5: CSS Generation
      const css = designGeneratorService.generateGlobalStyles(tokens);

      this.reportProgress(onProgress, {
        stage: 'finalization',
        progress: 95,
        message: 'Finalizing your website...',
      });

      // Stage 6: Config Generation
      const config = this.generateConfig(input, intent, tokens, content);

      this.reportProgress(onProgress, {
        stage: 'finalization',
        progress: 100,
        message: 'Your website is ready!',
      });

      const result: WebsiteGenerationResult = {
        html,
        css,
        config,
        intent,
        content,
      };

      pipelineLogger.info('Website generation complete');
      return result;
    } catch (error) {
      pipelineLogger.error({ error }, 'Website generation failed');
      throw error;
    }
  }

  private reportProgress(
    callback: ProgressCallback | undefined,
    progress: GenerationProgressData
  ): void {
    if (callback) {
      try {
        callback(progress);
      } catch (error) {
        pipelineLogger.warn({ error }, 'Progress callback failed');
      }
    }
  }

  private generateConfig(
    input: WebsiteGenerationInput,
    intent: WebsiteGenerationResult['intent'],
    tokens: WebsiteGenerationResult['config'] extends Record<string, infer V> ? V : never,
    content: WebsiteGenerationResult['content']
  ): Record<string, unknown> {
    return {
      name: input.name,
      description: input.description || '',
      subdomain: input.subdomain,
      pages: intentParserService.determinePageStructure(intent),
      navigation: contentGeneratorService.generateNavigationLinks(
        intentParserService.determinePageStructure(intent)
      ),
      footer: contentGeneratorService.generateFooterContent(),
      design: {
        colors: tokens.colors,
        typography: tokens.typography,
        spacing: tokens.spacing,
      },
      seo: content.seo,
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  async regenerateContent(
    websiteId: string,
    sectionId: string,
    prompt: string
  ): Promise<{ content: string; html: string }> {
    pipelineLogger.info({ websiteId, sectionId }, 'Regenerating content');
    
    // This would fetch the existing website, parse the section, and regenerate
    // For now, return a placeholder
    return {
      content: 'Regenerated content based on: ' + prompt,
      html: `<div class="section">
  <h2>Updated Section</h2>
  <p>Regenerated content based on: ${prompt}</p>
</div>`,
    };
  }

  async updateDesign(
    websiteId: string,
    designChanges: Record<string, string>
  ): Promise<{ css: string }> {
    pipelineLogger.info({ websiteId, changes: Object.keys(designChanges) }, 'Updating design');
    
    // This would update the CSS based on design changes
    // For now, return placeholder CSS
    return {
      css: `/* Updated CSS for ${websiteId} */
:root {
  ${Object.entries(designChanges)
    .map(([key, value]) => `--color-${key}: ${value};`)
    .join('\n  ')}
}`,
    };
  }
}

export const websitePipelineService = new WebsitePipelineService();