/**
 * Gera a narrativa de um relatorio pela linha de comando.
 *
 *   npm run relatorio:gerar -- <token> [--forcar]
 *
 * Existe porque a geracao custa dinheiro e ainda nao tem dono na interface:
 * quem dispara e um operador com acesso ao banco e a chave, nao um clique
 * anonimo. Ver o cabecalho de persistir.ts.
 */
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const MOTIVO: Record<string, string> = {
  invalido: "token nao encontrado",
  nao_concluido: "o assessment ainda nao foi concluido",
  sem_contadores: "o assessment esta concluido mas sem os contadores",
};

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const token = args.find((arg) => !arg.startsWith("--"));
  const forcar = args.includes("--forcar");

  if (!token) {
    console.error("Uso: npm run relatorio:gerar -- <token> [--forcar]");
    process.exitCode = 1;
    return;
  }

  // Importado aqui dentro, e nao no topo: `@/lib/db` le DATABASE_URL assim que
  // e avaliado, e um import estatico correria antes do config() acima.
  const { gerarESalvar } = await import("./persistir");

  const resultado = await gerarESalvar(token, { forcar });

  if (!resultado.ok) {
    console.error(`Nao foi possivel gerar: ${MOTIVO[resultado.erro] ?? resultado.erro}`);
    process.exitCode = 1;
    return;
  }

  if (resultado.reaproveitada) {
    console.log(`Ja existe narrativa (v${resultado.versao}). Use --forcar para gerar outra.`);
    return;
  }

  console.log(`Narrativa gravada como v${resultado.versao} do token ${token}.`);
  console.log(`  ${resultado.narrativa.fraseDoPerfil}`);
}

main()
  .catch((erro) => {
    console.error(erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  })
  // O pool do Postgres segura o processo aberto depois do trabalho terminar.
  .finally(() => process.exit(process.exitCode ?? 0));
