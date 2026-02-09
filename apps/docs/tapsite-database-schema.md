# Database Schema Lengkap: Tapsite.ai
## PostgreSQL Schema untuk AI Website Builder Platform

**Versi:** 1.0  
**Database:** PostgreSQL 15+  
**Extensions:** uuid-ossp, pg_trgm, postgis (optional)  

---

## 1. CORE TABLES

### 1.1 Users Table
```sql
-- User management dengan tiered subscriptions
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    full_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'free' 
        CHECK (subscription_tier IN ('free', 'pro', 'business')),
    subscription_started_at TIMESTAMP,
    subscription_expires_at TIMESTAMP,
    
    -- Token Economy
    tokens_balance INTEGER DEFAULT 50000,
    tokens_total_earned INTEGER DEFAULT 50000,
    tokens_total_spent INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    
    -- Timestamps
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,  -- Soft delete
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_expires_at);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
```

### 1.2 Websites Table
```sql
-- Website/projects created by users
CREATE TABLE websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identification
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    custom_domain VARCHAR(255) UNIQUE,
    
    -- Content
    title VARCHAR(200),
    description TEXT,
    favicon_url VARCHAR(500),
    
    -- Template
    template_id VARCHAR(50) NOT NULL,
    template_variant VARCHAR(20) DEFAULT 'default',
    
    -- Configuration (JSONB untuk flexibility)
    config JSONB DEFAULT '{}'::jsonb,
    design_tokens JSONB DEFAULT '{}'::jsonb,
    generated_content JSONB DEFAULT '{}'::jsonb,
    components_config JSONB DEFAULT '[]'::jsonb,
    
    -- AI Generation Metadata
    ai_model_used VARCHAR(50),
    generation_count INTEGER DEFAULT 0,
    last_generation_duration_ms INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'archived', 'suspended')),
    is_password_protected BOOLEAN DEFAULT false,
    password_hash VARCHAR(255),
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    unique_visitor_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP,
    
    -- SEO
    seo_title VARCHAR(70),
    seo_description VARCHAR(160),
    seo_keywords TEXT[],
    og_image_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP,
    last_generated_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_subdomain CHECK (subdomain ~* '^[a-z0-9-]+$'),
    CONSTRAINT valid_custom_domain CHECK (custom_domain IS NULL OR custom_domain ~* '^[a-z0-9.-]+$')
);

-- Indexes
CREATE INDEX idx_websites_user_id ON websites(user_id);
CREATE INDEX idx_websites_subdomain ON websites(subdomain);
CREATE INDEX idx_websites_status ON websites(status);
CREATE INDEX idx_websites_template ON websites(template_id);
CREATE INDEX idx_websites_created_at ON websites(created_at DESC);
CREATE INDEX idx_websites_published ON websites(user_id, published_at) WHERE status = 'published';

-- GIN index untuk JSONB queries
CREATE INDEX idx_websites_config ON websites USING GIN(config);
CREATE INDEX idx_websites_design_tokens ON websites USING GIN(design_tokens);
```

### 1.3 Templates Table
```sql
-- Pre-built website templates
CREATE TABLE templates (
    id VARCHAR(50) PRIMARY KEY,
    
    -- Metadata
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    industry_tags TEXT[],
    tone_tags TEXT[],
    
    -- Assets
    thumbnail_url VARCHAR(500),
    preview_url VARCHAR(500),
    demo_url VARCHAR(500),
    
    -- Structure
    component_structure JSONB NOT NULL,
    css_variables JSONB NOT NULL,
    default_sections TEXT[],
    
    -- Color schemes available
    available_color_schemes JSONB DEFAULT '[]'::jsonb,
    
    -- Pricing
    min_subscription_tier VARCHAR(20) DEFAULT 'free',
    is_premium BOOLEAN DEFAULT false,
    
    -- Stats
    usage_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(2,1),
    review_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_active ON templates(is_active) WHERE is_active = true;
CREATE INDEX idx_templates_featured ON templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_templates_industry ON templates USING GIN(industry_tags);
```

---

