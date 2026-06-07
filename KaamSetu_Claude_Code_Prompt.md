# KaamSetu — Complete Build Prompt for Claude Code

> Paste everything below this line into Claude Code as a single prompt.
> Claude Code will scaffold, build, and wire the entire application.

---

## PROJECT OVERVIEW

Build **KaamSetu** — a full-stack blue-collar job matching platform for India. The platform has three surfaces:
1. **Worker mobile app** (React Native / Expo) — "Kaamgar" side
2. **Employer mobile app** (React Native / Expo) — same codebase, role-based routing
3. **Admin web panel** (React Native Web or separate Next.js) — operations team

The core differentiator is **continuous criminal background re-verification**: workers are checked via Authbridge API on onboarding and then every 180 days. If a new case is found, the worker's profile is auto-blocked and all affected employers are notified automatically via push notification and SMS.

---

## TECHNOLOGY STACK

### Mobile App
- **Framework**: React Native with Expo SDK 52, TypeScript
- **State**: Redux Toolkit + RTK Query
- **Navigation**: React Navigation v7 (Stack + Bottom Tab Navigator)
- **Forms**: React Hook Form + Zod validation
- **UI**: Custom components (no UI library — build from scratch, clean flat design)
- **Storage**: expo-secure-store (tokens), AsyncStorage (non-sensitive cache)
- **Push**: expo-notifications + Firebase Cloud Messaging (FCM)
- **Camera**: expo-camera (selfie capture)
- **Location**: expo-location (GPS coordinates)
- **Build**: EAS Build for Android APK

### Backend API
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma (PostgreSQL)
- **Auth**: JWT (access token 15min expiry) + Refresh token (30 days, stored in httpOnly cookie)
- **Queue/Jobs**: BullMQ + Redis (nightly re-verification cron)
- **Validation**: Zod
- **File uploads**: multer + AWS S3 SDK v3
- **SMS**: MSG91 API
- **Push**: Firebase Admin SDK

### Database
- **Primary**: PostgreSQL 15
- **Cache/Queue**: Redis 7

### Infrastructure
- **Cloud**: AWS (ap-south-1 — India region, mandatory for DPDP compliance)
- **Containers**: Docker + docker-compose for local dev
- **Storage**: AWS S3 (encrypted at rest)

---

## REPOSITORY STRUCTURE

Create a monorepo with this structure:

