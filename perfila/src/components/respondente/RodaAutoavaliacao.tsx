import { areasMapa } from '@/data/respondente'
import styles from './RodaAutoavaliacao.module.css'

/** Cinco degraus da rampa sequencial verde, do mais claro ao mais escuro. */
const RAMPA = [
  'var(--chart-seq-1)',
  'var(--chart-seq-2)',
  'var(--chart-seq-3)',
  'var(--chart-seq-4)',
  'var(--chart-seq-5)',
]

const CENTRO = 200
const RAIO_INTERNO = 46
const RAIO_MAXIMO = 148
const RAIO_ROTULO = 168
const NOTA_MAXIMA = 10

function ponto(anguloGraus: number, raio: number) {
  const rad = ((anguloGraus - 90) * Math.PI) / 180
  return { x: CENTRO + raio * Math.cos(rad), y: CENTRO + raio * Math.sin(rad) }
}

/** Setor de anel entre dois ângulos, do raio interno ao externo. */
function setor(inicio: number, fim: number, raioExterno: number) {
  const a = ponto(inicio, RAIO_INTERNO)
  const b = ponto(inicio, raioExterno)
  const c = ponto(fim, raioExterno)
  const d = ponto(fim, RAIO_INTERNO)
  const arco = fim - inicio > 180 ? 1 : 0

  return [
    `M ${a.x} ${a.y}`,
    `L ${b.x} ${b.y}`,
    `A ${raioExterno} ${raioExterno} 0 ${arco} 1 ${c.x} ${c.y}`,
    `L ${d.x} ${d.y}`,
    `A ${RAIO_INTERNO} ${RAIO_INTERNO} 0 ${arco} 0 ${a.x} ${a.y}`,
    'Z',
  ].join(' ')
}

/**
 * RodaAutoavaliacao
 * -----------------
 * As onze áreas da vida dispostas em círculo. Cada setor cresce do
 * centro para a borda conforme a nota de 0 a 10, e escurece na
 * mesma medida — raio e cor dizem a mesma coisa, o que mantém a
 * leitura correta em preto e branco e para quem não distingue cores.
 *
 * Sem notas, a roda vira só o contorno: um convite a preencher.
 */
export function RodaAutoavaliacao({
  notas = {},
}: {
  /** Nota de 0 a 10 por id de área. */
  notas?: Record<string, number>
}) {
  const passo = 360 / areasMapa.length

  return (
    <figure className={styles.figura}>
      <svg viewBox="0 0 400 400" className={styles.svg} role="img" aria-label="Mapa de autoavaliação por área da vida">
        {/* Contorno externo e miolo vazado */}
        <circle cx={CENTRO} cy={CENTRO} r={RAIO_MAXIMO} className={styles.aro} />
        <circle cx={CENTRO} cy={CENTRO} r={RAIO_INTERNO} className={styles.aro} />

        {areasMapa.map((area, indice) => {
          const meio = indice * passo
          const inicio = meio - passo / 2
          const fim = meio + passo / 2
          const nota = notas[area.id] ?? 0
          const proporcao = Math.max(0, Math.min(1, nota / NOTA_MAXIMA))

          // Divisória entre as áreas.
          const limite = ponto(inicio, RAIO_MAXIMO)
          const rotulo = ponto(meio, RAIO_ROTULO)
          const marca = ponto(meio, RAIO_MAXIMO)

          // Uma linha de texto por palavra evita colisão nas laterais.
          const ancora = Math.abs(rotulo.x - CENTRO) < 24 ? 'middle' : rotulo.x > CENTRO ? 'start' : 'end'

          return (
            <g key={area.id}>
              {proporcao > 0 ? (
                <path
                  d={setor(inicio + 0.6, fim - 0.6, RAIO_INTERNO + (RAIO_MAXIMO - RAIO_INTERNO) * proporcao)}
                  fill={RAMPA[Math.min(RAMPA.length - 1, Math.ceil(proporcao * RAMPA.length) - 1)]}
                />
              ) : null}

              <line
                x1={ponto(inicio, RAIO_INTERNO).x}
                y1={ponto(inicio, RAIO_INTERNO).y}
                x2={limite.x}
                y2={limite.y}
                className={styles.divisoria}
              />
              <circle cx={marca.x} cy={marca.y} r={2.5} className={styles.marca} />
              <text x={rotulo.x} y={rotulo.y} textAnchor={ancora} dominantBaseline="middle" className={styles.rotulo}>
                {area.nome}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}