## 2. TOKEN ECONOMY TABLES

### 2.1 Token Transactions
```sql
-- Semua transaksi token (credit dan debit)
CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    amount INTEGER NOT NULL,  -- Positive = credit, Negative = debit
    balance_after INTEGER NOT NULL,
    
    -- Classification
    type VARCHAR(30) NOT NULL,
    -- signup_bonus, daily_login, referral, purchase
    -- website_generation, image_generation, blog_generation
    -- form_ai, product_description_ai
    
    description VARCHAR(255),
    
    -- Related entities
    related_website_id UUID REFERENCES websites(id),
    related_user_id UUID REFERENCES users(id),  -- For referral
    related_transaction_id UUID REFERENCES token_transactions(id),  -- For refunds
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT valid_amount CHECK (amount != 0)
);

-- Indexes
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_type ON token_transactions(type);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX idx_token_transactions_website ON token_transactions(related_website_id);

-- Partial indexes untuk analytics
CREATE INDEX idx_token_transactions_credit ON token_transactions(user_id, created_at) 
    WHERE amount > 0;
CREATE INDEX idx_token_transactions_debit ON token_transactions(user_id, created_at) 
    WHERE amount < 0;
```

### 2.2 Token Packages (untuk purchase)
```sql
-- Available token packages
CREATE TABLE token_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    token_amount INTEGER NOT NULL,
    price_idr INTEGER NOT NULL,  -- Harga dalam Rupiah
    price_usd DECIMAL(10,2),     -- Harga dalam USD (untuk international)
    
    -- Bonus
    bonus_tokens INTEGER DEFAULT 0,
    bonus_percentage INTEGER DEFAULT 0,
    
    -- Discount
    discount_percentage INTEGER DEFAULT 0,
    original_price_idr INTEGER,
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    available_from TIMESTAMP,
    available_until TIMESTAMP,
    
    -- Limits
    max_purchases_per_user INTEGER,  -- NULL = unlimited
    total_purchase_limit INTEGER,    -- NULL = unlimited
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 Token Purchases
```sql
-- Record pembelian token
CREATE TABLE token_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    package_id UUID REFERENCES token_packages(id),
    
    -- Amount
    token_amount INTEGER NOT NULL,
    price_paid_idr INTEGER NOT NULL,
    
    -- Payment
    payment_method VARCHAR(50),  -- transfer, qris, credit_card, ewallet
    payment_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_reference VARCHAR(100),
    payment_completed_at TIMESTAMP,
    
    -- Transaction link
    token_transaction_id UUID REFERENCES token_transactions(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_token_purchases_user_id ON token_purchases(user_id);
CREATE INDEX idx_token_purchases_status ON token_purchases(payment_status);
```

---

## 3. AI GENERATION TABLES

### 3.1 AI Generation Logs
```sql
-- Logging semua AI calls untuk monitoring dan cost tracking
CREATE TABLE ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Links
    website_id UUID REFERENCES websites(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Request details
    stage VARCHAR(30) NOT NULL,
    -- intent_parsing, design_decision, content_gen, refinement, image_gen
    
    model VARCHAR(50) NOT NULL,
    -- gpt-4, gpt-4-turbo, claude-3-5-sonnet, gemini-1.5-pro, etc.
    
    provider VARCHAR(30) NOT NULL,
    -- openai, anthropic, google, moonshot
    
    -- Token usage
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER GENERATED ALWAYS AS (COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)) STORED,
    
    -- Cost
    cost_usd DECIMAL(10,6),
    cost_idr DECIMAL(12,2) GENERATED ALWAYS AS (cost_usd * 16000) STORED,  -- Approximate rate
    
    -- Performance
    latency_ms INTEGER,
    
    -- Quality metrics
    retry_count INTEGER DEFAULT 0,
    was_cached BOOLEAN DEFAULT false,
    
    -- Status
    success BOOLEAN DEFAULT true,
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Content (optional, for debugging)
    prompt_preview TEXT,  -- First 500 chars
    response_preview TEXT,  -- First 500 chars
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes untuk analytics
CREATE INDEX idx_ai_logs_website_id ON ai_generation_logs(website_id);
CREATE INDEX idx_ai_logs_user_id ON ai_generation_logs(user_id);
CREATE INDEX idx_ai_logs_model ON ai_generation_logs(model);
CREATE INDEX idx_ai_logs_stage ON ai_generation_logs(stage);
CREATE INDEX idx_ai_logs_created_at ON ai_generation_logs(created_at DESC);
CREATE INDEX idx_ai_logs_success ON ai_generation_logs(success);

-- Partial indexes
CREATE INDEX idx_ai_logs_failed ON ai_generation_logs(created_at) WHERE success = false;
CREATE INDEX idx_ai_logs_costly ON ai_generation_logs(cost_usd) WHERE cost_usd > 0.01;
```

### 3.2 Prompt Versions
```sql
-- Version control untuk prompts
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    stage VARCHAR(30) NOT NULL,
    version VARCHAR(10) NOT NULL,
    
    -- Model config
    model VARCHAR(50) NOT NULL,
    provider VARCHAR(30) NOT NULL,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER,
    
    -- Prompt content
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    
    -- Output schema (JSON schema)
    output_schema JSONB,
    
    -- Validation rules
    validation_rules JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(name, stage, version)
);

