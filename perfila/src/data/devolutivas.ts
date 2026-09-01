/** Devolutiva — sessões de feedback com os respondentes. */

export type StatusDevolutiva = 'Finalizada' | 'Pausado'

export type Devolutiva = {
  id: string
  name: string
  email: string
  /** Campanha (passaporte) de origem. */
  campanha: string
  status: StatusDevolutiva
  /** Duração da sessão — vazio enquanto não finalizada. */
  tempo: string
  date: string
}

export const devolutivas: Devolutiva[] = [
  {
    id: 'fernando-brambilla',
    name: 'Fernando Brambilla',
    email: 'fernandobrambilla@hotmail.com',
    campanha: 'Câmara de Maringá',
    status: 'Pausado',
    tempo: '',
    date: '18/08/2026 às 10:14',
  },
  {
    id: 'soni-antonio',
    name: 'Soni Antonio',
    email: 'sonirlerin@gmail.com',
    campanha: 'Capacitação Sarandi',
    status: 'Finalizada',
    tempo: '02:01:14',
    date: '18/06/2026 às 13:42',
  },
  {
    id: 'israel',
    name: 'Israel',
    email: 'israelelves077@gmail.com',
    campanha: 'Clientes 2026',
    status: 'Finalizada',
    tempo: '03:00:00',
    date: '23/01/2026 às 08:37',
  },
  {
    id: 'daniel-lebrao-rocha',
    name: 'Daniel Lebrão Rocha',
    email: 'dlebraoo@gmail.com',
    campanha: 'Clientes 2026',
    status: 'Pausado',
    tempo: '',
    date: '22/01/2026 às 15:15',
  },
  {
    id: 'michelly-meireles',
    name: 'Michelly Meireles',
    email: 'michelly@gmail.com',
    campanha: 'Clientes 2026',
    status: 'Finalizada',
    tempo: '01:45:10',
    date: '21/01/2026 às 14:59',
  },
]

/** Tipo de relatório aplicado a todos os passaportes destas devolutivas. */
export const TIPO_RELATORIO = 'DISC + Tipos Psicológicos + Valores'
