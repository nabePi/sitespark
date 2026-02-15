# Prompt Engineering Techniques: sitespark
## Advanced Prompt Engineering untuk AI Website Generation

**Versi:** 1.0  
**Models:** GPT-4, Claude 3.5 Sonnet, Gemini 1.5 Pro  
**Use Case:** AI-to-Landing Page Generation  

---

## 1. FUNDAMENTAL PRINCIPLES

### 1.1 Prompt Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROMPT STRUCTURE                              │
├─────────────────────────────────────────────────────────────────┤
│  1. SYSTEM PROMPT (Context & Rules)                              │
│     ├── Role definition                                          │
│     ├── Task description                                         │
│     ├── Output format specification                              │
│     └── Constraints & guidelines                                 │
│                                                                  │
│  2. FEW-SHOT EXAMPLES (Demonstrations)                          │
│     ├── Input examples                                           │
│     ├── Expected outputs                                         │
│     └── Edge cases                                               │
│                                                                  │
│  3. USER INPUT (Dynamic content)                                 │
│     └── User's specific request                                  │
│                                                                  │
│  4. OUTPUT FORMAT (Structured response)                         │
│     ├── JSON schema                                              │
│     └── Validation rules                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Version Control untuk Prompts

```typescript
// prompt-registry.ts

interface PromptVersion {
  id: string;
  name: string;
  version: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  userPromptTemplate: string;
  outputSchema: JSONSchema;
  examples: PromptExample[];
  validationRules: ValidationRule[];
  performance: PromptMetrics;
}

interface PromptMetrics {
  avgTokens: number;
  avgLatency: number;
  successRate: number;
  userSatisfaction: number;
  costPerRequest: number;
}

// Prompt versioning strategy
const promptVersions: Record<string, PromptVersion[]> = {
  'intent-parsing': [
    { version: '1.0.0', model: 'gpt-4', /* ... */ },
    { version: '1.1.0', model: 'gpt-4', /* ... */ },
    { version: '2.0.0', model: 'claude-3-5-sonnet', isDefault: true },
  ],
  'content-generation': [
    { version: '1.0.0', model: 'gpt-4', /* ... */ },
    { version: '2.0.0', model: 'claude-3-5-sonnet', isDefault: true },
  ]
};

// A/B testing framework
function selectPromptVersion(
  promptType: string,
  userSegment: string
): PromptVersion {
  // 10% traffic ke experimental version
  if (Math.random() < 0.1) {
    return getExperimentalVersion(promptType);
  }
  
  // Return default version
  return promptVersions[promptType].find(p => p.isDefault);
}
```

---

## 2. STAGE 1: INTENT PARSING PROMPT

### 2.1 System Prompt

```typescript
const INTENT_PARSING_SYSTEM_PROMPT = `
Kamu adalah Intent Parser AI untuk platform website builder sitespark.
Tugasmu adalah menganalisis input pengguna dan mengekstrak informasi terstruktur untuk pembuatan website.

# KONTEKS
Platform: sitespark - AI Landing Page Builder untuk pasar Indonesia
Target User: UMKM, freelancer, dan individu tanpa skill teknis
Output: Website landing page profesional dalam 1 menit

# ATURAN EKSTRAKSI

1. Business Type (wajib)
   - Identifikasi jenis bisnis dari konteks
   - Kategori: food_and_beverage, retail, services, creative, education, events, technology, other

2. Industry (wajib)
   - Sub-kategori spesifik (e.g., "kue_kering", "fashion", "fotografi")

3. Brand Name (wajib)
   - Ekstrak nama brand/bisnis
   - Jika tidak disebutkan, generate yang sesuai

4. Products/Services (wajib)
   - List produk atau layanan yang ditawarkan
   - Maksimal 10 item

5. Target Audience (opsional)
   - Demografi target pelanggan
   - Default: general jika tidak disebutkan