CREATE INDEX idx_prompt_versions_stage ON prompt_versions(stage);
CREATE INDEX idx_prompt_versions_active ON prompt_versions(is_active) WHERE is_active = true;
```

---

## 4. HEADLESS CMS TABLES

### 4.1 Blog Posts
```sql
-- Blog content untuk setiap website
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    
    -- Content
    slug VARCHAR(200) NOT NULL,
    title VARCHAR(200) NOT NULL,
    excerpt TEXT,
    content JSONB NOT NULL,  -- TipTap/ProseMirror format
    
    -- Media
    featured_image VARCHAR(500),
    gallery_images TEXT[],
    
    -- SEO
    seo_title VARCHAR(70),
    seo_description VARCHAR(160),
    seo_keywords TEXT[],
    
    -- AI Generation
    is_ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    ai_model_used VARCHAR(50),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Publishing
    published_at TIMESTAMP,
    scheduled_at TIMESTAMP,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(website_id, slug)
);

-- Indexes
CREATE INDEX idx_blog_posts_website_id ON blog_posts(website_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published ON blog_posts(website_id, published_at) 
    WHERE status = 'published';
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);

-- Full-text search
CREATE INDEX idx_blog_posts_search ON blog_posts 
    USING gin(to_tsvector('indonesian', 
        COALESCE(title, '') || ' ' || 
        COALESCE(excerpt, '') || ' ' ||
        COALESCE(content->>'text', '')
    ));
```

### 4.2 Blog Categories
```sql
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(website_id, slug)
);

-- Junction table
CREATE TABLE blog_post_categories (
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_post_id, category_id)
);
```

### 4.3 Blog Tags
```sql
CREATE TABLE blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(website_id, slug)
);

-- Junction table
CREATE TABLE blog_post_tags (
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_post_id, tag_id)
);
```

---

## 5. FORM & LEAD TABLES

### 5.1 Form Submissions
```sql
-- Data dari form submissions (contact, order, etc.)
CREATE TABLE form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    
    -- Form type
    form_type VARCHAR(50) NOT NULL,
    -- contact, order, registration, newsletter, custom
    
    -- Submitter info
    submitter_name VARCHAR(100),
    submitter_email VARCHAR(255),
    submitter_phone VARCHAR(20),
    
    -- Data (flexible JSONB)
    data JSONB NOT NULL,
    
    -- AI processing
    is_ai_processed BOOLEAN DEFAULT false,
    ai_summary TEXT,
    ai_sentiment VARCHAR(20),
    
    -- Notifications
    email_notified BOOLEAN DEFAULT false,
    whatsapp_notified BOOLEAN DEFAULT false,
    webhook_called BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'new' 
        CHECK (status IN ('new', 'read', 'replied', 'archived', 'spam')),
    
    -- Source
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_form_submissions_website_id ON form_submissions(website_id);
CREATE INDEX idx_form_submissions_status ON form_submissions(status);
CREATE INDEX idx_form_submissions_created_at ON form_submissions(created_at DESC);
CREATE INDEX idx_form_submissions_type ON form_submissions(form_type);

