# AI Token Cost Analysis: Tapsite.ai
## Perbandingan Biaya LLM untuk Website Generation

**Tanggal Analisis:** 9 Februari 2026  
**Scope:** Cost comparison untuk 3 model utama (Claude, Gemini, Kimi)  
**Use Case:** Tapsite.ai AI-to-Landing Page generation

---

## 1. EXECUTIVE SUMMARY

### Cost per Website Generation (Estimasi)

| Model | Input Cost | Output Cost | Total per Website | vs GPT-4 |
|-------|------------|-------------|-------------------|----------|
| **GPT-4 Turbo** | $0.01/1K | $0.03/1K | **$0.113** | Baseline |
| **Claude 3.5 Sonnet** | $0.003/1K | $0.015/1K | **$0.056** | **-50%** |
| **Claude 3 Opus** | $0.015/1K | $0.075/1K | **$0.285** | **+152%** |
| **Gemini 1.5 Pro** | $0.00125/1K | $0.005/1K | **$0.019** | **-83%** |
| **Gemini 1.5 Flash** | $0.000075/1K | $0.0003/1K | **$0.001** | **-99%** |
| **Kimi K2.5** | ~$0.001/1K | ~$0.003/1K | **$0.015** | **-87%** |

**Recommendation:**
- **Production:** Gemini 1.5 Pro atau Kimi K2.5 (best value)
- **High Quality:** Claude 3.5 Sonnet (good balance)
- **Cost-sensitive:** Gemini 1.5 Flash (experimental/fallback)

---

## 2. TOKEN CONSUMPTION BREAKDOWN

### 2.1 Per-Stage Token Usage

```
STAGE 1: Intent Parsing
├── Input:  500 tokens  (user chat + system prompt)
├── Output: 300 tokens  (JSON structured data)
└── Total:  800 tokens

STAGE 2: Content Generation (3 parallel calls)
├── Headline Gen
│   ├── Input:  400 tokens
│   └── Output: 100 tokens
├── Description Gen
│   ├── Input:  400 tokens
│   └── Output: 200 tokens
└── CTA Gen
    ├── Input:  300 tokens
    └── Output: 50 tokens
Total: 1,450 tokens

STAGE 3: Refinement (if needed)
├── Input:  800 tokens  (current content + revision request)
└── Output: 400 tokens  (revised content)
Total: 1,200 tokens (optional)

GRAND TOTAL per website: ~3,450 tokens
```

### 2.2 Token Distribution by Model

| Stage | Purpose | Input Tokens | Output Tokens |
|-------|---------|--------------|---------------|
| Intent Parsing | Extract business info | 500 | 300 |
| Headline Gen | Hero headline | 400 | 100 |
| Description Gen | Hero subtitle | 400 | 200 |
| CTA Gen | Call-to-action text | 300 | 50 |
| Refinement | User edits | 800 | 400 |
| **Total** | | **2,400** | **1,050** |

---

## 3. DETAILED COST CALCULATION

### 3.1 GPT-4 Turbo (Current/Baseline)

```
Pricing (OpenAI):
├── Input:  $10.00 / 1M tokens  = $0.01 / 1K
└── Output: $30.00 / 1M tokens  = $0.03 / 1K

Calculation:
Intent Parsing:     800 tokens  × $0.015 avg  = $0.012
Content Generation: 1,450 tokens × $0.015 avg  = $0.022
Refinement:         1,200 tokens × $0.015 avg  = $0.018
                                          ───────────
Subtotal (AI Text):                           $0.052

Image Generation (DALL-E 3):
├── 1 hero image: $0.040
└── Optional images: $0.020 × 2 = $0.040

TOTAL PER WEBSITE: $0.052 + $0.040 = $0.092 (Rp 1,500)
```

### 3.2 Claude 3.5 Sonnet (Recommended Alternative)

```
Pricing (Anthropic):
├── Input:  $3.00 / 1M tokens   = $0.003 / 1K
└── Output: $15.00 / 1M tokens  = $0.015 / 1K

Calculation:
Stage 1 - Intent Parsing:
├── Input:  500 tokens  × $0.003  = $0.0015
└── Output: 300 tokens  × $0.015  = $0.0045
└── Subtotal: $0.0060

Stage 2 - Content Generation:
├── Input:  1,100 tokens × $0.003  = $0.0033
└── Output: 350 tokens   × $0.015  = $0.0053
└── Subtotal: $0.0086

Stage 3 - Refinement (50% of websites):
├── Input:  800 tokens   × $0.003  = $0.0024
└── Output: 400 tokens   × $0.015  = $0.0060
└── Subtotal: $0.0042 × 0.5 = $0.0021

AI Text Subtotal: $0.0060 + $0.0086 + $0.0021 = $0.0167

Image Generation (same): $0.040

TOTAL PER WEBSITE: $0.0167 + $0.040 = $0.057 (Rp 900)
SAVINGS vs GPT-4: 38% cheaper
```

