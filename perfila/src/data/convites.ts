/**
 * Convites de assessment
 * ----------------------
 * Cada avaliado recebe um link único com token. Não há cadastro nem
 * login: o token é a credencial, e ele expira em 7 dias.
 *
 * Aqui os convites são fixos, para o protótipo. Numa base real esta
 * consulta vira um SELECT na tabela `assessments` pelo token.
 */

export type SituacaoConvite = 'pendente' | 'em_andamento' | 'concluido' | 'expirado'

/** Tipos de relatório e quantos créditos cada um consome. */
export type TipoRelatorio = 'S1' | 'S2' | 'S3' | 'S4'

export type Convite = {
  token: string
  avaliadoNome: string
  avaliadoEmail: string
  facilitador: string
  tipoRelatorio: TipoRelatorio
  situacao: SituacaoConvite
  /** Data em que o link deixa de valer. */
  expiraEm: string
}

export const convites: Convite[] = [
  {
    token: 'demo',
    avaliadoNome: 'Paulo V S Melo',
    avaliadoEmail: 'contatopaulonvr@gmail.com',
    facilitador: 'Valmer Albuquerque dos Santos',
    tipoRelatorio: 'S2',
    situacao: 'pendente',
    expiraEm: '09/09/2026',
  },
  {
    token: 'expirado',
    avaliadoNome: 'Fernando Brambilla',
    avaliadoEmail: 'fernandobrambilla@hotmail.com',
    facilitador: 'Valmer Albuquerque dos Santos',
    tipoRelatorio: 'S1',
    situacao: 'expirado',
    expiraEm: '20/08/2026',
  },
]

export function getConvite(token: string): Convite | undefined {
  return convites.find((convite) => convite.token === token)
}
