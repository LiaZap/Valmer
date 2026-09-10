import { Icon } from '@/components/ui/Icon'
import common from '@/styles/common.module.css'

/**
 * Marca uma seção escrita cujo texto ainda não foi gerado.
 *
 * Existe para o relatório poder ser honesto sobre o que falta. A tentação
 * aqui é preencher o buraco com um texto "genérico do perfil": não faça. Todo
 * texto plausível neste lugar descreve outra pessoa, e foi assim que o
 * relatório passou a chamar o avaliado pelo nome de terceiro.
 *
 * Reaproveita o callout de aviso do sistema de design, com a mesma cor de
 * atenção usada nas outras telas: uma seção pendente é estado, não erro, e
 * também não é conteúdo.
 */
export function TextoPendente({ secao }: { secao: string }) {
  return (
    <p className={[common.callout, common.calloutWarning].join(' ')} role="status">
      <span className={common.calloutIcon} aria-hidden>
        <Icon name="info" size={16} />
      </span>
      <span>Pendente: {secao} ainda não foi gerado para este relatório.</span>
    </p>
  )
}
