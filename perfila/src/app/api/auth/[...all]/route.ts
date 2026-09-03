/**
 * Endpoints do Better Auth: entrar, sair, sessão, troca de senha.
 *
 * É a única rota de API do projeto. Todo o resto fala com o servidor por
 * Server Actions e Server Components; aqui a rota existe porque a biblioteca
 * precisa de um endpoint HTTP próprio.
 */
import { auth } from '@/lib/auth/config'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