```
kaamsetu/
├── apps/
│   ├── mobile/          # React Native Expo app (worker + employer)
│   └── admin/           # Admin panel (Next.js 14)
├── packages/
│   ├── api/             # Node.js Express backend
│   ├── database/        # Prisma schema + migrations
│   └── shared/          # Shared TypeScript types, validators, constants
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## STEP 1: DATABASE SCHEMA (Prisma)

Create `packages/database/prisma/schema.prisma` with the complete schema below. Run `npx prisma migrate dev` to apply.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── AUTH ───────────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(uuid())
  mobile       String   @unique
  mobile_verified Boolean @default(false)
  role         UserRole @default(WORKER)
  fcm_token    String?
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  otp_sessions OtpSession[]
  worker       Worker?
  employer     Employer?
  admin        Admin?
}

enum UserRole {
  WORKER
  EMPLOYER
  ADMIN
}

model OtpSession {
  id          String   @id @default(uuid())
  user_id     String
  otp_hash    String
  mobile      String
  purpose     String   // login / verify
  expires_at  DateTime
  used        Boolean  @default(false)
  attempts    Int      @default(0)
  created_at  DateTime @default(now())

  user        User     @relation(fields: [user_id], references: [id])
}

model RefreshToken {
  id          String   @id @default(uuid())
  user_id     String
  token_hash  String   @unique
  expires_at  DateTime
  revoked     Boolean  @default(false)
  created_at  DateTime @default(now())
}

// ─── WORKER ─────────────────────────────────────────────────────────────────

model Worker {
  id                String        @id @default(uuid())
  user_id           String        @unique
  full_name         String        @db.VarChar(200)
  father_name       String?       @db.VarChar(200)
  dob               DateTime?
  gender            String?       @db.Char(1)  // M/F/O
  education_level   String?       @db.VarChar(50)
  profile_photo_url String?
  profile_score     Int           @default(0)
  is_open_to_work   Boolean       @default(true)
  is_pan_india      Boolean       @default(false)
  is_live_in_ok     Boolean       @default(false)
  kyc_status        KycStatus     @default(PENDING)
  blocked_at        DateTime?
  block_reason      String?
  language          String        @default("hi")
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  user              User          @relation(fields: [user_id], references: [id])
  skills            WorkerSkill[]
  work_history      WorkHistory[]
  location          WorkerLocation?
  documents         WorkerDocument?
  verifications     WorkerVerification[]
  background_checks BackgroundCheck[]
  blocks            WorkerBlock[]
  matches           Match[]
  shortlists        Shortlist[]
  hires             Hire[]
  notifications     Notification[]
}

enum KycStatus {
  PENDING
  AADHAAR_DONE
  PAN_DONE
  SELFIE_DONE
  BGC_INITIATED
  FULLY_VERIFIED
  BLOCKED
  SUSPENDED
}

model WorkerSkill {
  id           String   @id @default(uuid())
  worker_id    String
  skill_type   String   @db.VarChar(50) // driver/guard/cook/helper/peon/electrician/plumber/housekeeper/delivery
  specialisation String? // car/heavy_vehicle/truck for drivers; veg/nonveg for cooks
  experience_years Int  @default(0)
  licence_number String?
  is_primary   Boolean  @default(false)
  created_at   DateTime @default(now())

  worker       Worker   @relation(fields: [worker_id], references: [id])
}

model WorkHistory {
  id               String   @id @default(uuid())
  worker_id        String
  employer_name    String   @db.VarChar(200)
  role             String   @db.VarChar(100)
  from_date        DateTime
  to_date          DateTime?
  is_current       Boolean  @default(false)
  reference_name   String?
  reference_mobile String?
  leave_reason     String?
  created_at       DateTime @default(now())

  worker           Worker   @relation(fields: [worker_id], references: [id])
}

model WorkerLocation {
  id               String   @id @default(uuid())
  worker_id        String   @unique
  current_address  String?
  city             String?
  state            String?
  pincode          String?  @db.VarChar(10)
  latitude         Decimal? @db.Decimal(10, 8)
  longitude        Decimal? @db.Decimal(11, 8)
  preferred_cities String[] // Array of city names
  full_address     String?  // From Aadhaar
  aadhaar_district String?
  aadhaar_state    String?
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  worker           Worker   @relation(fields: [worker_id], references: [id])
}

model WorkerDocument {
  id               String   @id @default(uuid())
  worker_id        String   @unique
  masked_aadhaar   String?  @db.VarChar(20)  // XXXXXXXX1234 format ONLY
  aadhaar_xml_url  String?  // S3 URL to original Aadhaar XML
  pan_number       String?  @db.VarChar(20)  // Stored encrypted
  selfie_url       String?  // S3 URL
  licence_url      String?  // S3 URL (for drivers)
  clearance_doc_url String? // S3 URL (court clearance for reinstatement)
  digilocker_client_id String? // Surepass DigiLocker client_id
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  worker           Worker   @relation(fields: [worker_id], references: [id])
}

model WorkerVerification {
  id           String             @id @default(uuid())
  worker_id    String
  check_type   VerificationType
  status       VerificationStatus @default(PENDING)
  verified_at  DateTime?
  response_ref String?
  notes        String?
  created_at   DateTime           @default(now())

  worker       Worker             @relation(fields: [worker_id], references: [id])
}

enum VerificationType {
  AADHAAR
  PAN
  SELFIE
  ADDRESS
  CRIMINAL
  LICENCE
}

enum VerificationStatus {
  PENDING
  IN_PROGRESS
  VERIFIED
  FAILED
  SKIPPED
}

model BackgroundCheck {
  id                String      @id @default(uuid())
  worker_id         String
  check_type        BgcType     @default(ONBOARDING)
  authbridge_ref_id String?
  status            BgcStatus   @default(INITIATED)
  cases_found       Boolean     @default(false)
  case_details      Json?       // Encrypted Authbridge response
  report_url        String?
  initiated_at      DateTime    @default(now())
  completed_at      DateTime?
  next_check_due    DateTime?

  worker            Worker      @relation(fields: [worker_id], references: [id])
}

enum BgcType {
  ONBOARDING
  PERIODIC
  REINSTATEMENT
  MANUAL
}

enum BgcStatus {
  INITIATED
  PENDING
  CLEAR
  FLAGGED
  ERROR
}

model WorkerBlock {
  id               String   @id @default(uuid())
  worker_id        String
  reason           String
  case_type        String?
  case_district    String?
  case_date        DateTime?
  bgc_check_id     String?
  blocked_by       String   @default("SYSTEM") // SYSTEM or admin user_id
  blocked_at       DateTime @default(now())
  reinstated_at    DateTime?
  reinstated_by    String?
  employers_notified Int    @default(0)

  worker           Worker   @relation(fields: [worker_id], references: [id])
}

// ─── EMPLOYER ────────────────────────────────────────────────────────────────

model Employer {
  id              String          @id @default(uuid())
  user_id         String          @unique
  company_name    String          @db.VarChar(200)
  entity_type     String          @db.VarChar(30) // pvt_ltd/llp/proprietor/household/individual
  gst_number      String?         @db.VarChar(20)
  pan_number      String?         @db.VarChar(20)
  tan_number      String?         @db.VarChar(20)
  cin_number      String?         @db.VarChar(25)
  registered_address String?
  city            String?
  state           String?
  pincode         String?         @db.VarChar(10)
  contact_name    String?
  contact_mobile  String?
  kyc_status      EmployerKycStatus @default(PENDING)
  is_active       Boolean         @default(true)
  created_at      DateTime        @default(now())
  updated_at      DateTime        @updatedAt

  user            User            @relation(fields: [user_id], references: [id])
  verifications   EmployerVerification[]
  requirements    Requirement[]
  shortlists      Shortlist[]
  hires           Hire[]
  case_alerts     CaseAlert[]
  notifications   Notification[]
}

enum EmployerKycStatus {
  PENDING
  GST_VERIFIED
  PAN_VERIFIED
  FULLY_VERIFIED
  REJECTED
}

model EmployerVerification {
  id           String             @id @default(uuid())
  employer_id  String
  check_type   String             // GST/PAN/TAN/MANUAL
  status       VerificationStatus @default(PENDING)
  verified_at  DateTime?
  notes        String?
  created_at   DateTime           @default(now())

  employer     Employer           @relation(fields: [employer_id], references: [id])
}

// ─── REQUIREMENTS & MATCHING ─────────────────────────────────────────────────

model Requirement {
  id               String          @id @default(uuid())
  employer_id      String
  job_type         String          @db.VarChar(50)
  custom_job_type  String?
  openings         Int             @default(1)
  salary_min       Int
  salary_max       Int
  city             String?
  state            String?
  pincode          String?
  latitude         Decimal?        @db.Decimal(10, 8)
  longitude        Decimal?        @db.Decimal(11, 8)
  is_pan_india     Boolean         @default(false)
  is_live_in_required Boolean      @default(false)
  min_experience_years Int         @default(0)
  start_date       DateTime?
  status           RequirementStatus @default(ACTIVE)
  created_at       DateTime        @default(now())
  updated_at       DateTime        @updatedAt
  expires_at       DateTime

  employer         Employer        @relation(fields: [employer_id], references: [id])
  matches          Match[]
  shortlists       Shortlist[]
  hires            Hire[]
}

enum RequirementStatus {
  ACTIVE
  PAUSED
  CLOSED
  FULFILLED
}

model Match {
  id               String      @id @default(uuid())
  requirement_id   String
  worker_id        String
  match_score      Int
  score_breakdown  Json        // {job_type: 30, location: 25, experience: 20, verified: 15, live_in: 10}
  distance_km      Decimal?    @db.Decimal(6, 2)
  created_at       DateTime    @default(now())

  requirement      Requirement @relation(fields: [requirement_id], references: [id])
  worker           Worker      @relation(fields: [worker_id], references: [id])

  @@unique([requirement_id, worker_id])
}

model Shortlist {
  id             String      @id @default(uuid())
  employer_id    String
  worker_id      String
  requirement_id String
  notes          String?
  created_at     DateTime    @default(now())

  employer       Employer    @relation(fields: [employer_id], references: [id])
  worker         Worker      @relation(fields: [worker_id], references: [id])
  requirement    Requirement @relation(fields: [requirement_id], references: [id])

  @@unique([employer_id, worker_id, requirement_id])
}

model Hire {
  id                  String      @id @default(uuid())
  employer_id         String
  worker_id           String
  requirement_id      String
  offer_salary        Int
  start_date          DateTime
  offer_letter_url    String?
  esign_worker_at     DateTime?
  esign_employer_at   DateTime?
  status              HireStatus  @default(OFFER_SENT)
  created_at          DateTime    @default(now())
  updated_at          DateTime    @updatedAt

  employer            Employer    @relation(fields: [employer_id], references: [id])
  worker              Worker      @relation(fields: [worker_id], references: [id])
  requirement         Requirement @relation(fields: [requirement_id], references: [id])
}

enum HireStatus {
  OFFER_SENT
  WORKER_SIGNED
  EMPLOYER_SIGNED
  ACTIVE
  TERMINATED
}

// ─── CASE ALERTS ─────────────────────────────────────────────────────────────

model CaseAlert {
  id               String    @id @default(uuid())
  worker_id        String
  employer_id      String
  bgc_check_id     String
  case_type        String
  case_district    String
  case_date        DateTime?
  notified_at      DateTime  @default(now())
  employer_action  String?   // acknowledged / terminated / retained
  employer_acted_at DateTime?

  employer         Employer  @relation(fields: [employer_id], references: [id])
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

model Notification {
  id           String   @id @default(uuid())
  type         String   // CASE_ALERT / JOB_MATCH / KYC_DONE / HIRE_CONFIRMED etc.
  worker_id    String?
  employer_id  String?
  title        String
  body         String
  data         Json?    // Extra payload
  fcm_message_id String?
  delivered_at DateTime?
  created_at   DateTime @default(now())

  worker       Worker?  @relation(fields: [worker_id], references: [id])
  employer     Employer? @relation(fields: [employer_id], references: [id])
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

model Admin {
  id         String   @id @default(uuid())
  user_id    String   @unique
  name       String
  email      String   @unique
  created_at DateTime @default(now())

  user       User     @relation(fields: [user_id], references: [id])
}

model AuditLog {
  id          String   @id @default(uuid())
  actor_id    String   // user_id who performed the action
  actor_role  String
  action      String   // BLOCK_WORKER / REINSTATE_WORKER / VERIFY_KYC etc.
  target_id   String?  // worker_id or employer_id affected
  target_type String?
  details     Json?
  ip_address  String?
  created_at  DateTime @default(now())
}
```

