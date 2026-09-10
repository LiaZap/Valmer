-- Qual nivel de relatorio o parceiro oferece como amostra na tela
-- /facilitador/degustacao.
--
-- NOT NULL sobre tabela COM DADO (homologacao ja tem usuarios), entao a coluna
-- nasce com DEFAULT 'S1' — o nivel de entrada, que e o que se oferece de graca.
-- Sem o DEFAULT o ALTER morreria no primeiro ambiente com linha gravada.
--
-- A escolha nao muda cobranca nenhuma: degustacao custa 1 amostra de
-- usuarios.creditos_degustacao em qualquer nivel, e grava creditos_usados = 0.
ALTER TABLE "usuarios" ADD COLUMN "degustacao_relatorio" "tipo_relatorio" DEFAULT 'S1' NOT NULL;