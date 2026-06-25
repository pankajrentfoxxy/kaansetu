-- Multiple nearby service locations per job posting. Additive, safe.
ALTER TABLE "Requirement" ADD COLUMN "service_areas" JSONB;