6. Tone/Style (opsional)
   - Warm, professional, modern, traditional, playful, luxury
   - Infer dari jenis bisnis jika tidak disebutkan

7. Color Preference (opsional)
   - Ekstrak warna yang disebutkan
   - Suggest berdasarkan industry jika tidak ada

8. Features Requested (opsional)
   - Fitur spesifik: contact_form, product_catalog, booking, testimonials, gallery

9. Language (default: id)
   - id (Bahasa Indonesia) atau en (English)

# CONSTRAINTS
- JANGAN membuat asumsi yang tidak didukung data
- JANGAN over-engineer jawaban
- Jika informasi tidak tersedia, gunakan null atau default value
- Pastikan output valid JSON
- Maksimum 2000 karakter untuk setiap field teks

# DESIGN PRINCIPLES
- Food & Beverage: warm colors (orange, cream, brown), friendly tone
- Retail: bright colors (pink, blue, yellow), energetic tone  
- Services: cool colors (blue, gray, white), professional tone
- Creative: bold colors (purple, magenta), expressive tone
- Technology: dark colors (black, navy, cyan), modern tone
`;
```

### 2.2 User Prompt Template

```typescript
const INTENT_PARSING_USER_TEMPLATE = `
Analisis request berikut dan ekstrak informasi untuk pembuatan website:

USER INPUT:
"{{userInput}}"

EKSTRAK INFORMASI BERIKUT:
1. Apa jenis bisnisnya?
2. Apa nama brand/bisnisnya?
3. Produk/layanan apa yang ditawarkan?
4. Siapa target pelanggannya?
5. Tone/style apa yang cocok?
6. Ada preferensi warna?
7. Fitur apa yang mungkin dibutuhkan?
8. Bahasa apa yang digunakan?

Respond dengan JSON yang valid:
{
  "business_type": "...",
  "industry": "...",
  "brand_name": "...",
  "products": [...],
  "target_audience": "...",
  "tone": "...",
  "color_preference": [...],
  "features_requested": [...],
  "language": "id"
}
`;
```

### 2.3 Few-Shot Examples

```typescript
const INTENT_PARSING_EXAMPLES = [
  {
    input: "Bikin website untuk toko kue nastar sama putri salju, namanya Toko Ani, warna pink",
    output: {
      business_type: "food_and_beverage",
      industry: "kue_kering",
      brand_name: "Toko Ani",
      products: ["nastar", "putri salju"],
      target_audience: "keluarga_menengah",
      tone: "warm_homemade",
      color_preference: ["pink", "cream"],
      features_requested: ["product_catalog", "contact_form", "whatsapp"],
      language: "id"
    }
  },
  {
    input: "I need a portfolio website for my photography business, modern style",
    output: {
      business_type: "creative",
      industry: "fotografi",
      brand_name: null,
      products: ["jasa_fotografi"],
      target_audience: "general",
      tone: "modern_professional",
      color_preference: ["black", "white", "gray"],
      features_requested: ["gallery", "contact_form", "testimonials"],
      language: "en"
    }
  },
  {
    input: "Website untuk jual baju hijab online, target anak muda, vibe aesthetic",
    output: {
      business_type: "retail",
      industry: "fashion_hijab",
      brand_name: null,
      products: ["hijab", "pakaian_muslim"],
      target_audience: "anak_muda_perempuan",
      tone: "aesthetic_trendy",
      color_preference: ["pastel", "nude", "earth_tone"],
      features_requested: ["product_catalog", "shopping_cart", "contact_form"],
      language: "id"
    }
  }
];
```

### 2.4 Output Schema Validation

