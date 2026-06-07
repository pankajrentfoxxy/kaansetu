# KaamSetu — Verified Blue-Collar Job Matching Platform

KaamSetu ("Work Bridge") connects verified blue-collar workers with employers across India. The core differentiator is **continuous criminal background re-verification**: workers are checked via Authbridge on onboarding and every 180 days. If a new case is found, the worker's profile is auto-blocked and all affected employers are notified immediately.

---

## Architecture

```
kaamsetu/
├── apps/
│   ├── mobile/          # React Native + Expo (worker + employer, role-based routing)
│   └── admin/           # Next.js 14 admin panel
├── packages/
│   ├── api/             # Node.js + Express + TypeScript backend
│   ├── database/        # Prisma schema + migrations (PostgreSQL)
│   └── shared/          # Shared TypeScript types and Zod validators
├── docker-compose.yml
└── .env.example
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native, Expo SDK 52, TypeScript |
| State | Redux Toolkit + RTK Query |
| Backend | Node.js 20, Express.js, TypeScript |
| Database | PostgreSQL 15 (primary), Redis 7 (cache/queue) |
| ORM | Prisma 5 |
| Auth | JWT (15min) + Refresh tokens (30d) |
| KYC | Surepass DigiLocker API (Aadhaar), Surepass PAN |
| BGC | Authbridge TruthScreen API (criminal check) |
| Push | Firebase Cloud Messaging (FCM) |
| SMS | MSG91 |
| Storage | AWS S3 (ap-south-1) |
| Admin | Next.js 14 |

---

## Local Development Setup

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- (Optional) Android Studio for local APK builds

### 1. Clone and install
```bash
git clone https://github.com/your-org/kaamsetu.git
cd kaamsetu
cp .env.example .env
# Edit .env with your values
```

### 2. Start database and Redis
```bash
docker-compose up -d postgres redis
```

### 3. Run database migrations
```bash
cd packages/database
npm install
npm run migrate:dev
npm run generate
```

### 4. Start the API
```bash
cd packages/api
npm install
npm run dev
# API running at http://localhost:3000
```

### 5. Start the admin panel
```bash
cd apps/admin
npm install
npm run dev
# Admin at http://localhost:3001
```

### 6. Start the mobile app
```bash
cd apps/mobile
npm install
npm run start
# Scan QR code with Expo Go app on Android
```

---

## API Documentation

Base URL: `http://localhost:3000/api/v1`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/send-otp` | Send OTP to mobile |
| POST | `/auth/verify-otp` | Verify OTP, get tokens |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |

### Worker
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/worker/profile` | Full profile |
| PUT | `/worker/profile/personal` | Update personal details |
| PUT | `/worker/profile/skills` | Update skills |
| PUT | `/worker/profile/history` | Update work history |
| PUT | `/worker/profile/location` | Update location |
| PUT | `/worker/profile/toggle-work` | Toggle availability |
| POST | `/worker/kyc/initiate-aadhaar` | Link Aadhaar via DigiLocker |
| POST | `/worker/kyc/verify-pan` | Verify PAN |
| POST | `/worker/kyc/upload-selfie` | Upload selfie |
| POST | `/worker/kyc/initiate-bgc` | Start background check |
| GET | `/worker/jobs` | Get matched jobs |
| GET | `/worker/notifications` | Get notifications |
| POST | `/worker/reinstatement/upload` | Upload court clearance |

### Employer
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/employer/profile` | Employer profile |
| POST | `/employer/requirements` | Post job requirement |
| GET | `/employer/requirements/:id/matches` | Get matched workers |
| POST | `/employer/shortlist` | Shortlist a worker |
| POST | `/employer/hire` | Confirm hire + generate offer letter |
| GET | `/employer/case-alerts` | View case alerts |

