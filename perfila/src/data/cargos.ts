/** Arquitetura de Cargos — perfil comportamental ideal por posição. */

export type Cargo = {
  id: string
  name: string
  by: string
  date: string
}

export const cargos: Cargo[] = [
  {
    id: 'consultora-vendas-maquiagem',
    name: 'Consultora de Vendas de Maquiagem',
    by: 'Valmer Albuquerque dos Santos',
    date: '07/03/2020 às 17:10',
  },
]