-- Partial index untuk unread
CREATE INDEX idx_form_submissions_unread ON form_submissions(created_at) 
    WHERE status = 'new';
```

### 5.2 Form Templates
```sql
-- Pre-defined form structures
CREATE TABLE form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    form_type VARCHAR(50) NOT NULL,
    
    -- Field definitions
    fields JSONB NOT NULL,
    -- [
    --   { "name": "email", "type": "email", "required": true, "label": "Email" },
    --   { "name": "message", "type": "textarea", "required": true, "label": "Pesan" }
    -- ]
    
    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,
    -- { "email_notifications": true, "webhook_url": "...", "success_message": "..." }
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. ANALYTICS TABLES

### 6.1 Website Analytics (Daily Rollup)
```sql
-- Daily aggregated stats (performance optimization)
CREATE TABLE website_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Traffic
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    sessions INTEGER DEFAULT 0,
    
    -- Engagement
    avg_session_duration_seconds INTEGER,
    bounce_rate DECIMAL(5,2),
    
    -- Sources
    traffic_sources JSONB DEFAULT '{}'::jsonb,
    -- { "direct": 100, "search": 50, "social": 30, "referral": 20 }
    
    -- Devices
    device_breakdown JSONB DEFAULT '{}'::jsonb,
    -- { "mobile": 150, "desktop": 50 }
    
    -- Locations
    top_countries JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(website_id, date)
);

CREATE INDEX idx_analytics_daily_website_date ON website_analytics_daily(website_id, date DESC);
```

### 6.2 Page Views (Raw Data)
```sql
-- Individual page views (保留最近90天)
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    
    -- Page info
    page_path VARCHAR(500),
    referrer VARCHAR(500),
    
    -- Visitor info (anonymized)
    visitor_hash VARCHAR(64),  -- Hashed IP + User Agent
    session_id VARCHAR(100),
    
    -- Device
    device_type VARCHAR(20),  -- mobile, desktop, tablet
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- Location
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Metadata
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE page_views_y2024m01 PARTITION OF page_views
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- ... create partitions as needed

-- Indexes
CREATE INDEX idx_page_views_website_id ON page_views(website_id);
CREATE INDEX idx_page_views_visitor ON page_views(visitor_hash);
CREATE INDEX idx_page_views_session ON page_views(session_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);
```

---

## 7. AFFILIATE TABLES

### 7.1 Affiliate Profiles
```sql
-- Extended user data untuk affiliates
CREATE TABLE affiliate_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
    
    -- Commission
    commission_rate DECIMAL(4,2) DEFAULT 30.00,  -- 30%
    commission_tier VARCHAR(20) DEFAULT 'standard',
    
    -- Payment info
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_account_name VARCHAR(100),
    ewallet_type VARCHAR(20),
    ewallet_number VARCHAR(20),
    
    -- Stats
    total_referrals INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_earnings_idr INTEGER DEFAULT 0,
    total_paid_idr INTEGER DEFAULT 0,
    pending_earnings_idr INTEGER DEFAULT 0,
    
    -- Referral code
    referral_code VARCHAR(20) UNIQUE,
    
    -- Review
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_affiliate_profiles_status ON affiliate_profiles(status);
CREATE INDEX idx_affiliate_profiles_code ON affiliate_profiles(referral_code);
```

### 7.2 Affiliate Referrals
```sql
CREATE TABLE affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    affiliate_user_id UUID NOT NULL REFERENCES users(id),
    referred_user_id UUID UNIQUE REFERENCES users(id),
    
    -- Tracking
    referral_code_used VARCHAR(20),
    utm_source VARCHAR(100),
    ip_address INET,
    
    -- Conversion
    converted_at TIMESTAMP,
    conversion_value_idr INTEGER,
    commission_earned_idr INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_user_id);
CREATE INDEX idx_affiliate_referrals_converted ON affiliate_referrals(converted_at) 
    WHERE converted_at IS NOT NULL;
```

