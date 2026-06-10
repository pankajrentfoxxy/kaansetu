-- Refer & Earn (points) — additive, safe migration

ALTER TABLE "Worker" ADD COLUMN "referral_code" TEXT;
ALTER TABLE "Worker" ADD COLUMN "referred_by_code" TEXT;
ALTER TABLE "Worker" ADD COLUMN "referral_rewarded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Worker" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Worker" ADD COLUMN "boost_until" TIMESTAMP(3);
ALTER TABLE "Worker" ADD COLUMN "pan_india_until" TIMESTAMP(3);

CREATE UNIQUE INDEX "Worker_referral_code_key" ON "Worker"("referral_code");

CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PointTransaction_worker_id_idx" ON "PointTransaction"("worker_id");

ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
