-- Guarda da invariante do saldo de creditos, no banco.
--
-- `usuarios.creditos` e materializacao da soma das linhas ativas de
-- `creditos_transacoes` do usuario (ver schema/creditos.ts). Ate aqui isso valia
-- por convencao: existia UM escritor, `actions/assessments.ts:criar`, e ele fazia
-- as duas escritas na mesma transacao. Nada no banco impedia o proximo escritor
-- — a tela de compra de creditos, ainda por escrever — de mexer no saldo sem
-- gravar o extrato. O dinheiro do facilitador nao pode depender de ninguem
-- esquecer.
--
-- A checagem e CONSTRAINT TRIGGER DEFERRABLE INITIALLY DEFERRED: roda no COMMIT,
-- nao a cada comando. Dentro da transacao a ordem nao importa (atualizar o saldo
-- antes ou depois de inserir a linha do extrato da no mesmo); o que precisa
-- fechar e o estado final. E vale para QUALQUER caminho de escrita, inclusive um
-- UPDATE na mao pelo psql.

-- Instalar a guarda sobre dado ja torto so adiaria a falha para a proxima
-- escrita, num lugar sem relacao com a causa. Entao confere antes.
DO $checagem$
DECLARE
  tortos text;
BEGIN
  SELECT string_agg(
           format('%s (creditos=%s, extrato=%s)', u.email, u.creditos, COALESCE(s.total, 0)),
           '; ' ORDER BY u.email)
    INTO tortos
    FROM public.usuarios u
    LEFT JOIN (
      SELECT usuario_id, SUM(quantidade) AS total
        FROM public.creditos_transacoes
       WHERE is_deleted = false
       GROUP BY usuario_id
    ) s ON s.usuario_id = u.id
   WHERE u.creditos <> COALESCE(s.total, 0);

  IF tortos IS NOT NULL THEN
    RAISE EXCEPTION 'Migration 0005 abortada: ha saldo divergente do extrato antes mesmo da guarda existir.'
      USING
        DETAIL = 'Fora da invariante: ' || tortos,
        HINT = 'Reconcilie antes de instalar a guarda. Para cada usuario listado, decida qual lado esta certo: se o extrato explica o saldo real, ajuste usuarios.creditos para a soma; se faltou registrar um movimento, insira a linha em creditos_transacoes (tipo compra, bonus ou estorno) com a descricao do que aconteceu. Nunca ajuste os dois lados no escuro.';
  END IF;
END
$checagem$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.saldo_bate_com_extrato() RETURNS trigger
LANGUAGE plpgsql AS $fn$
DECLARE
  alvos uuid[];
  alvo uuid;
  materializado integer;
  extrato integer;
BEGIN
  -- De quem e o saldo que esta operacao pode ter mexido.
  IF TG_TABLE_NAME = 'usuarios' THEN
    alvos := ARRAY[COALESCE(NEW.id, OLD.id)];
  ELSIF TG_OP = 'INSERT' THEN
    alvos := ARRAY[NEW.usuario_id];
  ELSIF TG_OP = 'DELETE' THEN
    alvos := ARRAY[OLD.usuario_id];
  ELSE
    -- UPDATE pode ter movido a linha de um usuario para outro: os dois saldos
    -- mudaram, e conferir so o destino deixaria a origem torta.
    alvos := ARRAY[OLD.usuario_id, NEW.usuario_id];
  END IF;

  FOREACH alvo IN ARRAY alvos LOOP
    SELECT u.creditos INTO materializado FROM public.usuarios u WHERE u.id = alvo;
    CONTINUE WHEN NOT FOUND;

    SELECT COALESCE(SUM(t.quantidade), 0) INTO extrato
      FROM public.creditos_transacoes t
     WHERE t.usuario_id = alvo AND t.is_deleted = false;

    IF materializado <> extrato THEN
      RAISE EXCEPTION 'Saldo de creditos nao bate com o extrato (usuario %)', alvo
        USING
          DETAIL = format('usuarios.creditos = %s, mas a soma de creditos_transacoes ativas = %s.', materializado, extrato),
          HINT = 'O saldo e materializacao do extrato, nao um numero independente. Quem move o saldo grava a transacao na MESMA operacao, e quem grava a transacao move o saldo. Se a intencao era conceder ou estornar credito, inclua a linha em creditos_transacoes (tipo compra, bonus ou estorno) junto do UPDATE em usuarios.creditos. A checagem e DEFERRABLE: a ordem dentro da transacao nao importa, so o estado no COMMIT.';
    END IF;
  END LOOP;

  RETURN NULL;
END
$fn$;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_saldo_extrato_transacoes
  AFTER INSERT OR UPDATE OR DELETE ON public.creditos_transacoes
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.saldo_bate_com_extrato();--> statement-breakpoint
CREATE CONSTRAINT TRIGGER trg_saldo_extrato_usuarios
  AFTER INSERT OR UPDATE OF creditos ON public.usuarios
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.saldo_bate_com_extrato();
