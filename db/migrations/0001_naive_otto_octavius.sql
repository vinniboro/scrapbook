CREATE INDEX "connect_tokens_user_id_idx" ON "connect_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "redeem_attempts_bucket_created_idx" ON "redeem_attempts" USING btree ("bucket","created_at");--> statement-breakpoint
CREATE INDEX "scraps_author_created_idx" ON "scraps" USING btree ("author_id","created_at","id");--> statement-breakpoint
CREATE INDEX "scraps_created_idx" ON "scraps" USING btree ("created_at","id");--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_ordered" CHECK ("connections"."user_a_id" < "connections"."user_b_id");--> statement-breakpoint
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_type_check" CHECK ("scraps"."type" in ('text', 'image'));--> statement-breakpoint
ALTER TABLE "scraps" ADD CONSTRAINT "scraps_visibility_check" CHECK ("scraps"."visibility" in ('public', 'private'));