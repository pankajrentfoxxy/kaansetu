-- Paid promotion (admin-tracked) — additive, safe migration

ALTER TABLE "Employer" ADD COLUMN "contact_unlocks" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Requirement" ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Requirement" ADD COLUMN "is_urgent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Requirement" ADD COLUMN "promo_note" TEXT;
ALTER TABLE "Requirement" ADD COLUMN "featured_until" TIMESTAMP(3);
