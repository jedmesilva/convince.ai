CREATE TABLE "convincing_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer,
	"level" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"is_user" boolean NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"session_id" text NOT NULL,
	"attempt_id" integer
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"session_id" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text NOT NULL,
	"method" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persuasion_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_id" text NOT NULL,
	"status" text DEFAULT 'failed' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persuasion_timers" (
	"id" serial PRIMARY KEY NOT NULL,
	"attempt_id" integer,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"duration_seconds" integer DEFAULT 300 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prize_pools" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"amount" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"method" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "convincing_levels" ADD CONSTRAINT "convincing_levels_attempt_id_persuasion_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."persuasion_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_attempt_id_persuasion_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."persuasion_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persuasion_attempts" ADD CONSTRAINT "persuasion_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persuasion_timers" ADD CONSTRAINT "persuasion_timers_attempt_id_persuasion_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."persuasion_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;