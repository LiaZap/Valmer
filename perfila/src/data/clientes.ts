/** Base de clientes do analista. */

import { initials } from '@/lib/text'

export type Cliente = {
  name: string
  email: string
  celular: string
  /** Último acesso à plataforma — "—" quando nunca acessou. */
  ultimoLogin: string
  iniciais: string
}

const clientesBase: Omit<Cliente, 'iniciais'>[] = [
  {
    name: 'Augusto Ribeiro',
    email: 'guto.ribeiro.umr@gmail.com',
    celular: '(44) 99185-1777',
    ultimoLogin: '—',
  },
  {
    name: 'Vantuir Pizani Antonio Junior',
    email: 'vantuir.pizani@gmail.com',
    celular: '(45) 99986-4336',
    ultimoLogin: '—',
  },
  {
    name: 'Murilo Fernando Alves',
    email: 'murilo.ducatti@hotmail.com',
    celular: '(44) 99968-9395',
    ultimoLogin: '—',
  },
  {
    name: 'Karine Oliveira Evangelista Strassacappa',
    email: 'karineoe17@hotmail.com',
    celular: '(44) 99102-2311',
    ultimoLogin: '24/05/2023 14:57',
  },
  {
    name: 'Valmer Albuquerque dos Santos',
    email: 'valmersantos1@gmail.com',
    celular: '(44) 99185-5998',
    ultimoLogin: '01/09/2026 15:57',
  },
]

export const clientes: Cliente[] = clientesBase.map((cliente) => ({
  ...cliente,
  iniciais: initials(cliente.name),
}))

/** Total cadastrado na base (maior que a página exibida). */
export const totalClientes = 227