---

## STEP 2: BACKEND API (Node.js + Express + TypeScript)

Create `packages/api/src/` with the following structure and implement all routes fully:

```
src/
├── index.ts                    # App entry point
├── config/
│   ├── database.ts             # Prisma client singleton
│   ├── redis.ts                # Redis client
│   └── firebase.ts             # Firebase Admin init
├── middleware/
│   ├── auth.ts                 # JWT verification, role guard
│   ├── validate.ts             # Zod schema validation middleware
│   ├── rateLimit.ts            # express-rate-limit config
│   └── errorHandler.ts         # Global error handler
├── routes/
│   ├── auth.ts                 # /api/v1/auth/*
│   ├── worker.ts               # /api/v1/worker/*
│   ├── employer.ts             # /api/v1/employer/*
│   ├── requirements.ts         # /api/v1/requirements/*
│   ├── matches.ts              # /api/v1/matches/*
│   ├── admin.ts                # /api/v1/admin/*
│   └── webhooks.ts             # /api/v1/webhooks/* (Authbridge callback)
├── services/
│   ├── otp.service.ts          # OTP generation, hash, verify
│   ├── sms.service.ts          # MSG91 integration
│   ├── surepass.service.ts     # Surepass DigiLocker API
│   ├── authbridge.service.ts   # Authbridge criminal check
│   ├── s3.service.ts           # AWS S3 upload/download
│   ├── fcm.service.ts          # Firebase push notifications
│   ├── matching.service.ts     # Matching algorithm
│   ├── scoring.service.ts      # Profile score calculation
│   └── offerLetter.service.ts  # PDF generation (pdfkit)
├── jobs/
│   ├── queue.ts                # BullMQ queue setup
│   ├── bgcRecheck.job.ts       # Nightly re-verification
│   └── scheduler.ts            # node-cron setup (2AM IST daily)
└── utils/
    ├── jwt.ts                  # Sign/verify helpers
    ├── crypto.ts               # Encrypt/decrypt PAN, payload
    ├── haversine.ts            # Distance calculation
    └── logger.ts               # Winston logger
```

### AUTH ROUTES — implement fully:

```
POST /api/v1/auth/send-otp
  Body: { mobile: string }
  Logic:
    1. Validate Indian mobile (10 digits, starts with 6-9)
    2. Find or create User with role=WORKER (default)
    3. Generate 6-digit OTP
    4. Hash OTP with bcrypt (rounds=12), store in OtpSession with 5-min expiry
    5. Send via MSG91 SMS API
    6. Return: { success: true, expires_in: 300 }

POST /api/v1/auth/verify-otp
  Body: { mobile: string, otp: string, role?: 'WORKER' | 'EMPLOYER' }
  Logic:
    1. Find latest unused OtpSession for mobile
    2. Check expiry, check attempts (max 5)
    3. Compare OTP with bcrypt.compare
    4. Mark OtpSession as used
    5. Create/update user role if employer signup
    6. Generate JWT access token (15min) + refresh token (30 days)
    7. Store refresh token hash in RefreshToken table
    8. Return: { access_token, refresh_token, user: { id, role, is_new_user } }

POST /api/v1/auth/refresh
  Body: { refresh_token: string }
  Logic: validate, rotate tokens, return new pair

POST /api/v1/auth/logout
  Auth: required
  Logic: revoke refresh token
```

### WORKER ROUTES — implement fully:

