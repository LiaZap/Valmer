CREATE TABLE "auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"acao" text NOT NULL,
	"tabela" text NOT NULL,
	"registro_id" uuid NOT NULL,
	"detalhes" text NOT NULL,
	"dados_anteriores" text,
	"dados_novos" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_auditoria_registro" ON "auditoria" USING btree ("tabela","registro_id");--> statement-breakpoint
CREATE INDEX "idx_auditoria_usuario" ON "auditoria" USING btree ("user_id");