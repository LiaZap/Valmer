import type { Metadata } from 'next'
import { MarcaImpacto } from '@/components/layout/MarcaImpacto'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: 'Impacto Academy · Mapa Comportamental',
  description: 'Responda o mapa comportamental e receba o seu perfil.',
}

/**
 * Moldura do avaliado.
 *
 * Aqui não existe menu, busca nem conta: quem chega veio por um link
 * único e tem uma única tarefa. Tudo que não ajuda a responder as
 * questões fica de fora — inclusive a navegação.
 */
export default function AvaliacaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.pagina}>
      <header className={styles.topo}>
        <span className={styles.marca}>
          <MarcaImpacto size={16} cor="var(--color-marca-sobre-escuro)" />
        </span>
        <span className={styles.nome}>Impacto Academy</span>
      </header>

      <main className={styles.conteudo}>{children}</main>

      <footer className={styles.rodape}>
        Suas respostas são usadas apenas para gerar o seu relatório comportamental.
      </footer>
    </div>
  )
}
