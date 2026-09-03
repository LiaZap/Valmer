CREATE TABLE "contas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"conta_externa_id" text NOT NULL,
	"provedor" text NOT NULL,
	"emissor" text NOT NULL,
	"senha_hash" text,
	"access_token" text,
	"refresh_token" text,
	"access_token_expira_em" timestamp (3) with time zone,
	"refresh_token_expira_em" timestamp (3) with time zone,
	"escopo" text,
	"id_token" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expira_em" timestamp (3) with time zone NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verificacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identificador" text NOT NULL,
	"valor" text NOT NULL,
	"expira_em" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"modified_by" uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "email_verificado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "imagem" text;--> statement-breakpoint
ALTER TABLE "contas" ADD CONSTRAINT "contas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_contas_emissor_conta" ON "contas" USING btree ("emissor","conta_externa_id");--> statement-breakpoint
CREATE INDEX "idx_contas_usuario" ON "contas" USING btree ("usuario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_sessoes_token" ON "sessoes" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_sessoes_usuario" ON "sessoes" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "idx_verificacoes_identificador" ON "verificacoes" USING btree ("identificador");