```typescript
const INTENT_PARSING_SCHEMA = {
  type: "object",
  properties: {
    business_type: {
      type: "string",
      enum: ["food_and_beverage", "retail", "services", "creative", 
             "education", "events", "technology", "other"]
    },
    industry: { type: "string", maxLength: 50 },
    brand_name: { type: ["string", "null"], maxLength: 100 },
    products: {
      type: "array",
      items: { type: "string", maxLength: 100 },
      maxItems: 10
    },
    target_audience: { type: ["string", "null"], maxLength: 100 },
    tone: {
      type: ["string", "null"],
      enum: ["warm", "professional", "modern", "traditional", 
             "playful", "luxury", "minimalist", null]
    },
    color_preference: {
      type: ["array", "null"],
      items: { type: "string", maxLength: 20 },
      maxItems: 5
    },
    features_requested: {
      type: ["array", "null"],
      items: {
        type: "string",
        enum: ["contact_form", "product_catalog", "booking", 
               "testimonials", "gallery", "blog", "whatsapp", "newsletter"]
      }
    },
    language: {
      type: "string",
      enum: ["id", "en"],
      default: "id"
    }
  },
  required: ["business_type", "industry", "brand_name", "products", "language"]
};

// Validation function
function validateIntentOutput(output: any): ValidationResult {
  const ajv = new Ajv();
  const validate = ajv.compile(INTENT_PARSING_SCHEMA);
  
  if (!validate(output)) {
    return {
      valid: false,
      errors: validate.errors
    };
  }
  
  // Additional business logic validation
  if (output.brand_name === null) {
    output.brand_name = generateBrandName(output.industry);
  }
  
  if (!output.color_preference || output.color_preference.length === 0) {
    output.color_preference = suggestColors(output.business_type, output.tone);
  }
  
  return { valid: true, data: output };
}
```

---

## 3. STAGE 2: CONTENT GENERATION PROMPT

### 3.1 System Prompt untuk Headline Generation

```typescript
const HEADLINE_GENERATION_SYSTEM_PROMPT = `
Kamu adalah Copywriter AI spesialis headline untuk website landing page.
Tugasmu adalah membuat headline yang compelling, memorable, dan conversion-optimized.

# KARAKTERISTIK HEADLINE YANG BAIK
1. Clear: Langsung mengkomunikasikan value proposition
2. Concise: Maksimal 10 kata idealnya
3. Compelling: Membuat pengunjung ingin tahu lebih
4. Customer-centric: Fokus pada benefit, bukan feature
5. Action-oriented: Mengajak untuk bertindak

# TEKNIK COPYWRITING
1. Problem-Agitation-Solution (PAS)
   - Identifikasi masalah customer
   - Agitasi (perbesar pain point)
   - Tawarkan solusi

2. Before-After Bridge
   - Before: Keadaan sekarang (problem)
   - After: Keadaan ideal (solution)
   - Bridge: Bagaimana mencapainya

3. Feature-to-Benefit Translation
   - Jangan sebut feature
   - Terjemahkan ke emotional benefit

4. Social Proof Integration
   - "Join 1000+ happy customers"
   - "Trusted by leading brands"

# TONE GUIDELINES
- Warm: Gunakan kata sifat yang menghangatkan (homemade, istimewa, lezat)
- Professional: Gunakan kata yang formal dan可信 (terpercaya, profesional, berkualitas)
- Playful: Gunakan bahasa gaul yang sesuai (kece, sat set, auto)
- Luxury: Gunakan kata yang eksklusif (premium, eksklusif, terpilih)

# CONSTRAINTS
- Maksimal 12 kata untuk headline utama
- Maksimal 20 kata untuk sub-headline
- Gunakan bahasa sesuai target audience
- Hindari jargon teknis
- Hindari klise yang terlalu umum
- Pastikan headline unique untuk brand
`;
```

### 3.2 Few-Shot Examples untuk Headline

