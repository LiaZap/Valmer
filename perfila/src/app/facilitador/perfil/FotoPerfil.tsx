'use client'

import { useRef, useState, useTransition } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { trocarFotoPelaTela } from '@/lib/actions/perfil'
import ui from '@/styles/common.module.css'
import { Aviso } from './FormPerfil'
import styles from './page.module.css'

/**
 * Foto de perfil: mostra a atual e troca por outra.
 *
 * A URL da foto chega pronta e ASSINADA do Server Component acima — esta tela
 * nunca fala com o armazenamento, e o endereço que ela recebe expira em
 * minutos. Ver `lib/storage.ts`.
 *
 * O `<input type="file">` fica escondido atrás do botão porque o controle nativo
 * não aceita os estilos do sistema e apareceria como o único elemento estranho
 * da tela. O clique é o mesmo; só a aparência é nossa.
 *
 * Quem decide o que entra é o servidor, não este componente: `accept` é
 * conveniência do seletor de arquivo, e o navegador permite ignorá-lo. Tipo,
 * tamanho e conteúdo real são conferidos na action.
 */
export function FotoPerfil({
  foto,
  iniciais,
}: {
  /** URL assinada da foto atual, ou `null` para quem ainda não enviou. */
  foto: string | null
  iniciais: string
}) {
  const { toast } = useToast()
  const seletor = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, enviar] = useTransition()

  function escolheu(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]

    // Limpa o campo antes de enviar: sem isso, escolher o MESMO arquivo de novo
    // — depois de uma recusa, que é justamente quando se tenta de novo — não
    // dispara `change`, e o botão parece ter parado de funcionar.
    evento.target.value = ''
    if (!arquivo) return

    setErro(null)
    const dados = new FormData()
    dados.set('foto', arquivo)

    enviar(async () => {
      const resposta = await trocarFotoPelaTela(dados)
      if (!resposta.ok) {
        setErro(resposta.erro)
        return
      }
      toast('Foto atualizada.')
    })
  }

  return (
    <Card>
      <div className={ui.cardTitle}>Foto</div>

      <div className={styles.foto}>
        <Avatar size="xl" src={foto} alt="Sua foto de perfil">
          {iniciais}
        </Avatar>

        <div className={styles.fotoLado}>
          <p className={ui.note}>
            Aparece na barra superior e aqui. JPEG, PNG ou WebP, até 2 MB. A foto anterior é
            apagada do armazenamento quando você envia uma nova.
          </p>

          <input
            ref={seletor}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={escolheu}
            hidden
          />

          <Button
            type="button"
            variant="secondary"
            disabled={enviando}
            onClick={() => seletor.current?.click()}
          >
            {enviando ? 'Enviando…' : foto ? 'Trocar foto' : 'Enviar foto'}
          </Button>
        </div>
      </div>

      <Aviso mensagem={erro} />
    </Card>
  )
}
