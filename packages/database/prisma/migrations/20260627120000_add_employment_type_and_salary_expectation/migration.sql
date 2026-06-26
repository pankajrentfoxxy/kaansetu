-- Quick-profile: capture employment type + expected salary band on the worker's skill.
-- Additive, safe.
ALTER TABLE "WorkerSkill" ADD COLUMN "employment_type" VARCHAR(20);
ALTER TABLE "WorkerSkill" ADD COLUMN "expected_salary_min" INTEGER;
ALTER TABLE "WorkerSkill" ADD COLUMN "expected_salary_max" INTEGER;