```typescript
const HEADLINE_EXAMPLES = [
  {
    context: {
      business_type: "food_and_beverage",
      industry: "kue_kering",
      brand_name: "Toko Ani",
      products: ["nastar", "putri salju"],
      tone: "warm_homemade",
      target_audience: "keluarga_menengah"
    },
    output: {
      headline: "Kue Kering Homemade, Rasa Istimewa di Setiap Gigitan",
      subheadline: "Nastar dan Putri Salju dengan resep turun-temurun, dibuat dengan cinta untuk momen spesial Anda",
      cta: "Pesan Sekarang"
    }
  },
  {
    context: {
      business_type: "creative",
      industry: "fotografi",
      brand_name: "Lens Studio",
      products: ["jasa_fotografi"],
      tone: "modern_professional",
      target_audience: "pasangan_muda"
    },
    output: {
      headline: "Abadikan Momen Berharga, Kenangan Abadi Seumur Hidup",
      subheadline: "Fotografi profesional untuk wedding, pre-wedding, dan momen spesial Anda dengan hasil yang memukau",
      cta: "Booking Sekarang"
    }
  },
  {
    context: {
      business_type: "retail",
      industry: "fashion_hijab",
      brand_name: "Hijab Chic",
      products: ["hijab", "pakaian_muslim"],
      tone: "aesthetic_trendy",
      target_audience: "anak_muda_perempuan"
    },
    output: {
      headline: "Tampil Stylish Tetap Syari, Fashion Hijab Kekinian",
      subheadline: "Koleksi hijab dan pakaian muslim modern untuk gaya sehari-hari yang effortless dan elegan",
      cta: "Lihat Koleksi"
    }
  }
];
```

### 3.3 Chain-of-Thought Prompting

```typescript
const HEADLINE_GENERATION_COT_TEMPLATE = `
Buatkan headline untuk website dengan informasi berikut:

KONTEKS BISNIS:
- Jenis: {{business_type}}
- Industri: {{industry}}
- Brand: {{brand_name}}
- Produk: {{products}}
- Tone: {{tone}}
- Target: {{target_audience}}

IKUTI LANGKAH BERIKUT:

Langkah 1: Analisis Target Audience
Target audience kita adalah {{target_audience}}. Mereka menghargai [identifikasi values dari tone].
Pain point mereka adalah [identifikasi problem yang relevan dengan produk].

Langkah 2: Identifikasi Unique Value Proposition
Produk kita {{products}} menawarkan [benefit utama].
Yang membedakan kita adalah [differentiator].

Langkah 3: Pilih Copywriting Angle
Angle yang paling cocok adalah [PAS/Before-After/Feature-Benefit] karena [alasan].

Langkah 4: Draft Headline Options
Buat 3 opsi headline dengan pendekatan berbeda:
- Opsi 1: Focus pada benefit emotional
- Opsi 2: Focus pada problem solving
- Opsi 3: Focus pada social proof/uniqueness

Langkah 5: Pilih dan Refine
Pilih headline terbaik dan buat sub-headline yang mendukung.

OUTPUT FORMAT (JSON):
{
  "analysis": {
    "target_insight": "...",
    "value_proposition": "...",
    "chosen_angle": "..."
  },
  "headline": "...",
  "subheadline": "...",
  "cta": "...",
  "alternatives": ["...", "...", "..."]
}
`;
```

---

## 4. STAGE 3: DESIGN DECISION PROMPT

### 4.1 Color Palette Selection

```typescript
const COLOR_SELECTION_SYSTEM_PROMPT = `
Kamu adalah Design AI spesialis pemilihan warna untuk website.
Tugasmu adalah merekomendasikan color palette yang harmonious dan sesuai dengan brand identity.

# COLOR THEORY PRINCIPLES

1. Color Psychology
   - Merah/Maroon: Passion, urgency, appetite (F&B)
   - Biru: Trust, professionalism, calm (Services, Tech)
   - Hijau: Nature, growth, health (Organic, Health)
   - Kuning/Orange: Energy, happiness, creativity (Creative, Events)
   - Pink: Feminine, sweet, romantic (Fashion, Beauty)
   - Ungu: Luxury, creativity, spiritual (Premium brands)
   - Hitam/Putih: Sophistication, minimalism (Luxury, Modern)

