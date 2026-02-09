import { aiRouter } from '../ai/aiRouter';
import logger from '../../config/logger';
import { IntentAnalysis, DesignTokens, GeneratedContent } from '../../types';

const designLogger = logger.child({ component: 'DesignGeneratorService' });

export class DesignGeneratorService {
  async generateDesignTokens(intent: IntentAnalysis): Promise<DesignTokens> {
    designLogger.debug({ intent: intent.intent }, 'Generating design tokens');

    try {
      const tokens = await aiRouter.generateDesignTokens(intent);
      designLogger.info({ primary: tokens.colors.primary }, 'Design tokens generated');
      return tokens;
    } catch (error) {
      designLogger.error({ error }, 'Failed to generate design tokens');
      return this.getDefaultTokens(intent);
    }
  }

  private getDefaultTokens(intent: IntentAnalysis): DesignTokens {
    // Category-based color schemes
    const colorSchemes: Record<string, Partial<DesignTokens['colors']>> = {
      business: {
        primary: '#1E40AF',
        secondary: '#3B82F6',
        accent: '#F59E0B',
      },
      portfolio: {
        primary: '#7C3AED',
        secondary: '#A78BFA',
        accent: '#EC4899',
      },
      blog: {
        primary: '#059669',
        secondary: '#10B981',
        accent: '#F97316',
      },
      ecommerce: {
        primary: '#DC2626',
        secondary: '#EF4444',
        accent: '#22C55E',
      },
      landing: {
        primary: '#0891B2',
        secondary: '#06B6D4',
        accent: '#8B5CF6',
      },
      personal: {
        primary: '#4338CA',
        secondary: '#6366F1',
        accent: '#14B8A6',
      },
    };

    const colors = colorSchemes[intent.category] || colorSchemes.business;

    return {
      colors: {
        primary: colors.primary || '#3B82F6',
        secondary: colors.secondary || '#10B981',
        accent: colors.accent || '#F59E0B',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textMuted: '#6B7280',
      },
      typography: {
        headingFont: 'system-ui, -apple-system, sans-serif',
        bodyFont: 'system-ui, -apple-system, sans-serif',
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
        small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        large: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    };
  }

  generateCSSVariables(tokens: DesignTokens): string {
    return `
:root {
  /* Colors */
  --color-primary: ${tokens.colors.primary};
  --color-secondary: ${tokens.colors.secondary};
  --color-accent: ${tokens.colors.accent};
  --color-background: ${tokens.colors.background};
  --color-surface: ${tokens.colors.surface};
  --color-text: ${tokens.colors.text};
  --color-text-muted: ${tokens.colors.textMuted};

  /* Typography */
  --font-heading: ${tokens.typography.headingFont};
  --font-body: ${tokens.typography.bodyFont};
  --font-size-base: ${tokens.typography.baseSize};
  --font-scale: ${tokens.typography.scale};

  /* Spacing */
  --spacing-unit: ${tokens.spacing.unit};
  ${tokens.spacing.scale.map((s, i) => `  --spacing-${i + 1}: calc(var(--spacing-unit) * ${s});`).join('\n')}

  /* Border Radius */
  --radius-small: ${tokens.borderRadius.small};
  --radius-medium: ${tokens.borderRadius.medium};
  --radius-large: ${tokens.borderRadius.large};

  /* Shadows */
  --shadow-small: ${tokens.shadows.small};
  --shadow-medium: ${tokens.shadows.medium};
  --shadow-large: ${tokens.shadows.large};
}
    `.trim();
  }

  generateGlobalStyles(tokens: DesignTokens): string {
    return `
${this.generateCSSVariables(tokens)}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-background);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: var(--spacing-3);
}

h1 { font-size: calc(var(--font-size-base) * pow(var(--font-scale), 4)); }
h2 { font-size: calc(var(--font-size-base) * pow(var(--font-scale), 3)); }
h3 { font-size: calc(var(--font-size-base) * pow(var(--font-scale), 2)); }
h4 { font-size: calc(var(--font-size-base) * var(--font-scale)); }

p {
  margin-bottom: var(--spacing-3);
}

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--color-secondary);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--font-size-base);
  font-weight: 500;
  border-radius: var(--radius-medium);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-secondary);
  color: white;
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
}

.btn-secondary:hover {
  background-color: var(--color-primary);
  color: white;
}
    `.trim();
  }

  generateHTMLLayout(content: GeneratedContent, tokens: DesignTokens): string {
    const navLinks = content.sections.slice(0, 4).map(s => ({
      label: s.heading,
      href: `#${s.id}`,
    }));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.seo.title}</title>
  <meta name="description" content="${content.seo.description}">
  <style>
    ${this.generateGlobalStyles(tokens)}
    
    /* Header */
    .header {
      position: sticky;
      top: 0;
      background: var(--color-background);
      border-bottom: 1px solid rgba(0,0,0,0.1);
      z-index: 100;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-3) var(--spacing-4);
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-primary);
    }
    
    .nav {
      display: flex;
      gap: var(--spacing-4);
    }
    
    .nav a {
      font-weight: 500;
    }
    
    /* Sections */
    .section {
      padding: var(--spacing-8) 0;
    }
    
    .section-hero {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
      color: white;
      text-align: center;
      padding: var(--spacing-8) 0;
    }
    
    .section-hero h1 {
      color: white;
      margin-bottom: var(--spacing-4);
    }
    
    .section-hero p {
      font-size: 1.25rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto var(--spacing-6);
    }
    
    .section-features {
      background: var(--color-surface);
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-6);
      margin-top: var(--spacing-6);
    }
    
    .feature-card {
      background: var(--color-background);
      padding: var(--spacing-6);
      border-radius: var(--radius-large);
      box-shadow: var(--shadow-medium);
    }
    
    .feature-card h3 {
      color: var(--color-primary);
      margin-bottom: var(--spacing-3);
    }
    
    .section-cta {
      text-align: center;
      background: var(--color-surface);
    }
    
    .section-cta .btn {
      margin-top: var(--spacing-4);
    }
    
    /* Footer */
    .footer {
      background: var(--color-text);
      color: white;
      padding: var(--spacing-8) 0;
      text-align: center;
    }
    
    .footer-links {
      display: flex;
      justify-content: center;
      gap: var(--spacing-4);
      margin-bottom: var(--spacing-4);
    }
    
    .footer-links a {
      color: rgba(255,255,255,0.7);
    }
    
    .footer-links a:hover {
      color: white;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-content container">
      <a href="/" class="logo">${content.title}</a>
      <nav class="nav">
        ${navLinks.map(link => `<a href="${link.href}">${link.label}</a>`).join('\n        ')}
      </nav>
    </div>
  </header>

  <main>
    ${content.sections.map(section => this.renderSection(section)).join('\n    ')}
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </div>
      <p>&copy; ${new Date().getFullYear()} ${content.title}. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
    `.trim();
  }

  private renderSection(section: GeneratedContent['sections'][0]): string {
    const sectionClass = `section section-${section.type}`;
    
    switch (section.type) {
      case 'hero':
        return `
    <section id="${section.id}" class="${sectionClass}">
      <div class="container">
        <h1>${section.heading}</h1>
        <p>${section.content}</p>
        <a href="#contact" class="btn btn-primary">Get Started</a>
      </div>
    </section>`;
      
      case 'features':
        return `
    <section id="${section.id}" class="${sectionClass}">
      <div class="container">
        <h2>${section.heading}</h2>
        <p>${section.content}</p>
        <div class="features-grid">
          ${section.items?.map((item, i) => `
          <div class="feature-card">
            <h3>${item}</h3>
            <p>Feature ${i + 1} description goes here. This is a placeholder for the actual feature description.</p>
          </div>`).join('')}
        </div>
      </div>
    </section>`;
      
      case 'cta':
        return `
    <section id="${section.id}" class="${sectionClass}">
      <div class="container">
        <h2>${section.heading}</h2>
        <p>${section.content}</p>
        <a href="#contact" class="btn btn-primary">Get Started Now</a>
      </div>
    </section>`;
      
      default:
        return `
    <section id="${section.id}" class="${sectionClass}">
      <div class="container">
        <h2>${section.heading}</h2>
        <p>${section.content}</p>
      </div>
    </section>`;
    }
  }
}

export const designGeneratorService = new DesignGeneratorService();