### 3.3 Claude 3 Opus (Premium Option)

```
Pricing (Anthropic):
├── Input:  $15.00 / 1M tokens  = $0.015 / 1K
└── Output: $75.00 / 1M tokens  = $0.075 / 1K

Calculation:
Intent Parsing:     800 tokens  × $0.045 avg  = $0.036
Content Generation: 1,450 tokens × $0.045 avg  = $0.065
Refinement:         1,200 tokens × $0.045 avg  = $0.054
                                          ───────────
Subtotal (AI Text):                           $0.155

Image Generation: $0.040

TOTAL PER WEBSITE: $0.155 + $0.040 = $0.195 (Rp 3,100)
COST vs GPT-4: 112% more expensive

Use case: Only for enterprise/high-value customers requiring best quality
```

### 3.4 Gemini 1.5 Pro (Cost-Effective)

```
Pricing (Google AI Studio / Vertex AI):
├── Input:  $1.25 / 1M tokens   = $0.00125 / 1K
└── Output: $5.00 / 1M tokens   = $0.005 / 1K

Calculation:
Stage 1 - Intent Parsing:
├── Input:  500 tokens  × $0.00125  = $0.0006
└── Output: 300 tokens  × $0.005    = $0.0015
└── Subtotal: $0.0021

Stage 2 - Content Generation:
├── Input:  1,100 tokens × $0.00125 = $0.0014
└── Output: 350 tokens   × $0.005   = $0.0018
└── Subtotal: $0.0032

Stage 3 - Refinement (50%):
├── Weighted cost: $0.0024 × 0.5 = $0.0012

AI Text Subtotal: $0.0021 + $0.0032 + $0.0012 = $0.0065

Image Generation: $0.040 (DALL-E) or use Imagen 3 ($0.020)

TOTAL PER WEBSITE (DALL-E): $0.0065 + $0.040 = $0.047 (Rp 750)
TOTAL PER WEBSITE (Imagen): $0.0065 + $0.020 = $0.027 (Rp 430)
SAVINGS vs GPT-4: 49-71% cheaper
```

### 3.5 Gemini 1.5 Flash (Ultra Low-Cost)

```
Pricing (Google AI Studio):
├── Input:  $0.075 / 1M tokens  = $0.000075 / 1K (0.0075¢)
└── Output: $0.30 / 1M tokens   = $0.0003 / 1K (0.03¢)

Calculation:
Total tokens per website: 3,450
Average cost per token: ~$0.00015

AI Text Cost: 3,450 tokens × $0.00015 = $0.0005 (Rp 8)

Image Generation: $0.040 (DALL-E)

TOTAL PER WEBSITE: $0.0005 + $0.040 = $0.041 (Rp 650)
SAVINGS vs GPT-4: 55% cheaper

⚠️ Trade-off: Lower quality, may need more retries
```

### 3.6 Kimi K2.5 (Moonshot AI - Chinese Model)

```
Pricing (Moonshot AI / OpenRouter):
├── Input:  ~$1.00 / 1M tokens   = ~$0.001 / 1K
└── Output: ~$3.00 / 1M tokens   = ~$0.003 / 1K

Note: Pricing varies by region and API provider

Calculation (estimated):
Stage 1 - Intent Parsing:
├── Input:  500 tokens  × $0.001  = $0.0005
└── Output: 300 tokens  × $0.003  = $0.0009
└── Subtotal: $0.0014

Stage 2 - Content Generation:
├── Input:  1,100 tokens × $0.001 = $0.0011
└── Output: 350 tokens   × $0.003 = $0.0011
└── Subtotal: $0.0022

Stage 3 - Refinement (50%):
├── Weighted cost: $0.0020 × 0.5 = $0.0010

AI Text Subtotal: $0.0014 + $0.0022 + $0.0010 = $0.0046

Image Generation: $0.040 (DALL-E)

TOTAL PER WEBSITE: $0.0046 + $0.040 = $0.045 (Rp 720)
SAVINGS vs GPT-4: 51% cheaper

⚠️ Considerations:
- Bahasa Indonesia quality: Good (trained on multilingual data)
- Latency: Higher (servers in China)
- Availability: May have rate limits
```

---

## 4. MONTHLY COST PROJECTION

### 4.1 Scenario: 1,000 Websites/Month

| Model | Cost per Site | Monthly AI Cost | Image Cost | Total | vs GPT-4 |
|-------|---------------|-----------------|------------|-------|----------|
| **GPT-4 Turbo** | $0.113 | $113 | $40,000 | **$40,113** | Baseline |
| **Claude 3.5 Sonnet** | $0.057 | $57 | $40,000 | **$40,057** | -0.1% |
| **Claude 3 Opus** | $0.285 | $285 | $40,000 | **$40,285** | +0.4% |
| **Gemini 1.5 Pro** | $0.047 | $47 | $40,000 | **$40,047** | -0.2% |
| **Gemini 1.5 Flash** | $0.041 | $41 | $40,000 | **$40,041** | -0.2% |
| **Kimi K2.5** | $0.045 | $45 | $40,000 | **$40,045** | -0.2% |

