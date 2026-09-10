-- Escopo do dono do assessment, na CHAVE.
--
-- A partir do Envio Rapido `assessments.turma_id` deixa de ser sempre nulo, e a
-- pergunta "esta turma e do mesmo parceiro do mapa?" passa a existir de fato. A
-- action ja recusa a turma alheia, mas WHERE alguem esquece de escrever no
-- proximo caminho de gravacao; chave nao. Esta FK aponta o par
-- (turma_id, facilitador_id) para `uq_turmas_id_facilitador`, exatamente como
-- `fk_devolutivas_assessment_dono` faz na 0008.
--
-- Aditiva e segura sobre o dado que ja existe: MATCH SIMPLE nao checa par com
-- nulo, e todo assessment de hoje tem `turma_id` nulo.

ALTER TABLE "assessments" ADD CONSTRAINT "fk_assessments_turma_dono" FOREIGN KEY ("turma_id","facilitador_id") REFERENCES "public"."turmas"("id","facilitador_id") ON DELETE restrict ON UPDATE no action;