```
GET  /api/v1/worker/profile            # Get own profile (all tables joined)
PUT  /api/v1/worker/profile/personal   # Update personal details
PUT  /api/v1/worker/profile/skills     # Update skills array (replace all)
PUT  /api/v1/worker/profile/history    # Update work history array
PUT  /api/v1/worker/profile/location   # Update location + preferences
PUT  /api/v1/worker/profile/toggle-work # Toggle is_open_to_work

POST /api/v1/worker/kyc/initiate-aadhaar
  Logic:
    1. Call Surepass DigiLocker Aadhaar API:
       GET https://kyc-api.surepass.app/api/v1/digilocker/download-aadhaar/{client_id}
       Header: Authorization: Bearer {SUREPASS_API_KEY}
    2. Parse response:
       - full_name → worker.full_name
       - dob → worker.dob
       - gender → worker.gender
       - masked_aadhaar → worker_documents.masked_aadhaar (NEVER store full number)
       - father_name → worker.father_name
       - profile_image (base64) → upload to S3 as worker photo
       - address fields → worker_locations (auto-populate)
       - xml_url → worker_documents.aadhaar_xml_url
    3. Create/update WorkerVerification record (type=AADHAAR, status=VERIFIED)
    4. Update worker.kyc_status to AADHAAR_DONE
    5. Recalculate profile_score
    6. Return: { success: true, worker_data: { name, dob, masked_aadhaar, address } }

POST /api/v1/worker/kyc/verify-pan
  Body: { pan_number: string }
  Logic:
    1. Validate PAN format (regex: [A-Z]{5}[0-9]{4}[A-Z]{1})
    2. Call Surepass PAN verification API
    3. Confirm name matches Aadhaar name (fuzzy match, allow ±1 word difference)
    4. Store encrypted PAN in worker_documents.pan_number
    5. Create WorkerVerification (type=PAN, status=VERIFIED)
    6. Update kyc_status to PAN_DONE, recalculate score

POST /api/v1/worker/kyc/upload-selfie
  Body: multipart/form-data { selfie: File }
  Logic:
    1. Validate file: image/jpeg or image/png, max 5MB
    2. Upload to S3: workers/{worker_id}/selfie.jpg (server-side encryption SSE-S3)
    3. Create WorkerVerification (type=SELFIE, status=VERIFIED) — face match is manual/future ML
    4. Update kyc_status to SELFIE_DONE, recalculate score

POST /api/v1/worker/kyc/initiate-bgc
  Logic:
    1. Check worker.kyc_status is at least SELFIE_DONE
    2. Call Authbridge API to initiate criminal background check
       - Pass: worker full_name, dob, father_name, masked_aadhaar, address
       - Store authbridge_ref_id in BackgroundCheck record
    3. Create BackgroundCheck (type=ONBOARDING, status=INITIATED)
    4. Update worker.kyc_status to BGC_INITIATED
    5. Return: { success: true, message: "Background check initiated. Results in 24-48 hours." }

GET /api/v1/worker/jobs                # Get matched jobs (from matches table for this worker)
GET /api/v1/worker/notifications       # Worker's notification history
POST /api/v1/worker/reinstatement/upload  # Upload court clearance document
```

### EMPLOYER ROUTES:

```
GET  /api/v1/employer/profile
PUT  /api/v1/employer/profile
POST /api/v1/employer/kyc/verify-gst       # Call GST verification API
POST /api/v1/employer/kyc/verify-pan       # Call PAN verification API

POST /api/v1/employer/requirements         # Create new requirement; trigger matching job
GET  /api/v1/employer/requirements         # List own requirements
PUT  /api/v1/employer/requirements/:id     # Update/pause/close
GET  /api/v1/employer/requirements/:id/matches  # Get matched workers for a requirement

POST /api/v1/employer/shortlist            # Add worker to shortlist
GET  /api/v1/employer/shortlist            # Get all shortlisted workers

POST /api/v1/employer/hire                 # Confirm hire, generate offer letter
GET  /api/v1/employer/hires                # Hire history
GET  /api/v1/employer/case-alerts          # All case alerts received

POST /api/v1/employer/case-alerts/:id/action  # Mark action taken on a case alert
```

### ADMIN ROUTES:

```
GET  /api/v1/admin/dashboard               # KPI metrics
GET  /api/v1/admin/kyc-queue               # Workers pending KYC review
POST /api/v1/admin/kyc/:worker_id/approve
POST /api/v1/admin/kyc/:worker_id/reject   # Body: { reason: string }

GET  /api/v1/admin/case-alerts             # New BGC flags pending action
POST /api/v1/admin/workers/:id/block       # Block worker + notify employers
POST /api/v1/admin/workers/:id/reinstate   # Reinstate after clearance review

GET  /api/v1/admin/workers                 # Paginated worker list with filters
GET  /api/v1/admin/employers               # Paginated employer list
GET  /api/v1/admin/analytics               # Platform analytics data
```

### WEBHOOKS:

```
POST /api/v1/webhooks/authbridge
  Logic (CRITICAL — implement fully):
    1. Verify webhook signature using HMAC-SHA256 (Authbridge sends X-Signature header)
    2. Find BackgroundCheck by authbridge_ref_id
    3. Update BackgroundCheck.status and cases_found
    4. Encrypt and store result_payload
    5. If cases_found = true:
       a. Set worker.kyc_status = 'BLOCKED', worker.blocked_at = NOW()
       b. Create WorkerBlock record with case details
       c. Remove worker from all active match results
       d. Find all employers who have this worker in shortlists or active hires
       e. For each affected employer:
          - Create CaseAlert record
          - Send FCM push notification: "Security Alert: A worker in your account has a new case registered against them."
          - Send SMS alert via MSG91
       f. Send FCM push to worker: "Your profile has been paused due to a new case."
       g. Send SMS to worker with helpline number
       h. Log to AuditLog
    6. If cases_found = false:
       a. Set BackgroundCheck.status = CLEAR
       b. Set next_check_due = NOW() + 180 days
       c. If worker was BGC_INITIATED: set kyc_status = FULLY_VERIFIED
       d. Recalculate profile_score
    7. Return 200 OK immediately
```

### MATCHING SERVICE — implement fully:

