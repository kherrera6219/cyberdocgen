# AI Model Cards

## Overview

This document provides model cards for the AI models integrated into CyberDocGen, following the Google Model Cards framework and NIST AI RMF transparency requirements.

---

## Model Card: GPT-5.1 (OpenAI)

### Model Overview
| Field | Value |
|-------|-------|
| **Model Name** | GPT-5.1 |
| **Provider** | OpenAI |
| **Model Type** | Large Language Model |
| **Use Case in CyberDocGen** | Document generation, compliance analysis, chatbot |
| **Version** | Latest via API |

### Intended Use
- **Primary Uses**: Compliance document generation, policy writing, gap analysis
- **Users**: Compliance officers, security teams, auditors
- **Out-of-scope Uses**: Legal advice, final compliance decisions without human review

### Performance
| Metric | Value | Notes |
|--------|-------|-------|
| Response latency | 2-15s typical | Varies by prompt complexity |
| Context window | 128K tokens | Sufficient for large documents |
| Accuracy (internal testing) | ~92% | On compliance Q&A benchmarks |

### Limitations
- May generate plausible but incorrect compliance information
- Knowledge cutoff limits awareness of recent regulation changes
- Can produce verbose output requiring editing
- Requires human verification for all outputs

### Ethical Considerations
- No PII training data from CyberDocGen users
- Outputs reviewed before use
- Bias monitoring through multi-model comparison

### CyberDocGen Integration
```typescript
// Usage in AI orchestrator
model: "gpt-5.1"
temperature: 0.3  // More deterministic for compliance
maxTokens: 4000
```

---

## Model Card: Claude Opus 4.5 (Anthropic)

### Model Overview
| Field | Value |
|-------|-------|
| **Model Name** | Claude Opus 4.5 |
| **Provider** | Anthropic |
| **Model Type** | Large Language Model |
| **Use Case in CyberDocGen** | Complex analysis, document review, reasoning tasks |
| **Version** | Latest via API |

### Intended Use
- **Primary Uses**: Document analysis, compliance reasoning, quality assessment
- **Users**: Compliance teams reviewing complex requirements
- **Out-of-scope Uses**: Autonomous decision making

### Performance
| Metric | Value | Notes |
|--------|-------|-------|
| Response latency | 3-20s typical | Longer for complex analysis |
| Context window | 200K tokens | Best for large document analysis |
| Accuracy (internal testing) | ~94% | Strong on nuanced compliance questions |

### Limitations
- Longer response times for complex queries
- May be overly cautious in recommendations
- Higher API cost than alternatives
- Requires structured prompting for best results

### Ethical Considerations
- Constitutional AI training reduces harmful outputs
- Explicit content filtering
- Transparent about limitations

### CyberDocGen Integration
```typescript
// Usage for complex analysis
model: "claude-opus-4.5"
temperature: 0.2  // Highly deterministic
maxTokens: 8000   // Allow detailed analysis
```

---

## Model Card: Gemini 3.0 Pro (Google)

### Model Overview
| Field | Value |
|-------|-------|
| **Model Name** | Gemini 3.0 Pro |
| **Provider** | Google DeepMind |
| **Model Type** | Multimodal LLM |
| **Use Case in CyberDocGen** | Document processing, fallback model |
| **Version** | Latest via API |

### Intended Use
- **Primary Uses**: Document processing, image-to-text, fallback generation
- **Users**: All CyberDocGen users
- **Out-of-scope Uses**: Primary compliance advice (used as fallback)

### Performance
| Metric | Value | Notes |
|--------|-------|-------|
| Response latency | 1-10s typical | Generally fast |
| Context window | 1M tokens | Extreme context for large docs |
| Accuracy (internal testing) | ~88% | Good general capability |

### Limitations
- Less specialized for compliance domain
- Occasional inconsistent formatting
- Multimodal features not fully utilized

### Ethical Considerations
- Google's AI Principles applied
- Safety filters enabled
- Enterprise data handling compliant

### CyberDocGen Integration
```typescript
// Usage as fallback
model: "gemini-3.0-pro"
temperature: 0.3
maxTokens: 4000
// Used when primary models unavailable
```

---

## Model Selection Logic

CyberDocGen uses intelligent model routing:

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Analyze │
    │  Task   │
    └────┬────┘
         │
    ┌────┴─────────────────────────────┐
    │                                  │
┌───▼───┐    ┌───────────┐    ┌───────▼───────┐
│ GPT-5.1│    │Claude Opus│    │ Gemini 3.0 Pro│
│        │    │   4.5     │    │   (Fallback)  │
└───┬───┘    └─────┬─────┘    └───────────────┘
    │              │
    │  Complex?    │
    │    ─────────►│
    │              │
    └──────┬───────┘
           │
    ┌──────▼──────┐
    │  Guardrails │
    │    Check    │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Response  │
    └─────────────┘
```

---

## Guardrails Applied

All models go through:
1. **Prompt injection detection** before sending
2. **PII redaction** on input
3. **Output moderation** on response
4. **Content filtering** for harmful content
5. **Token limit enforcement**

---

## Monitoring & Evaluation

### Tracked Metrics
- Response accuracy (sampled reviews)
- Latency percentiles
- Error rates per model
- Token usage and cost
- User satisfaction (feedback)

### Evaluation Cadence
- **Daily**: Latency and error monitoring
- **Weekly**: Cost and usage review
- **Monthly**: Accuracy sampling
- **Quarterly**: Full evaluation refresh

---

## Responsible AI Practices

1. **Human oversight**: All outputs reviewed before use
2. **Transparency**: Users know content is AI-generated
3. **Feedback loop**: Users can report issues
4. **Regular audits**: Bias and accuracy checks
5. **Model updates**: Tested before production

---

## Version History

| Date | Change |
|------|--------|
| Jan 2026 | Initial model cards document |
| - | Model version updates tracked via AI_GOVERNANCE.md |

---

**Document Owner**: AI Engineering Team  
**Last Updated**: January 2026  
**Review Schedule**: Quarterly (or on model updates)
