-- compliance:drop-revisado — DROP COLUMN destrutivo, revisado e autorizado pelo
-- Maestro na auditoria de banco. Justificativa e guard abaixo.
--
-- A senha saiu de `usuarios` para `contas`, que e onde o Better Auth guarda
-- credencial (ADR-0004). NAO existe backfill de proposito: o hash antigo e do
-- scrypt proprio do projeto (formato scrypt$sal$hash, ADR-0003, substituido) e o
-- Better Auth grava em outro formato. Copiar a coluna preservaria o dado e
-- quebraria o login do mesmo jeito, so que silenciosamente e com aparencia de
-- migracao bem-sucedida. Migration que mente e pior que migration que quebra.
--
-- Por isso o guard aborta em vez de converter: em banco novo `usuarios` esta
-- vazia e a migration passa; em banco vindo de antes da troca de auth ela para e
-- obriga uma decisao consciente sobre as senhas, que precisam ser redefinidas.
DO $guard$
BEGIN
  IF EXISTS (SELECT 1 FROM "usuarios" WHERE "senha_hash" IS NOT NULL) THEN
    RAISE EXCEPTION 'Migration 0004 abortada: ha senha gravada em usuarios.senha_hash.'
      USING
        DETAIL = 'Esta migration APAGA a coluna usuarios.senha_hash e nao copia nada para contas.senha_hash. O hash antigo e do scrypt proprio do projeto (scrypt$sal$hash, ADR-0003); o Better Auth usa outro formato e nao consegue verificar esse valor. Copiar preservaria o dado e quebraria o login do mesmo jeito, sem ninguem perceber.',
        HINT = 'As senhas antigas nao servem mais e precisam ser redefinidas. Passo a passo: 1) guarde um dump da coluna (pg_dump -t usuarios) antes de qualquer coisa; 2) gere credencial nova de cada usuario com definirSenha(), que grava em contas pelo Better Auth, ou dispare recuperacao de senha para todos; 3) confirme o login de pelo menos um usuario; 4) so entao rode UPDATE usuarios SET senha_hash = NULL, que libera esta migration.';
  END IF;
END
$guard$;--> statement-breakpoint
ALTER TABLE "usuarios" DROP COLUMN "senha_hash";