```typescript
// packages/api/src/services/matching.service.ts

interface ScoreBreakdown {
  job_type: number;    // max 30
  location: number;   // max 25
  experience: number; // max 20
  verified: number;   // max 15
  live_in: number;    // max 10
}

async function computeMatch(requirement: Requirement, worker: Worker): Promise<number> {
  // HARD FILTERS — return null if any fail
  if (worker.kyc_status !== 'FULLY_VERIFIED') return null;
  if (!worker.is_open_to_work) return null;
  if (worker.blocked_at !== null) return null;

  const breakdown: ScoreBreakdown = {
    job_type: scoreJobType(requirement.job_type, worker.skills),
    location: scoreLocation(requirement, worker.location, worker.is_pan_india),
    experience: scoreExperience(requirement.min_experience_years, worker.skills),
    verified: 15, // worker is fully_verified (passed hard filter)
    live_in: scoreLiveIn(requirement.is_live_in_required, worker.is_live_in_ok)
  };

  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return total;
}

function scoreJobType(required: string, skills: WorkerSkill[]): number {
  const primarySkill = skills.find(s => s.is_primary)?.skill_type;
  if (primarySkill === required) return 30;
  const related = skills.some(s => s.skill_type === required);
  if (related) return 20;
  return 0;
}

function scoreLocation(req, workerLoc, isPanIndia: boolean): number {
  if (isPanIndia) return 20;
  if (!workerLoc?.latitude || !req.latitude) return 5;
  const km = haversine(req.latitude, req.longitude, workerLoc.latitude, workerLoc.longitude);
  if (km <= 5) return 25;
  if (km <= 20) return 18;
  if (km <= 50) return 10;
  return 3;
}

function scoreExperience(required: number, skills: WorkerSkill[]): number {
  const maxExp = Math.max(...skills.map(s => s.experience_years));
  if (maxExp >= required) return 20;
  if (maxExp >= required - 1) return 10;
  return 0;
}

function scoreLiveIn(required: boolean, workerOk: boolean): number {
  if (!required) return 10;
  return workerOk ? 10 : 0;
}

// Trigger matching when a new requirement is posted
async function runMatchingForRequirement(requirementId: string): Promise<void> {
  // 1. Get requirement details
  // 2. Get all eligible workers (hard filters at DB level using WHERE kyc_status='FULLY_VERIFIED' AND blocked_at IS NULL AND is_open_to_work=true)
  // 3. For each worker: compute score
  // 4. Insert/update matches table
  // 5. Send FCM push to top 20 matched workers: "New job opportunity matching your profile"
}
```

### NIGHTLY RE-VERIFICATION JOB:

```typescript
// packages/api/src/jobs/bgcRecheck.job.ts
// Runs every day at 2:00 AM IST (20:30 UTC previous day)

import cron from 'node-cron';

cron.schedule('30 20 * * *', async () => {
  const workersToCheck = await prisma.backgroundCheck.findMany({
    where: {
      status: 'CLEAR',
      next_check_due: { lte: new Date() },
      worker: { kyc_status: 'FULLY_VERIFIED', blocked_at: null }
    },
    include: { worker: { include: { documents: true, location: true } } }
  });

  for (const check of workersToCheck) {
    await authrbridge.initiateCheck(check.worker, 'PERIODIC');
    // Authbridge calls back to /webhooks/authbridge when done
  }

  logger.info(`Nightly BGC re-check initiated for ${workersToCheck.length} workers`);
});
```

---

## STEP 3: MOBILE APP (React Native / Expo)

### App Entry and Navigation

Create `apps/mobile/App.tsx` and `apps/mobile/src/navigation/`:

```typescript
// Root navigator — checks auth state and routes accordingly
// If no token → AuthNavigator (OTP login flow)
// If token + role=WORKER → WorkerNavigator
// If token + role=EMPLOYER → EmployerNavigator
```

### Worker App Screens — implement all 9 screens fully:

**Screen 1: SplashLanguageScreen**
- App logo (KaamSetu branding, blue color #1A56A0)
- Language chips in a 3-column grid: हिन्दी, English, मराठी, தமிழ், తెలుగు, বাংলা, ಕನ್ನಡ, ਪੰਜਾਬੀ
- Save selection to AsyncStorage
- Continue button → OTP screen

**Screen 2: MobileOtpScreen**
- Mobile number input with +91 prefix
- Validate: must be 10 digits, start with 6/7/8/9
- Submit → call POST /api/v1/auth/send-otp
- OTP input: 6 individual TextInput boxes (auto-advance on digit entry)
- 30-second resend countdown
- On verify → call POST /api/v1/auth/verify-otp
- Store tokens in expo-secure-store
- Navigate to PersonalDetailsScreen or Dashboard based on kyc_status

**Screen 3: PersonalDetailsScreen**
- Progress bar: 1/7
- Photo upload circle: tap to take selfie OR pick from gallery (expo-image-picker)
- Full name input (pre-filled if Aadhaar done)
- DOB picker (date scroll wheel)
- Gender chips: Male / Female / Other
- Father's / Husband's name input
- Education chips: No formal / Class 5 / 10th pass / 12th pass / Graduate / Post-graduate
- Save → PUT /api/v1/worker/profile/personal

**Screen 4: OccupationSkillsScreen**
- Progress bar: 2/7
- Job type chips with icons (use emoji as icon substitute):
  🚗 Driver, 🛡 Security guard, 🍳 Cook / chef, 🏠 Housekeeper,
  📦 Delivery, 🔧 Electrician, 🔩 Plumber, 📋 Office boy/peon,
  🧹 Sweeper/cleaner, 👤 Helper/assistant, ➕ Add custom
- Multi-select allowed; first selected = primary skill
- If Driver selected: show sub-chips (Car / Heavy vehicle / Truck / Auto / Bus) + licence number input
- Experience chips: 0–1 yr / 1–3 yr / 3–5 yr / 5–10 yr / 10+ yr
- Save → PUT /api/v1/worker/profile/skills

**Screen 5: WorkHistoryScreen**
- Progress bar: 3/7
- Expandable card for Employer 1 (required):
  - Company/employer name, role, from month-year, to month-year
  - Reference contact name and mobile
  - Reason for leaving (chips)
- "+ Add employer 2" expandable card (optional)
- Save → PUT /api/v1/worker/profile/history

**Screen 6: LocationPreferencesScreen**
- Progress bar: 4/7
- "Detect my location" button → call expo-location getCurrentPositionAsync()
- Show detected: "Rohini, New Delhi — 110085"
- Living address text input (auto-populated from GPS reverse geocode)
- Pincode input
- "Preferred job cities" multi-select chips (scrollable, top 20 Indian cities + search)
- "Willing to live at employer's house" toggle (live-in)
- "Open to jobs anywhere in India" toggle (pan-India)
- Save → PUT /api/v1/worker/profile/location

**Screen 7: KycVerificationScreen**
- Progress bar: 5/7 to 7/7 (advances per step)
- Title: "Verify your identity"
- Sub-title in selected language
- 5 verification cards with icon + name + status badge:

  Card 1 — Aadhaar (via DigiLocker):
  - Button: "Link Aadhaar via DigiLocker"
  - Opens DigiLocker consent flow (WebView or deep link to Surepass)
  - On success: auto-populates name, DOB, photo, address
  - Shows: "Verified ✓" green badge

  Card 2 — PAN card:
  - PAN number input field
  - Validate format before submit
  - POST /api/v1/worker/kyc/verify-pan
  - Shows result badge

  Card 3 — Selfie:
  - "Take selfie" button → expo-camera
  - Shows captured photo preview
  - POST /api/v1/worker/kyc/upload-selfie (multipart)
  - Shows: "Uploaded ✓"

  Card 4 — Criminal background check:
  - Initiates automatically after selfie done
  - POST /api/v1/worker/kyc/initiate-bgc
  - Shows: "Check in progress (24–48 hrs)" with amber badge
  - Updates to green "Clear ✓" when webhook completes

  Card 5 — Address verification:
  - Triggered by Authbridge as part of BGC
  - Shows status

- CONSENT SCREEN (mandatory before starting KYC):
  - Show consent text in user's chosen language
  - Checkbox: "I agree to share my Aadhaar data for identity verification"
  - Checkbox: "I understand my data will be checked periodically for criminal records"
  - Both must be checked before proceeding
  - Store consent timestamp + IP in database

**Screen 8: WorkerDashboardScreen (Home)**
- Header: avatar initials + name + location + green dot "Open to work"
- Toggle "Open to work" / "Not available" (calls PUT /api/v1/worker/profile/toggle-work)
- Profile score ring (e.g., 86/100) with green border
- Verification badges strip: Aadhaar ✓, PAN ✓, Criminal clear ✓, Address ✓
- "Matched Jobs" section: fetches GET /api/v1/worker/jobs
  - Job cards: title, company name, salary range (green), distance (blue), live-in tag
  - Empty state: "Set up your profile to see matching jobs"
- Bottom tab bar: Home, Jobs, Alerts, Profile

**Screen 9: ProfileBlockedScreen**
- This screen renders if worker.kyc_status === 'BLOCKED'
- Large red shield icon
- Title: "Your profile has been paused"
- Subtitle: "A new case has been found during routine verification"
- Case details card: case type, district, date detected
- Platform action card: "Your profile is blocked. Employers who had you shortlisted have been notified."
- "What next?" card with steps
- Button 1: "Upload court clearance" → opens document picker (expo-document-picker), uploads to S3 via POST /api/v1/worker/reinstatement/upload
- Button 2: "Contact support" → opens WhatsApp with pre-filled message or calls helpline
- No bottom tab bar on this screen

---

### Employer App Screens — implement all 8 screens fully:

**Screen E1: EmployerRegistrationScreen**
- Progress bar: 1/4
- Entity type chips: Pvt. Ltd. / LLP / Proprietor / Individual / Household
  - If Household: hide GST/TAN fields (households don't have GST)
- Company name input
- GST number (conditional, with real-time format validation: 15-character alphanumeric)
- PAN input
- TAN input (conditional)
- Registered address, city, state, pincode
- HR/contact name and mobile
- Save → creates Employer record + triggers KYC verification

**Screen E2: CompanyKycStatusScreen**
- Progress list showing verification steps with green/amber/red indicators
- GST verified (or skipped for household)
- PAN verified
- TAN verified
- Manual review: "Our team will call your HR contact within 4 hours"
- Info card: "You can browse the platform while verification is in progress"
- Auto-refreshes every 30 seconds (polling)

**Screen E3: EmployerDashboardScreen**
- Header: company name + city
- Alert bell with red dot (case alerts count)
- 3 metric cards: Active requirements / Matched profiles / Total hired
- Active requirements list with match count badges
- "Post new requirement" primary CTA button
- Bottom tab bar: Home, Post, Profiles, Account

**Screen E4: PostRequirementScreen**
- Job type chips (same as worker skill list)
- Number of openings (number input, min 1)
- Salary range: two sliders or number inputs (min/max)
- Job location: city + pincode (with map pin button for GPS)
- Start date picker
- "Pan India visibility" toggle: workers from any city will see this
- "Must live at employer's premises" toggle
- Minimum experience chips: Any / 1+ yr / 3+ yr / 5+ yr / 10+ yr
- "Find matching profiles" CTA → POST /api/v1/employer/requirements → navigate to matches

**Screen E5: MatchedProfilesScreen**
- Header: "Driver · Gurugram — 14 profiles matched"
- Filter chips: All / Nearby / Pan India / Live-in ok
- Worker cards:
  - Initials avatar + full name
  - Skill + experience + city
  - Distance badge (green for nearby, gray for pan-india)
  - "Fully verified ✓" green shield badge
  - Specialisation tags (car, heavy vehicle)
  - Live-in ok tag (purple)
- Sort: by distance (default) / by match score
- Tap card → navigate to worker detail

**Screen E6: WorkerDetailScreen**
- Large avatar circle (initials) + name + skill + experience
- Verification table: Aadhaar ✓ / PAN ✓ / Criminal check clear (with date) / Address ✓
- Work history accordion (expandable)
- Distance badge + city
- Action buttons: "Send interest" + "Shortlist"
- "Send interest" → POST /api/v1/employer/shortlist + FCM notification to worker

**Screen E7: CaseAlertScreen**
- This screen is pushed automatically when a case alert notification is received
- Also accessible from notification bell
- Red alert header
- Case details card: worker name, case type, district, detected date
- "Platform action taken" card (green): worker blocked, cannot apply for new jobs
- Legal disclaimer: "This is information only. Verify independently. Final decision is yours."
- Button 1: "Mark action taken" → POST /api/v1/employer/case-alerts/:id/action
- Button 2: "Talk to KaamSetu support"

**Screen E8: HireConfirmedScreen**
- Success animation (animated check icon using Animated API)
- Offer details card: worker name, role, salary, start date, company
- eSign status row: worker signed ✓ / employer signed ✓
- "Background re-checks scheduled" info card: "This worker will be re-verified every 6 months. You'll be alerted immediately if any case is found."
- Offer letter card: "Generated and sent to both parties"
- "Download offer letter PDF" button
- "Post another requirement" button

---

## STEP 4: SHARED COMPONENTS

Build these reusable components in `apps/mobile/src/components/`:

```
components/
├── common/
│   ├── Button.tsx              # Primary, Secondary, Danger variants
│   ├── Input.tsx               # Text input with label, error state
│   ├── Chip.tsx                # Selectable chip with optional icon
│   ├── ChipGroup.tsx           # Multi-select chip container
│   ├── ProgressBar.tsx         # Step progress indicator
│   ├── StatusBadge.tsx         # Verified/Pending/Blocked/Flagged
│   ├── Avatar.tsx              # Initials circle with color
│   ├── Card.tsx                # Raised card container
│   ├── AlertCard.tsx           # Danger/Warning/Success/Info
│   ├── SectionHeader.tsx       # Section title + optional action
│   ├── LoadingSpinner.tsx      # Activity indicator overlay
│   ├── EmptyState.tsx          # Icon + message for empty lists
│   └── ToggleSwitch.tsx        # Custom iOS-style toggle
├── worker/
│   ├── JobCard.tsx             # Job listing card for worker
│   ├── VerificationCard.tsx    # KYC step card
│   └── ProfileScoreRing.tsx    # Circular score indicator
└── employer/
    ├── WorkerCard.tsx          # Worker match card for employer
    ├── RequirementCard.tsx     # Posted requirement card
    └── CaseAlertCard.tsx       # Alert notification card
```

### Design System — implement in `apps/mobile/src/theme/`:

```typescript
// theme/colors.ts
export const Colors = {
  primary: '#1A56A0',
  primaryLight: '#E6F1FB',
  primaryText: '#0C447C',
  success: '#3B6D11',
  successLight: '#EAF3DE',
  danger: '#A32D2D',
  dangerLight: '#FCEBEB',
  warning: '#854F0B',
  warningLight: '#FAEEDA',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.12)',
  textPrimary: '#1A1A1A',
  textSecondary: '#555555',
  textTertiary: '#888888',
};

// theme/typography.ts
export const Typography = {
  h1: { fontSize: 24, fontWeight: '600' as const },
  h2: { fontSize: 20, fontWeight: '500' as const },
  h3: { fontSize: 16, fontWeight: '500' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '400' as const },
};

// theme/spacing.ts
export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32
};
```

---

## STEP 5: VALIDATION

Use Zod for ALL validation. Create schemas in `packages/shared/src/validators/`:

```typescript
// validators/worker.validators.ts
import { z } from 'zod';

export const PersonalDetailsSchema = z.object({
  full_name: z.string().min(2).max(200).regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(d => {
    const age = (Date.now() - new Date(d).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 18 && age <= 70;
  }, 'Age must be between 18 and 70'),
  gender: z.enum(['M', 'F', 'O']),
  education_level: z.enum(['none', 'class5', '10th', '12th', 'graduate', 'postgraduate']).optional(),
});

export const MobileSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
});

export const OtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export const PanSchema = z.object({
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
});

export const RequirementSchema = z.object({
  job_type: z.string().min(1),
  openings: z.number().min(1).max(1000),
  salary_min: z.number().min(1000),
  salary_max: z.number().min(1000),
  city: z.string().optional(),
  is_pan_india: z.boolean(),
  is_live_in_required: z.boolean(),
  min_experience_years: z.number().min(0).max(50),
  start_date: z.string().optional(),
}).refine(d => d.salary_max >= d.salary_min, { message: 'Max salary must be >= min salary' })
  .refine(d => d.is_pan_india || d.city, { message: 'Provide city or enable Pan India' });
```

---

## STEP 6: SECURITY IMPLEMENTATION

### JWT Middleware:
```typescript
// Verify access token on every protected route
// Role-based guard: requireRole('WORKER'), requireRole('EMPLOYER'), requireRole('ADMIN')
// On token expiry: return 401 with message "TOKEN_EXPIRED" (app then uses refresh token)
```

### Encryption for sensitive fields:
```typescript
// utils/crypto.ts
// AES-256-GCM encryption for PAN numbers and BGC response payloads
// Encryption key from env: ENCRYPTION_KEY (32 bytes, stored in AWS Secrets Manager)
// Always encrypt before DB insert; decrypt only in service layer, never expose raw
```

### Aadhaar number protection:
```typescript
// CRITICAL: Create a database constraint and TypeScript type guard
// masked_aadhaar field ONLY ever stores format XXXXXXXX1234
// Any attempt to store full 12-digit Aadhaar throws an error
function validateMaskedAadhaar(masked: string): boolean {
  return /^X{8}\d{4}$/.test(masked);
}
```

### Rate limiting:
```typescript
// OTP endpoint: max 3 OTP requests per mobile per hour
// Login endpoint: max 10 attempts per IP per 15 minutes
// Worker/Employer API: 100 req/min per user
// Webhook endpoint: whitelist Authbridge IP ranges only
```

---

## STEP 7: PUSH NOTIFICATIONS

### FCM Setup (Firebase Admin SDK in backend):
```typescript
// services/fcm.service.ts
import admin from 'firebase-admin';

// Notification types and payloads:
const NOTIFICATION_TEMPLATES = {
  CASE_ALERT_EMPLOYER: {
    title: 'Security Alert — Action Required',
    body: 'A worker in your account has a new case registered. Tap to view details.',
    data: { type: 'CASE_ALERT', screen: 'CaseAlert' }
  },
  WORKER_PROFILE_BLOCKED: {
    title: 'Your profile has been paused',
    body: 'A new case was found during routine verification. Tap to learn more.',
    data: { type: 'PROFILE_BLOCKED', screen: 'ProfileBlocked' }
  },
  WORKER_NEW_JOB_MATCH: {
    title: 'New job opportunity',
    body: 'A new job matching your profile is available. Tap to view.',
    data: { type: 'JOB_MATCH', screen: 'WorkerDashboard' }
  },
  HIRE_CONFIRMED: {
    title: 'Congratulations! Job confirmed',
    body: 'Your offer letter is ready. Tap to view and sign.',
    data: { type: 'HIRE_CONFIRMED', screen: 'HireConfirmed' }
  },
  WORKER_REINSTATED: {
    title: 'Profile reinstated',
    body: 'Your profile is now active again. You can apply for jobs.',
    data: { type: 'REINSTATED', screen: 'WorkerDashboard' }
  },
};
```

### Mobile notification handler:
```typescript
// Handle FCM notifications in the app
// Background: show OS notification
// Foreground: show in-app alert banner
// On tap: navigate to relevant screen based on data.screen
// Register FCM token on login, update on token refresh
```

---

## STEP 8: APK BUILD CONFIGURATION

Create `apps/mobile/eas.json`:
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "distribution": "internal",
      "android": { "buildType": "apk", "gradleCommand": ":app:assembleDebug" },
      "env": { "APP_ENV": "development" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "APP_ENV": "staging" }
    },
    "production": {
      "distribution": "store",
      "android": { "buildType": "app-bundle" },
      "env": { "APP_ENV": "production" }
    }
  }
}
```

Create `apps/mobile/app.json`:
```json
{
  "expo": {
    "name": "KaamSetu",
    "slug": "kaamsetu",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": { "image": "./assets/splash.png", "backgroundColor": "#1A56A0" },
    "android": {
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#1A56A0" },
      "package": "com.kaamsetu.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "POST_NOTIFICATIONS"
      ],
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-camera",
      "expo-location",
      "expo-document-picker",
      "expo-image-picker",
      "expo-secure-store",
      ["expo-notifications", { "sounds": ["./assets/notification.wav"] }]
    ]
  }
}
```

Create `apps/mobile/BUILD_INSTRUCTIONS.md`:
```markdown
# Building KaamSetu APK

