-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WORKER', 'EMPLOYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'AADHAAR_DONE', 'PAN_DONE', 'SELFIE_DONE', 'BGC_INITIATED', 'FULLY_VERIFIED', 'BLOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('AADHAAR', 'PAN', 'SELFIE', 'ADDRESS', 'CRIMINAL', 'LICENCE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BgcType" AS ENUM ('ONBOARDING', 'PERIODIC', 'REINSTATEMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "BgcStatus" AS ENUM ('INITIATED', 'PENDING', 'CLEAR', 'FLAGGED', 'ERROR');

-- CreateEnum
CREATE TYPE "EmployerKycStatus" AS ENUM ('PENDING', 'GST_VERIFIED', 'PAN_VERIFIED', 'FULLY_VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "HireStatus" AS ENUM ('OFFER_SENT', 'WORKER_SIGNED', 'EMPLOYER_SIGNED', 'ACTIVE', 'TERMINATED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "mobile_verified" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'WORKER',
    "fcm_token" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpSession" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" VARCHAR(200) NOT NULL,
    "father_name" VARCHAR(200),
    "dob" TIMESTAMP(3),
    "gender" CHAR(1),
    "education_level" VARCHAR(50),
    "profile_photo_url" TEXT,
    "profile_score" INTEGER NOT NULL DEFAULT 0,
    "is_open_to_work" BOOLEAN NOT NULL DEFAULT true,
    "is_pan_india" BOOLEAN NOT NULL DEFAULT false,
    "is_live_in_ok" BOOLEAN NOT NULL DEFAULT false,
    "kyc_status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "blocked_at" TIMESTAMP(3),
    "block_reason" TEXT,
    "language" TEXT NOT NULL DEFAULT 'hi',
    "consent_given_at" TIMESTAMP(3),
    "consent_ip" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerSkill" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "skill_type" VARCHAR(50) NOT NULL,
    "specialisation" TEXT,
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "licence_number" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkHistory" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "employer_name" VARCHAR(200) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "reference_name" TEXT,
    "reference_mobile" TEXT,
    "leave_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerLocation" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "current_address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" VARCHAR(10),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "preferred_cities" TEXT[],
    "full_address" TEXT,
    "aadhaar_district" TEXT,
    "aadhaar_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerDocument" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "masked_aadhaar" VARCHAR(20),
    "aadhaar_xml_url" TEXT,
    "pan_number" VARCHAR(200),
    "selfie_url" TEXT,
    "licence_url" TEXT,
    "clearance_doc_url" TEXT,
    "digilocker_client_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerVerification" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "check_type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "response_ref" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundCheck" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "check_type" "BgcType" NOT NULL DEFAULT 'ONBOARDING',
    "authbridge_ref_id" TEXT,
    "status" "BgcStatus" NOT NULL DEFAULT 'INITIATED',
    "cases_found" BOOLEAN NOT NULL DEFAULT false,
    "case_details" JSONB,
    "report_url" TEXT,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "next_check_due" TIMESTAMP(3),

    CONSTRAINT "BackgroundCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerBlock" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "case_type" TEXT,
    "case_district" TEXT,
    "case_date" TIMESTAMP(3),
    "bgc_check_id" TEXT,
    "blocked_by" TEXT NOT NULL DEFAULT 'SYSTEM',
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reinstated_at" TIMESTAMP(3),
    "reinstated_by" TEXT,
    "employers_notified" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkerBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" VARCHAR(200) NOT NULL,
    "entity_type" VARCHAR(30) NOT NULL,
    "gst_number" VARCHAR(20),
    "pan_number" VARCHAR(20),
    "tan_number" VARCHAR(20),
    "cin_number" VARCHAR(25),
    "registered_address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" VARCHAR(10),
    "contact_name" TEXT,
    "contact_mobile" TEXT,
    "kyc_status" "EmployerKycStatus" NOT NULL DEFAULT 'PENDING',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerVerification" (
    "id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "check_type" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployerVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "job_type" VARCHAR(50) NOT NULL,
    "custom_job_type" TEXT,
    "openings" INTEGER NOT NULL DEFAULT 1,
    "salary_min" INTEGER NOT NULL,
    "salary_max" INTEGER NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_pan_india" BOOLEAN NOT NULL DEFAULT false,
    "is_live_in_required" BOOLEAN NOT NULL DEFAULT false,
    "min_experience_years" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "status" "RequirementStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "match_score" INTEGER NOT NULL,
    "score_breakdown" JSONB NOT NULL,
    "distance_km" DECIMAL(6,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shortlist" (
    "id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hire" (
    "id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "offer_salary" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "offer_letter_url" TEXT,
    "esign_worker_at" TIMESTAMP(3),
    "esign_employer_at" TIMESTAMP(3),
    "status" "HireStatus" NOT NULL DEFAULT 'OFFER_SENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAlert" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "bgc_check_id" TEXT NOT NULL,
    "case_type" TEXT NOT NULL,
    "case_district" TEXT NOT NULL,
    "case_date" TIMESTAMP(3),
    "notified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employer_action" TEXT,
    "employer_acted_at" TIMESTAMP(3),

    CONSTRAINT "CaseAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "worker_id" TEXT,
    "employer_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "fcm_message_id" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_id" TEXT,
    "target_type" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "RefreshToken"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_user_id_key" ON "Worker"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerLocation_worker_id_key" ON "WorkerLocation"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerDocument_worker_id_key" ON "WorkerDocument"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_user_id_key" ON "Employer"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Match_requirement_id_worker_id_key" ON "Match"("requirement_id", "worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "Shortlist_employer_id_worker_id_requirement_id_key" ON "Shortlist"("employer_id", "worker_id", "requirement_id");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_user_id_key" ON "Admin"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- AddForeignKey
ALTER TABLE "OtpSession" ADD CONSTRAINT "OtpSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerSkill" ADD CONSTRAINT "WorkerSkill_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistory" ADD CONSTRAINT "WorkHistory_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLocation" ADD CONSTRAINT "WorkerLocation_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerDocument" ADD CONSTRAINT "WorkerDocument_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerVerification" ADD CONSTRAINT "WorkerVerification_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerBlock" ADD CONSTRAINT "WorkerBlock_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerVerification" ADD CONSTRAINT "EmployerVerification_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hire" ADD CONSTRAINT "Hire_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hire" ADD CONSTRAINT "Hire_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hire" ADD CONSTRAINT "Hire_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAlert" ADD CONSTRAINT "CaseAlert_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "Employer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