2. Color Harmony Rules
   - Complementary: Warna berlawanan di color wheel
   - Analogous: Warna bersebelahan di color wheel
   - Triadic: 3 warna merata di color wheel
   - Monochromatic: Variasi satu warna

3. Accessibility
   - Kontras minimal 4.5:1 untuk text
   - Jangan hanya pakai warna untuk convey information
   - Test dengan color blindness simulator

# DESIGN SYSTEM GUIDELINES

Primary Color (60%):
- Warna dominan brand
- Digunakan untuk: background, main buttons, headers

Secondary Color (30%):
- Warna pendukung
- Digunakan untuk: secondary buttons, accents, hover states

Accent Color (10%):
- Warna untuk CTA dan highlights
- Digunakan untuk: primary CTA, important badges, links

Text Colors:
- Primary text: Dark gray (bukan pure black)
- Secondary text: Medium gray
- Muted text: Light gray

# CONSTRAINTS
- Maksimal 5 warna dalam palette
- Selalu include light dan dark variant
- Pastikan kontras yang cukup
- Pertimbangkan cultural context (Indonesia)
`;
```

### 4.2 Color Selection Template

```typescript
const COLOR_SELECTION_TEMPLATE = `
Rekomendasikan color palette untuk website dengan spesifikasi:

BRAND INFO:
- Business Type: {{business_type}}
- Industry: {{industry}}
- Brand Name: {{brand_name}}
- Tone: {{tone}}
- User Preference: {{color_preference}}

PERTIMBANGKAN:
1. Apa emosi yang ingin ditimbulkan?
2. Apa personality brand ini?
3. Apa ekspektasi customer dari industri ini?
4. Bagaimana kompetitor menggunakan warna?

OUTPUT FORMAT (JSON):
{
  "palette_name": "...",
  "reasoning": "...",
  "colors": {
    "primary": {
      "main": "#HEX",
      "light": "#HEX",
      "dark": "#HEX",
      "contrast_text": "#HEX"
    },
    "secondary": {
      "main": "#HEX",
      "light": "#HEX",
      "dark": "#HEX"
    },
    "accent": {
      "main": "#HEX",
      "light": "#HEX"
    },
    "background": {
      "default": "#HEX",
      "paper": "#HEX",
      "dark": "#HEX"
    },
    "text": {
      "primary": "#HEX",
      "secondary": "#HEX",
      "muted": "#HEX"
    }
  },
  "usage_recommendations": {
    "hero_background": "...",
    "cta_button": "...",
    "headline_text": "...",
    "card_background": "..."
  }
}
`;
```

---

## 5. ADVANCED TECHNIQUES

### 5.1 Self-Consistency Checking

```typescript
// Prompt untuk validasi hasil AI
const SELF_CONSISTENCY_PROMPT = `
Kamu adalah Quality Assurance AI. Tugasmu adalah memeriksa dan memperbaiki output dari AI lain.

KONTEN YANG PERLU DIPERIKSA:
{{generatedContent}}

KONTEKS ASLI:
{{originalContext}}

CEK HAL BERIKUT:
1. Apakah konten relevan dengan konteks bisnis?
2. Apakah tone sesuai dengan yang diminta?
3. Apakah bahasa yang digunakan natural?
4. Apakah ada fakta yang salah atau misleading?
5. Apakah CTA jelas dan compelling?

Jika ada masalah, perbaiki. Jika tidak ada masalah, konfirmasi valid.

OUTPUT:
{
  "is_valid": true/false,
  "issues_found": ["...", "..."],
  "corrected_content": "..." (atau null jika sudah valid)
}
`;
```

### 5.2 Multi-Model Ensemble