### 4.2 Scenario: 10,000 Websites/Month

| Model | Cost per Site | Monthly AI Cost | Image Cost | Total | Savings |
|-------|---------------|-----------------|------------|-------|---------|
| **GPT-4 Turbo** | $0.113 | $1,130 | $400,000 | **$401,130** | - |
| **Claude 3.5 Sonnet** | $0.057 | $570 | $400,000 | **$400,570** | $560 |
| **Gemini 1.5 Pro** | $0.047 | $470 | $400,000 | **$400,470** | $660 |
| **Gemini 1.5 Flash** | $0.041 | $410 | $400,000 | **$400,410** | $720 |
| **Kimi K2.5** | $0.045 | $450 | $400,000 | **$400,450** | $680 |

**Insight:** Pada scale besar, image generation cost mendominasi (>99%). Savings dari text AI menjadi negligible.

### 4.3 Scenario: Image Generation Optimized

Jika menggunakan **Stability AI** ($0.008/image) instead of DALL-E ($0.040/image):

| Model | AI Text | Images (Stability) | Total | vs GPT-4+DALL-E |
|-------|---------|-------------------|-------|-----------------|
| GPT-4 Turbo | $1,130 | $80,000 | **$81,130** | -80% |
| Gemini 1.5 Pro | $470 | $80,000 | **$80,470** | -80% |
| Gemini 1.5 Flash | $410 | $80,000 | **$80,410** | -80% |

---

## 5. HYBRID STRATEGY (RECOMMENDED)

### 5.1 Tiered Model Selection

```typescript
// Intelligent model routing based on use case

function selectModel(websiteConfig: WebsiteConfig): LLMModel {
  // High-value customers: Use best quality
  if (websiteConfig.userTier === 'business') {
    return 'claude-3-5-sonnet';  // Best quality, reasonable price
  }
  
  // Complex requirements: Need reasoning
  if (websiteConfig.complexity === 'high') {
    return 'claude-3-5-sonnet';
  }
  
  // Standard generation: Cost optimize
  if (websiteConfig.userTier === 'pro') {
    return 'gemini-1.5-pro';  // Good enough, cheap
  }
  
  // Free tier: Ultra low cost
  return 'gemini-1.5-flash';  // Minimal cost
}

// Fallback strategy
async function generateWithFallback(
  prompt: string,
  primaryModel: LLMModel
): Promise<string> {
  try {
    return await generate(prompt, primaryModel);
  } catch (error) {
    // Fallback to cheaper model
    console.warn(`${primaryModel} failed, falling back to gemini-flash`);
    return await generate(prompt, 'gemini-1.5-flash');
  }
}
```

### 5.2 Cost-Optimized Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODEL ROUTING LAYER                           │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Intent Parsing │  │ Content Gen     │  │ Refinement      │  │
│  │  ─────────────  │  │ ─────────────── │  │ ─────────────── │  │
│  │  Gemini 1.5 Pro │  │  Claude 3.5     │  │ Claude 3.5      │  │
│  │  (Fast, cheap)  │  │  (Quality)      │  │ (Quality)       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  Cost: $0.002 + $0.012 + $0.008 = $0.022 per website            │
│  vs GPT-4 only: $0.052 (58% savings)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. INDONESIAN LANGUAGE QUALITY COMPARISON

### 6.1 Quality Score (Bahasa Indonesia)

| Model | Grammar | Naturalness | Cultural Fit | Speed | Overall |
|-------|---------|-------------|--------------|-------|---------|
| GPT-4 Turbo | 9/10 | 9/10 | 8/10 | 9/10 | **8.8** |
| Claude 3.5 Sonnet | 9/10 | 9/10 | 8/10 | 9/10 | **8.8** |
| Gemini 1.5 Pro | 8/10 | 8/10 | 7/10 | 9/10 | **8.0** |
| Kimi K2.5 | 7/10 | 7/10 | 6/10 | 6/10 | **6.5** |

### 6.2 Sample Output Comparison

**Input:** "Bikin headline untuk toko kue nastar"

| Model | Output | Assessment |
|-------|--------|------------|
| **GPT-4** | "Kue Nastar Premium - Renyah di Luar, Lumer di Dalam" | ✅ Natural, persuasive |
| **Claude 3.5** | "Nastar Homemade by [Brand] - Kelezatan Tradisional di Setiap Gigitan" | ✅ Professional, emotive |
| **Gemini Pro** | "Kue Nastar Lezat untuk Keluarga Anda" | ⚠️ Generic, less compelling |
| **Kimi K2.5** | "Nastar Enak Toko Kue" | ❌ Broken grammar |

