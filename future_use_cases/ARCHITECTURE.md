# FarmConnect AI/ML Architecture

## System Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FARMER MOBILE APP (Android)                  │
│                                                                       │
│  ┌──────────────────┐      ┌──────────────────┐                    │
│  │  Image Capture   │  →   │ TFLite Model     │  → Disease Alert   │
│  │  (On-Device CV)  │      │ (224x224, 8MB)   │                    │
│  └──────────────────┘      └──────────────────┘                    │
│                                       ↓                               │
│                          Send (image + metadata)                     │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTPS
        ┌──────────────────────────────────────────────────────────────┐
        │              BACKEND API (Node/Python)                        │
        │                                                                │
        │  ┌────────────────────────────────────────────────────────┐  │
        │  │ Inference Service                                      │  │
        │  │  - Verify + re-score disease (ensemble)               │  │
        │  │  - Fetch weather + crop history                       │  │
        │  │  - Run yield forecast (LSTM)                          │  │
        │  │  - Run price forecast (ARIMA/Prophet)                 │  │
        │  │  - Compute credit score (XGBoost)                     │  │
        │  └────────────────────────────────────────────────────────┘  │
        │                           ↓                                    │
        │  ┌────────────────────────────────────────────────────────┐  │
        │  │ Data Layer                                             │  │
        │  │  - PostgreSQL (transactions, profiles)                │  │
        │  │  - S3/Blob (images, model artifacts)                 │  │
        │  │  - Redis (cache forecasts)                            │  │
        │  └────────────────────────────────────────────────────────┘  │
        │                           ↓                                    │
        │  ┌────────────────────────────────────────────────────────┐  │
        │  │ External Integrations                                  │  │
        │  │  - Weather API (OpenWeatherMap)                       │  │
        │  │  - Market Data API (commodity prices)                 │  │
        │  │  - Lending Partner API (credit offers)                │  │
        │  │  - Blockchain Client (provenance ledger)              │  │
        │  └────────────────────────────────────────────────────────┘  │
        └──────────────────────────────────────────────────────────────┘
                                    ↓
        ┌──────────────────────────────────────────────────────────────┐
        │           RESPONSE BACK TO MOBILE APP                         │
        │                                                                │
        │  - Disease advisory + remediation tips                       │
        │  - Yield forecast + confidence                               │
        │  - Price forecast + optimal sell timing                      │
        │  - Credit offer + microfinance link                          │
        │  - (Optional) Blockchain tx for provenance                   │
        └──────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. On-Device CV Model (TensorFlow Lite)
- **Role**: Fast, offline disease detection
- **Input**: 224×224 JPEG from camera
- **Output**: Disease class + confidence
- **Size**: ~8 MB (MobileNet-based)
- **Latency**: ~50 ms on mid-range Android
- **Benefit**: Works without internet; instant user feedback

### 2. Backend Inference Service
- **Role**: Verify CV, fetch context, run forecast models
- **Stack**: Node.js / Python (FastAPI or Flask)
- **Models Hosted**:
  - LSTM for yield forecasting
  - ARIMA/Prophet for price forecasting
  - XGBoost for credit scoring
- **Scaling**: Horizontal with container orchestration (Kubernetes or serverless)

### 3. Data Layer
- **PostgreSQL**: Farmer profiles, transactions, advisory history
- **S3/Azure Blob**: Images, model artifacts, training data
- **Redis**: Cache predictions (yield/price) for 24 hours

### 4. External Integrations
- **Weather API**: Daily temp, humidity, rainfall (e.g., OpenWeatherMap, DarkSky)
- **Market Data**: Commodity prices (e.g., NASS, local exchanges)
- **Lending Partner**: Send credit scores, receive loan offers
- **Blockchain**: Store provenance hash for premium produce

---

## Data Flow Walkthrough

### Use Case: Farmer Detects Leaf Disease

```
1. Farmer opens app → taps "Scan Leaf" → camera opens
2. Captures image → preprocessing (crop, normalize, resize to 224×224)
3. TFLite model runs on phone → outputs disease class + confidence
4. If confidence > 0.85 → show immediate alert + remediation tips
5. Simultaneously, app sends image + farmer_id + timestamp to backend

6. Backend:
   a. Verifies image quality
   b. Runs ensemble model (second opinion)
   c. Fetches farmer's crop history + region + current weather
   d. LSTM yields forecast for this crop + damage scenario
   e. ARIMA forecasts price impact (if disease spreads)
   f. XGBoost credit score drops if yield risk increases
   g. Computes suggested remediation cost + ROI
   
7. Backend returns to app:
   - Confirmed disease + severity
   - Yield impact (−X% if untreated)
   - Estimated cost to cure
   - Recommended input suppliers (partner links)
   - Optional: "Bill us later" (via lending partner)
   
8. Farmer sees comprehensive advisory → acts → outcome logged

9. (Optional) If farmer treats successfully → provenance tx recorded for future premium sales
```

---

## Monetization Integration Points

### 1. Subscription Model
- **Free**: 2 scans/month → disease alerts only
- **Premium ($2.99/month)**: Unlimited scans + yield/price forecasts + credit offers

### 2. Marketplace Fees
- When farmer lists produce → system assigns quality score (based on disease history, yield forecast, provenance)
- **Premium tier (+30% price)** unlocked for high-confidence crops → 2–3% fee to FarmConnect

### 3. Lending Commissions
- Farmer receives credit offer → clicks "Get Loan" → redirected to lending partner
- FarmConnect earns **1–2% referral commission** on disbursed amount

### 4. B2B Partnerships (Later)
- Agritech suppliers pay for leads (farmers needing inputs)
- Insurance companies buy anonymized risk signals

---

## Deployment & Operations

### Development Workflow
```
1. Create feature branch: feature/ai-cv-disease-detection
2. Train model locally on PlantVillage data
3. Validate on test set
4. Convert to TFLite + test on physical Android device
5. Push to backend; add API endpoint
6. Integrate UI in app
7. Pilot with 50 farmers
8. Gather feedback + iterate
```

### Production Deployment
```
- Models versioned in S3/Git LFS
- API deployed on Kubernetes / AWS Lambda
- Auto-retraining pipeline (monthly for CV; weekly for price/yield)
- Monitoring: model drift, API latency, farmer adoption
```

---

## Success Criteria (Phase 1, Months 1–3)

| Metric | Target |
|--------|--------|
| CV Model Accuracy | 92% |
| API Latency (p95) | <500ms |
| Pilot Adoption Rate | >20% of invited farmers |
| Premium Subscription Conversion | 10–15% |
| User Feedback NPS | >30 |

---

## Next Immediate Actions

1. **Week 1**: Repo scan for image/transaction/profile code
2. **Week 1**: Identify public dataset (PlantVillage) for CV PoC training
3. **Week 2**: Train baseline CV model; measure accuracy
4. **Week 2**: Convert to TFLite; test on Android emulator
5. **Week 3**: Build mock backend endpoint (yield/price forecast placeholders)
6. **Week 4**: End-to-end PoC demo with UI mockup

---

**Status**: Architecture Phase (Not In Development)  
**Owner**: AI/ML Team  
**Last Updated**: 2026-04-30