```typescript
// Menggunakan multiple models untuk hasil terbaik
async function generateWithEnsemble(
  prompt: string,
  context: any
): Promise<GenerationResult> {
  // Generate dengan 3 model berbeda
  const [gpt4Result, claudeResult, geminiResult] = await Promise.all([
    generateWithGPT4(prompt, context),
    generateWithClaude(prompt, context),
    generateWithGemini(prompt, context)
  ]);
  
  // Evaluasi hasil
  const results = [
    { model: 'gpt-4', output: gpt4Result, score: 0 },
    { model: 'claude', output: claudeResult, score: 0 },
    { model: 'gemini', output: geminiResult, score: 0 }
  ];
  
  // Scoring criteria
  for (const result of results) {
    // Length check (ideal: 8-12 kata untuk headline)
    const wordCount = result.output.headline.split(' ').length;
    if (wordCount >= 8 && wordCount <= 12) result.score += 10;
    
    // Relevance check (gunakan embedding similarity)
    const relevance = await calculateRelevance(result.output, context);
    result.score += relevance * 50;
    
    // Engagement prediction (ML model)
    const engagementScore = await predictEngagement(result.output);
    result.score += engagementScore * 40;
  }
  
  // Return best result
  results.sort((a, b) => b.score - a.score);
  return results[0];
}
```

### 5.3 Iterative Refinement

```typescript
// Prompt untuk refinement berdasarkan feedback
const REFINEMENT_PROMPT = `
Kamu sedang memperbaiki website content berdasarkan feedback user.

CONTENT SEBELUMNYA:
{{previousContent}}

FEEDBACK USER:
{{userFeedback}}

JENIS FEEDBACK:
{{feedbackType}}  // too_formal, too_long, unclear, wrong_tone, etc.

PERBAIKI CONTENT SESUAI FEEDBACK:
- Pertahankan pesan utama
- Sesuaikan dengan instruksi spesifik
- Jangan ubah hal yang tidak diminta

OUTPUT FORMAT:
{
  "refined_content": {
    "headline": "...",
    "subheadline": "...",
    "cta": "..."
  },
  "changes_made": ["...", "..."],
  "confidence": 0.0-1.0
}
`;
```

### 5.4 Caching Strategy

```typescript
// Prompt caching untuk menghemat cost
class PromptCache {
  private cache: Map<string, CacheEntry>;
  private readonly TTL = 3600000; // 1 hour
  
  generateCacheKey(prompt: string, context: any): string {
    // Hash kombinasi prompt dan context
    const normalized = JSON.stringify({
      prompt: prompt.trim().toLowerCase(),
      context: this.normalizeContext(context)
    });
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
  
  async getOrGenerate(
    prompt: string,
    context: any,
    generator: () => Promise<any>
  ): Promise<any> {
    const key = this.generateCacheKey(prompt, context);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      console.log('Cache hit:', key);
      return cached.data;
    }
    
    const result = await generator();
    this.cache.set(key, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  }
}
```

---

## 6. PROMPT OPTIMIZATION

### 6.1 Token Optimization

```typescript
// Teknik mengurangi token usage
const TOKEN_OPTIMIZATION_TECHNIQUES = {
  // 1. Remove unnecessary whitespace
  removeExcessWhitespace: (prompt: string) => 
    prompt.replace(/\n\s*\n/g, '\n').trim(),
  
  // 2. Use abbreviations
  abbreviate: (prompt: string) =>
    prompt
      .replace(/artificial intelligence/gi, 'AI')
      .replace(/user interface/gi, 'UI')
      .replace(/as soon as possible/gi, 'ASAP'),
  
  // 3. Remove redundant examples
  limitExamples: (examples: any[], maxCount: number) =>
    examples.slice(0, maxCount),
  
  // 4. Use structured format instead of narrative
  useStructuredFormat: (prompt: string) => {
    // Convert paragraph to bullet points
    return prompt;
  }
};

// Cost tracking
function calculatePromptCost(
  prompt: string,
  model: string
): { inputTokens: number; estimatedCost: number } {
  // Approximate: 1 token ≈ 4 characters
  const inputTokens = Math.ceil(prompt.length / 4);
  
  const pricing = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 }
  };
  
  const cost = (inputTokens / 1000) * pricing[model].input;
  
  return { inputTokens, estimatedCost: cost };
}
```