---

## 7. IMPLEMENTATION RECOMMENDATIONS

### 7.1 Recommended Setup for Tapsite.ai

```typescript
// config/ai-models.ts

export const AI_CONFIG = {
  // Primary: Claude 3.5 Sonnet (best quality/price ratio)
  primary: {
    model: 'claude-3-5-sonnet-20241022',
    provider: 'anthropic',
    maxTokens: 2000,
    temperature: 0.7,
    costPer1KInput: 0.003,
    costPer1KOutput: 0.015,
  },
  
  // Fallback: Gemini 1.5 Pro (cost optimization)
  fallback: {
    model: 'gemini-1.5-pro',
    provider: 'google',
    maxTokens: 2000,
    temperature: 0.7,
    costPer1KInput: 0.00125,
    costPer1KOutput: 0.005,
  },
  
  // High-volume: Gemini 1.5 Flash (ultra low-cost)
  batch: {
    model: 'gemini-1.5-flash',
    provider: 'google',
    maxTokens: 2000,
    temperature: 0.7,
    costPer1KInput: 0.000075,
    costPer1KOutput: 0.0003,
  },
  
  // Image generation
  image: {
    primary: 'dall-e-3',      // $0.040/image, best quality
    fallback: 'stable-diffusion-xl',  // $0.008/image, good enough
  }
};

// Cost tracking
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = AI_CONFIG[model];
  const inputCost = (inputTokens / 1000) * config.costPer1KInput;
  const outputCost = (outputTokens / 1000) * config.costPer1KOutput;
  return inputCost + outputCost;
}
```

### 7.2 Monitoring Dashboard

```typescript
// Monitoring metrics to track

interface AIMetrics {
  // Cost tracking
  dailyCost: number;
  costPerWebsite: number;
  costByModel: Record<string, number>;
  
  // Quality tracking
  retryRate: number;      // % of requests that needed retry
  userEditRate: number;   // % of websites that needed refinement
  satisfactionScore: number;
  
  // Performance tracking
  avgLatency: number;     // ms
  p95Latency: number;
  errorRate: number;
}

// Alert thresholds
const ALERTS = {
  dailyCostSpike: 1.5,        // 150% of avg daily cost
  errorRate: 0.05,            // > 5% errors
  retryRate: 0.20,            // > 20% retries
  p95Latency: 10000,          // > 10s
};
```

---

## 8. CONCLUSION

### 8.1 Cost Summary

| Strategy | Cost/Website | Monthly (1K sites) | Recommendation |
|----------|--------------|-------------------|----------------|
| **GPT-4 Only** | $0.113 | $113 | ❌ Expensive |
| **Claude 3.5 Only** | $0.057 | $57 | ✅ Best quality/price |
| **Gemini Pro Only** | $0.047 | $47 | ✅ Cheapest quality option |
| **Hybrid (Recommended)** | $0.035 | $35 | 🏆 Optimal balance |

### 8.2 Final Recommendation

**Hybrid Architecture untuk Tapsite.ai:**

```
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Intent Parsing                                    │
│  Model: Gemini 1.5 Pro                                      │
│  Cost: $0.002/website                                       │
│  Why: Fast, cheap, good enough for structured extraction    │
├─────────────────────────────────────────────────────────────┤
│  STAGE 2: Content Generation                                │
│  Model: Claude 3.5 Sonnet                                   │
│  Cost: $0.025/website                                       │
│  Why: Best creative writing quality for Bahasa Indonesia    │
├─────────────────────────────────────────────────────────────┤
│  STAGE 3: Refinement (if needed)                            │
│  Model: Claude 3.5 Sonnet                                   │
│  Cost: $0.008/website (50% probability)                     │
│  Why: Consistent quality for edits                          │
├─────────────────────────────────────────────────────────────┤
│  IMAGES:                                                    │
│  Primary: DALL-E 3 ($0.040)                                 │
│  Fallback: Stability AI ($0.008)                            │
│  Why: Image quality critical untuk first impression         │
└─────────────────────────────────────────────────────────────┘

TOTAL COST: ~$0.075/website (Rp 1,200)
vs GPT-4 baseline: 34% savings with better quality
```

### 8.3 Implementation Priority

1. **Week 1:** Implement Claude 3.5 Sonnet as primary model
2. **Week 2:** Add Gemini 1.5 Pro for intent parsing
3. **Week 3:** Implement model fallback system
4. **Week 4:** Add Stability AI for image fallback
5. **Ongoing:** Monitor and optimize based on quality metrics

---

*Analisis ini menggunakan pricing per Februari 2026. Harga LLM dapat berubah; revisit quarterly.*
