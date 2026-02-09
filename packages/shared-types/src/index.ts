// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  subscriptionTier: 'free' | 'pro' | 'business';
  tokensBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAuth {
  id: string;
  email: string;
  name: string | null;
  subscriptionTier: string;
  tokensBalance: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: UserAuth;
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Website Types
// ============================================

export interface Website {
  id: string;
  userId: string;
  subdomain: string;
  customDomain: string | null;
  title: string | null;
  description: string | null;
  templateId: string;
  status: 'draft' | 'published' | 'archived';
  config: WebsiteConfig;
  designTokens: DesignTokens;
  generatedContent: GeneratedContent;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface WebsiteConfig {
  components: ComponentConfig[];
  sections: SectionConfig[];
  navigation: NavigationConfig;
  seo: SEOConfig;
}

export interface ComponentConfig {
  id: string;
  type: 'hero' | 'features' | 'testimonials' | 'contact' | 'gallery' | 'text' | 'cta';
  variant: string;
  props: Record<string, any>;
  styleOverrides?: Record<string, any>;
}

export interface SectionConfig {
  id: string;
  type: string;
  order: number;
  visible: boolean;
}

export interface NavigationConfig {
  items: NavItem[];
  style: 'horizontal' | 'vertical' | 'floating';
}

export interface NavItem {
  label: string;
  href: string;
  target?: '_blank' | '_self';
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string | null;
}

export interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseSize: number;
  };
  spacing: {
    unit: number;
    scale: number[];
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface GeneratedContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  features: FeatureContent[];
  testimonials: TestimonialContent[];
}

export interface FeatureContent {
  title: string;
  description: string;
  icon?: string;
}

export interface TestimonialContent {
  name: string;
  role: string;
  content: string;
  avatar?: string;
}

export interface CreateWebsiteRequest {
  subdomain: string;
  prompt: string;
}

export interface GenerateWebsiteRequest {
  websiteId: string;
  prompt: string;
}

// ============================================
// AI Types
// ============================================

export interface ParsedIntent {
  businessType: string;
  industry: string;
  brandName: string;
  products: string[];
  targetAudience: string | null;
  tone: string | null;
  colorPreference: string[] | null;
  featuresRequested: string[] | null;
  language: 'id' | 'en';
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AIChatSession {
  id: string;
  userId: string;
  messages: AIChatMessage[];
  context?: ParsedIntent;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateContentRequest {
  type: 'headline' | 'subheadline' | 'cta' | 'features' | 'testimonials';
  context: ParsedIntent;
  count?: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

// ============================================
// Token Economy Types
// ============================================

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: TokenTransactionType;
  description: string;
  relatedWebsiteId?: string;
  createdAt: Date;
}

export type TokenTransactionType = 
  | 'signup_bonus'
  | 'daily_login'
  | 'referral'
  | 'purchase'
  | 'website_generation'
  | 'image_generation'
  | 'blog_generation'
  | 'form_ai';

export interface TokenPackage {
  id: string;
  name: string;
  tokenAmount: number;
  priceIDR: number;
  bonusTokens: number;
}

// ============================================
// Blog Types
// ============================================

export interface BlogPost {
  id: string;
  websiteId: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: BlogContent;
  featuredImage: string | null;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogContent {
  blocks: ContentBlock[];
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'image' | 'list' | 'quote';
  content: any;
}

export interface CreateBlogRequest {
  websiteId: string;
  title: string;
  content: BlogContent;
  status?: 'draft' | 'published';
}

// ============================================
// Form Types
// ============================================

export interface FormSubmission {
  id: string;
  websiteId: string;
  formType: string;
  data: Record<string, any>;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: Date;
}

export interface FormTemplate {
  id: string;
  websiteId: string;
  name: string;
  formType: string;
  fields: FormField[];
  settings: FormSettings;
}

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormSettings {
  emailNotifications: boolean;
  webhookUrl?: string;
  successMessage: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Socket Events Types
// ============================================

export interface ServerToClientEvents {
  'chat:message': (message: AIChatMessage) => void;
  'chat:typing': (isTyping: boolean) => void;
  'generation:progress': (progress: GenerationProgress) => void;
  'generation:complete': (result: Website) => void;
  'generation:error': (error: { message: string }) => void;
}

export interface ClientToServerEvents {
  'chat:send': (message: string) => void;
  'generation:start': (request: GenerateWebsiteRequest) => void;
  'generation:cancel': () => void;
}

export interface GenerationProgress {
  stage: 'intent_parsing' | 'design' | 'content' | 'image' | 'deploy';
  progress: number;
  message: string;
}