### 6.2 A/B Testing Prompts

```typescript
// Framework untuk testing prompt variations
class PromptABTest {
  async runTest(
    variations: PromptVariation[],
    sampleSize: number
  ): Promise<TestResult> {
    const results: TestResult[] = [];
    
    for (const variation of variations) {
      const testResults = [];
      
      for (let i = 0; i < sampleSize; i++) {
        const testCase = await this.getTestCase(i);
        
        const startTime = Date.now();
        const output = await this.generate(variation.prompt, testCase);
        const latency = Date.now() - startTime;
        
        const quality = await this.evaluateQuality(output, testCase);
        
        testResults.push({
          latency,
          quality,
          tokenUsage: output.usage.total_tokens
        });
      }
      
      results.push({
        variation: variation.name,
        avgQuality: this.average(testResults.map(r => r.quality)),
        avgLatency: this.average(testResults.map(r => r.latency)),
        avgTokenUsage: this.average(testResults.map(r => r.tokenUsage)),
        successRate: this.calculateSuccessRate(testResults)
      });
    }
    
    return this.selectWinner(results);
  }
}
```

---

## 7. ERROR HANDLING & FALLBACKS

### 7.1 Retry Strategy

```typescript
async function generateWithRetry(
  prompt: string,
  options: GenerationOptions,
  maxRetries: number = 3
): Promise<GenerationResult> {
  const errors = [];
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Exponential backoff
      if (attempt > 0) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
      
      const result = await generate(prompt, options);
      
      // Validate output
      if (validateOutput(result)) {
        return result;
      }
      
      throw new Error('Invalid output format');
      
    } catch (error) {
      errors.push(error);
      
      // Switch to fallback model on second attempt
      if (attempt === 1) {
        options.model = getFallbackModel(options.model);
      }
    }
  }
  
  // All retries failed, use template fallback
  return generateFromTemplate(options.context);
}
```

---

## 8. MONITORING & ANALYTICS

### 8.1 Prompt Performance Tracking

```typescript
// Track prompt effectiveness
interface PromptMetrics {
  promptId: string;
  version: string;
  totalCalls: number;
  avgLatency: number;
  avgTokenUsage: number;
  avgCost: number;
  successRate: number;
  userSatisfaction: number;  // Based on edits/regenerations
  conversionRate: number;    // Based on published websites
}

// Dashboard queries
const PROMPT_ANALYTICS_QUERIES = {
  // Most expensive prompts
  expensivePrompts: `
    SELECT prompt_id, AVG(cost_usd) as avg_cost
    FROM ai_generation_logs
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY prompt_id
    ORDER BY avg_cost DESC
  `,
  
  // Prompts with highest retry rate
  problematicPrompts: `
    SELECT prompt_id, 
           COUNT(*) FILTER (WHERE retry_count > 0) * 100.0 / COUNT(*) as retry_rate
    FROM ai_generation_logs
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY prompt_id
    ORDER BY retry_rate DESC
  `,
  
  // User satisfaction by prompt
  satisfactionByPrompt: `
    SELECT 
      ai_logs.prompt_id,
      COUNT(CASE WHEN websites.generation_count > 1 THEN 1 END) * 100.0 / 
        COUNT(*) as regeneration_rate
    FROM ai_generation_logs ai_logs
    JOIN websites ON ai_logs.website_id = websites.id
    WHERE ai_logs.created_at > NOW() - INTERVAL '7 days'
    GROUP BY ai_logs.prompt_id
  `
};
```

---

*Prompt engineering adalah iterative process. Monitor, test, dan optimize secara berkala untuk hasil terbaik.*
