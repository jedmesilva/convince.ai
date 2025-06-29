-- Migration to update time_balances table structure
-- From: payment-based records to single balance per user

-- Step 1: Create a temporary table with the new structure
CREATE TABLE "time_balances_new" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "convincer_id" uuid NOT NULL,
  "total_time_seconds" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "time_balances_new_convincer_id_unique" UNIQUE("convincer_id")
);

-- Step 2: Migrate existing data - sum all time balances per user
INSERT INTO "time_balances_new" ("convincer_id", "total_time_seconds", "status", "created_at", "updated_at")
SELECT 
  "convincer_id",
  SUM("amount_time_seconds") as "total_time_seconds",
  'active' as "status",
  MIN("created_at") as "created_at",
  MAX("updated_at") as "updated_at"
FROM "time_balances"
WHERE "status" = 'active'
GROUP BY "convincer_id";

-- Step 3: Drop the old table and rename the new one
DROP TABLE "time_balances";
ALTER TABLE "time_balances_new" RENAME TO "time_balances";

-- Step 4: Add foreign key constraint
ALTER TABLE "time_balances" 
ADD CONSTRAINT "time_balances_convincer_id_convincers_id_fk" 
FOREIGN KEY ("convincer_id") REFERENCES "convincers"("id") ON DELETE no action ON UPDATE no action;

-- Step 5: Create index for better performance
CREATE INDEX "idx_time_balances_convincer_id" ON "time_balances"("convincer_id");