## Prerequisites
- Node.js 20+
- Expo account (expo.dev)
- EAS CLI: npm install -g eas-cli

## Steps

### 1. Install dependencies
cd apps/mobile && npm install

### 2. Login to Expo
eas login

### 3. Configure project
eas build:configure

### 4. Add Firebase config
- Download google-services.json from Firebase Console
- Place in apps/mobile/google-services.json

### 5. Set environment variables
cp .env.example .env
# Fill in all required values

### 6. Build development APK (for testing)
eas build --platform android --profile development
# Takes ~10 minutes, download link sent to email

### 7. Build production APK/AAB
eas build --platform android --profile production
# Submit to Play Store via eas submit --platform android

### 8. Local testing (without EAS)
npx expo run:android --variant debug
# Requires Android Studio and connected device/emulator
```

---

## STEP 9: DOCKER SETUP

Create `docker-compose.yml` in root:
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kaamsetu
      POSTGRES_USER: kaamsetu
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: ./packages/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://kaamsetu:${DB_PASSWORD}@postgres:5432/kaamsetu
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - "3000:3000"
    volumes:
      - ./packages/api:/app
      - /app/node_modules

volumes:
  postgres_data:
```

---

## STEP 10: ENVIRONMENT VARIABLES

Create `.env.example` in root:
```env
# Database
DATABASE_URL=postgresql://kaamsetu:password@localhost:5432/kaamsetu
DB_PASSWORD=your_secure_password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_32_char_secret_minimum_length_here
JWT_REFRESH_SECRET=your_32_char_refresh_secret_here

# Encryption (for PAN, BGC payloads)
ENCRYPTION_KEY=your_32_byte_aes_key_in_hex_format

# Surepass (Aadhaar KYC)
SUREPASS_API_KEY=your_surepass_bearer_token
SUREPASS_BASE_URL=https://kyc-api.surepass.app

# Authbridge (Criminal Background Check)
AUTHBRIDGE_API_KEY=your_authbridge_api_key
AUTHBRIDGE_API_URL=https://api.authbridge.com
AUTHBRIDGE_WEBHOOK_SECRET=your_webhook_hmac_secret

# AWS S3
AWS_S3_BUCKET=kaamsetu-documents-prod
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1

# Firebase
FIREBASE_PROJECT_ID=kaamsetu-prod
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@kaamsetu-prod.iam.gserviceaccount.com

# SMS (MSG91)
MSG91_API_KEY=your_msg91_key
MSG91_SENDER_ID=KAMSETU
MSG91_OTP_TEMPLATE_ID=your_template_id

# Razorpay (Payments)
RAZORPAY_KEY_ID=rzp_live_your_key
RAZORPAY_KEY_SECRET=your_secret

# eSign (Leegality)
LEEGALITY_API_KEY=your_leegality_key
LEEGALITY_API_URL=https://api.leegality.com

# App
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:8081
LOG_LEVEL=info
```

