-- Salary is now optional on a job posting (employers may leave it negotiable).
-- Widening NOT NULL → nullable is safe and non-destructive.

ALTER TABLE "Requirement" ALTER COLUMN "salary_min" DROP NOT NULL;
ALTER TABLE "Requirement" ALTER COLUMN "salary_max" DROP NOT NULL;
