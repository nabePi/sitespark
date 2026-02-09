import { Request } from 'express';
import { User, UserTier, Website, WebsiteStatus, BlogPost, BlogPostStatus, TokenTransaction, TokenTransactionType, FormSubmission } from '@prisma/client';

// Auth Types
export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface UserPayload {
  id: string;
  email: string;
  tier: UserTier;
  tokensBalance: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

// AI Types
export interface IntentAnalysis {
  intent: string;
  category: string;
  features: string[];
  targetAudience: string;
  tone: string;
  style: string;
}

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseSize: string;
    scale: number;
  };
  spacing: {
    unit: string;
    scale: number[];
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

export interface GeneratedContent {
  title: string;
  headline: string;
  subheadline: string;
  sections: ContentSection[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface ContentSection {
  id: string;
  type: 'hero' | 'features' | 'about' | 'services' | 'testimonials' | 'cta' | 'contact' | 'footer';
  heading: string;
  content: string;
  items?: string[];
}

export interface WebsiteGenerationInput {
  userId: string;
  prompt: string;
  subdomain: string;
  name: string;
  description?: string;
}

export interface WebsiteGenerationResult {
  html: string;
  css: string;
  config: Record<string, unknown>;
  intent: IntentAnalysis;
  content: GeneratedContent;
}

// Token Economy Types
export interface TokenOperation {
  userId: string;
  amount: number;
  type: TokenTransactionType;
  description: string;
  metadata?: Record<string, unknown>;
}

// Socket.io Types
export interface ServerToClientEvents {
  'generation:progress': (data: GenerationProgressData) => void;
  'generation:complete': (data: GenerationCompleteData) => void;
  'generation:error': (data: GenerationErrorData) => void;
  'chat:message': (data: ChatMessageData) => void;
}

export interface ClientToServerEvents {
  'chat:send': (data: { message: string; websiteId?: string }) => void;
  'generation:start': (data: WebsiteGenerationInput) => void;
  'join:room': (roomId: string) => void;
  'leave:room': (roomId: string) => void;
}

export interface GenerationProgressData {
  stage: 'intent' | 'design' | 'content' | 'assembly' | 'finalization';
  progress: number;
  message: string;
}

export interface GenerationCompleteData {
  websiteId: string;
  previewUrl: string;
}

export interface GenerationErrorData {
  code: string;
  message: string;
}

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Re-export Prisma types
export {
  User,
  UserTier,
  Website,
  WebsiteStatus,
  BlogPost,
  BlogPostStatus,
  TokenTransaction,
  TokenTransactionType,
  FormSubmission,
};