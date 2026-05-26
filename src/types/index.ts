export type StatusAgendamento = 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO'

export interface Estabelecimento {
  id: string
  nome: string
  slug: string
  email: string
  telefone?: string
  descricao?: string
  foto?: string
  horarioFuncionamento?: HorarioFuncionamento
}

export interface HorarioFuncionamento {
  seg?: DiaSemana
  ter?: DiaSemana
  qua?: DiaSemana
  qui?: DiaSemana
  sex?: DiaSemana
  sab?: DiaSemana
  dom?: DiaSemana
}

export interface DiaSemana {
  inicio: string
  fim: string
  ativo: boolean
}

export interface Servico {
  id: string
  nome: string
  descricao?: string
  duracao: number
  preco: number
  ativo: boolean
}

export interface Profissional {
  id: string
  nome: string
  foto?: string
  ativo: boolean
}

export interface Cliente {
  id: string
  nome: string
  email: string
  telefone?: string
}

export interface Agendamento {
  id: string
  data: Date
  status: StatusAgendamento
  observacao?: string
  cliente: Cliente
  servico: Servico
  profissional?: Profissional
}