---

## 8. SYSTEM TABLES

### 8.1 Audit Logs
```sql
-- Comprehensive audit trail
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    -- create, update, delete, login, logout, generate, publish
    
    entity_type VARCHAR(50) NOT NULL,
    -- user, website, blog_post, form_submission, etc.
    
    entity_id UUID,
    user_id UUID REFERENCES users(id),
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    changes_summary TEXT,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### 8.2 System Config
```sql
-- Dynamic configuration
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 9. VIEWS (untuk Reporting)

### 9.1 User Dashboard View
```sql
CREATE VIEW user_dashboard AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.subscription_tier,
    u.tokens_balance,
    COUNT(DISTINCT w.id) as website_count,
    COUNT(DISTINCT CASE WHEN w.status = 'published' THEN w.id END) as published_website_count,
    COALESCE(SUM(w.view_count), 0) as total_views,
    (SELECT COUNT(*) FROM form_submissions fs 
     JOIN websites ws ON fs.website_id = ws.id 
     WHERE ws.user_id = u.id AND fs.status = 'new') as new_leads
FROM users u
LEFT JOIN websites w ON u.id = w.user_id AND w.deleted_at IS NULL
WHERE u.is_active = true
GROUP BY u.id;
```

### 9.2 Daily Revenue View
```sql
CREATE VIEW daily_revenue AS
SELECT 
    DATE(tp.created_at) as date,
    COUNT(*) as purchase_count,
    SUM(tp.price_paid_idr) as total_revenue_idr,
    SUM(tp.token_amount) as total_tokens_sold
FROM token_purchases tp
WHERE tp.payment_status = 'completed'
GROUP BY DATE(tp.created_at)
ORDER BY date DESC;
```

---

## 10. FUNCTIONS & TRIGGERS

### 10.1 Auto-update Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... apply to other tables
```

### 10.2 Token Balance Validation
```sql
CREATE OR REPLACE FUNCTION validate_token_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has enough tokens for debit transactions
    IF NEW.amount < 0 THEN
        DECLARE
            current_balance INTEGER;
        BEGIN
            SELECT tokens_balance INTO current_balance
            FROM users WHERE id = NEW.user_id;
            
            IF current_balance + NEW.amount < 0 THEN
                RAISE EXCEPTION 'Insufficient token balance';
            END IF;
        END;
    END IF;
    
    -- Update user balance
    UPDATE users 
    SET 
        tokens_balance = tokens_balance + NEW.amount,
        tokens_total_earned = CASE WHEN NEW.amount > 0 
            THEN tokens_total_earned + NEW.amount 
            ELSE tokens_total_earned END,
        tokens_total_spent = CASE WHEN NEW.amount < 0 
            THEN tokens_total_spent + ABS(NEW.amount) 
            ELSE tokens_total_spent END
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_token_transaction
    BEFORE INSERT ON token_transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_token_balance();
```

---

## 11. INITIAL DATA

```sql
-- Default token packages
INSERT INTO token_packages (name, description, token_amount, price_idr, is_featured) VALUES
('Starter', 'Paket pemula untuk mencoba', 50000, 50000, false),
('Popular', 'Paket paling populer', 150000, 129000, true),
('Pro', 'Untuk pengguna aktif', 500000, 399000, false),
('Business', 'Untuk bisnis dan agency', 2000000, 1499000, false);

-- Default system config
INSERT INTO system_config (key, value, description) VALUES
('signup_token_bonus', '50000', 'Token bonus for new users'),
('daily_login_bonus', '1000', 'Token bonus for daily login'),
('referral_bonus', '10000', 'Token bonus for successful referral'),
('website_generation_cost', '10000', 'Token cost for generating website'),
('image_generation_cost', '2000', 'Token cost for generating image');
```

---

*Schema ini dirancang untuk scalability, dengan proper indexing, partitioning untuk high-volume tables, dan triggers untuk data integrity.*