### Admin (requires ADMIN role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/dashboard` | KPI metrics |
| GET | `/admin/kyc-queue` | Pending KYC reviews |
| POST | `/admin/kyc/:id/approve` | Approve KYC |
| POST | `/admin/workers/:id/block` | Block worker + notify employers |
| POST | `/admin/workers/:id/reinstate` | Reinstate worker |
| GET | `/admin/analytics` | Platform analytics |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/authbridge` | Authbridge BGC callback (HMAC-SHA256 verified) |

---

## Building the Android APK

See [apps/mobile/BUILD_INSTRUCTIONS.md](apps/mobile/BUILD_INSTRUCTIONS.md)

---

## Third-Party Service Setup

### Surepass (Aadhaar + PAN KYC)
1. Register at [surepass.io](https://surepass.io)
2. Get API key for DigiLocker and PAN verification
3. Set `SUREPASS_API_KEY` in `.env`

### Authbridge (Criminal Background Check)
1. Contact Authbridge for TruthScreen API access
2. Configure webhook URL to point to `/api/v1/webhooks/authbridge`
3. Set `AUTHBRIDGE_API_KEY` and `AUTHBRIDGE_WEBHOOK_SECRET`

### Firebase (Push Notifications)
1. Create project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add Android app with package `com.kaamsetu.app`
3. Download `google-services.json` → place in `apps/mobile/`
4. Generate service account key → set `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

### MSG91 (SMS/OTP)
1. Register at [msg91.com](https://msg91.com)
2. Create OTP template (include `{{otp}}` placeholder)
3. Set `MSG91_API_KEY`, `MSG91_OTP_TEMPLATE_ID`, `MSG91_SENDER_ID`

### AWS S3
1. Create bucket in `ap-south-1` region
2. Enable server-side encryption (SSE-S3 or SSE-KMS)
3. Create IAM user with `s3:PutObject`, `s3:GetObject` permissions
4. Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`

---

## Production Deployment (AWS)

```
Internet → ALB → ECS Fargate (API) → RDS PostgreSQL + ElastiCache Redis
                                    ↓
                                S3 (documents)
```

1. **Database**: Amazon RDS PostgreSQL 15 (`ap-south-1`, Multi-AZ)
2. **Cache**: Amazon ElastiCache Redis 7
3. **App**: AWS ECS Fargate (auto-scaling)
4. **Storage**: S3 with SSE-KMS encryption
5. **Secrets**: AWS Secrets Manager (encryption keys, API keys)
6. **CDN**: CloudFront for S3 signed URLs (optional)

Run migrations on deploy:
```bash
npx prisma migrate deploy
```

---

## DPDP Compliance Checklist

- [x] **Aadhaar masking** — Only `XXXXXXXX1234` format stored; full Aadhaar never persisted
- [x] **Explicit consent** — ConsentScreen shown before KYC; timestamp + IP stored
- [x] **Data residency** — All AWS resources in `ap-south-1` (Mumbai)
- [x] **Encryption at rest** — S3 SSE, PAN and BGC payloads AES-256-GCM encrypted
- [x] **Audit logs** — Every admin action logged to `AuditLog` table (immutable)
- [x] **Soft deletes** — Workers/employers use `deleted_at`, retained for 1 year
- [x] **Access tokens** — JWT with 15-min expiry; refresh tokens httpOnly
- [x] **Webhook verification** — HMAC-SHA256 signature check on all Authbridge callbacks
- [x] **Rate limiting** — OTP (3/hr), login (10/15min), API (100/min)
- [ ] **Grievance officer** — Appoint as required by DPDP Act Section 13
- [ ] **Privacy policy** — Publish at `kaamsetu.com/privacy`
- [ ] **Data deletion API** — Implement `/worker/delete-account` endpoint

---

## Profile Score Calculation

| Signal | Points |
|--------|--------|
| Mobile verified | +10 |
| Personal details complete | +15 |
| Skills filled | +10 |
| Work history added | +15 |
| Location set | +5 |
| Aadhaar verified | +15 |
| PAN verified | +10 |
| Selfie uploaded | +5 |
| BGC clear | +15 |
| **Total max** | **100** |

---

## Matching Algorithm

Workers are matched to requirements using a 100-point scoring system:

| Factor | Max Points |
|--------|-----------|
| Job type match (primary skill) | 30 |
| Location (≤5km = 25, ≤20km = 18, ≤50km = 10) | 25 |
| Experience meets minimum | 20 |
| Fully verified (hard filter) | 15 |
| Live-in preference match | 10 |

**Hard filters** (disqualify regardless of score):
- `kyc_status` must be `FULLY_VERIFIED`
- `is_open_to_work` must be `true`
- `blocked_at` must be `null`
