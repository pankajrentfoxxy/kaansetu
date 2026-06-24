-- Match.applied_at — persist worker applications server-side
-- (powers social proof "N applied" + the Applications tab). Additive, safe.

ALTER TABLE "Match" ADD COLUMN "applied_at" TIMESTAMP(3);
