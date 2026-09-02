ALTER TABLE "usuarios" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments" ALTER COLUMN "expira_em" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments" ALTER COLUMN "concluido_em" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "assessments" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "assessments" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments_relatorios" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments_relatorios" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "assessments_relatorios" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments_relatorios" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "assessments_relatorios" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments_respostas" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments_respostas" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "assessments_respostas" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "assessments_respostas" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "assessments_respostas" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "creditos_transacoes" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "creditos_transacoes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "creditos_transacoes" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "creditos_transacoes" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "creditos_transacoes" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "auditoria" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "auditoria" ALTER COLUMN "created_at" SET DEFAULT now();