---

## STEP 11: README

Create a comprehensive `README.md` explaining:
1. Project overview and architecture
2. Local development setup (docker-compose up)
3. Running database migrations
4. Running the mobile app (expo start)
5. Building APK (eas build command)
6. API documentation summary
7. Third-party service setup (Surepass, Authbridge, Firebase, MSG91)
8. Deploying to production (AWS ECS + RDS)
9. DPDP compliance checklist

---

## CRITICAL REQUIREMENTS — DO NOT SKIP

1. **Never store full Aadhaar number** — only masked_aadhaar (XXXXXXXX1234). Enforce at DB level with a CHECK constraint.

2. **Consent before data collection** — implement a dedicated ConsentScreen that appears before KYC starts. Store consent with timestamp.

3. **Authbridge webhook signature verification** — use HMAC-SHA256 to verify every webhook. Reject unverified webhooks with 401.

4. **Background re-check cron** — must run nightly. Include error handling: if Authbridge API fails, queue for retry next day.

5. **Employer notification on block** — when a worker is blocked, ALL employers who have that worker in shortlists or active hires must receive both FCM push AND SMS within 5 minutes.

6. **Profile score calculation** — compute and store after every KYC step:
   - Mobile verified: +10
   - Personal details complete: +15
   - Skills filled: +10
   - Work history added: +15
   - Location set: +5
   - Aadhaar verified: +15
   - PAN verified: +10
   - Selfie uploaded: +5
   - BGC clear: +15
   Total max: 100

7. **Low-literacy UX** — all error messages in the user's selected language. Form labels in Hindi when language=hi. Icon-based chips everywhere possible.

8. **Data residency** — all AWS resources in ap-south-1 (Mumbai). Never store data outside India.

9. **Audit log** — every admin action must be logged to AuditLog table. This is required for DPDP compliance.

10. **Soft deletes** — never hard-delete workers or employers. Add deleted_at field. Retain for 1 year per DPDP rules.

---

Begin by:
1. Creating the monorepo structure
2. Installing all dependencies
3. Running `prisma migrate dev` to create the database
4. Building the backend API routes in order (auth → worker → employer → admin → webhooks)
5. Building the mobile app screens in order (splash → OTP → personal → skills → history → location → KYC → dashboard → blocked)
6. Wiring frontend to backend via RTK Query
7. Setting up the nightly cron job
8. Creating the eas.json and build instructions
9. Writing the complete README

Do not use any placeholder or "TODO" comments — implement everything fully and functionally.
