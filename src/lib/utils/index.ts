import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarPreco(preco: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(preco)
}

export function formatarDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const min = minutos % 60
  return min > 0 ? `${horas}h ${min}min` : `${horas}h`
}

export function formatarDataHora(data: Date): string {
  return format(data, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
}

export function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function gerarHorarios(
  inicio: string,
  fim: string,
  duracaoServico: number,
  horariosOcupados: string[] = []
): string[] {
  const horarios: string[] = []
  const [hIni, mIni] = inicio.split(':').map(Number)
  const [hFim, mFim] = fim.split(':').map(Number)

  let atual = new Date()
  atual.setHours(hIni, mIni, 0, 0)

  const limite = new Date()
  limite.setHours(hFim, mFim, 0, 0)

  while (atual < limite) {
    const horario = format(atual, 'HH:mm')
    if (!horariosOcupados.includes(horario)) {
      horarios.push(horario)
    }
    atual = addMinutes(atual, duracaoServico)
  }

  return horarios
}

export function corStatus(status: string): string {
  const cores: Record<string, string> = {
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    CONFIRMADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
    CONCLUIDO: 'bg-gray-100 text-gray-800',
  }
  return cores[status] ?? 'bg-gray-100 text-gray-800'
}

export function labelStatus(status: string): string {
  const labels: Record<string, string> = {
    PENDENTE: 'Pendente',
    CONFIRMADO: 'Confirmado',
    CANCELADO: 'Cancelado',
    CONCLUIDO: 'Concluído',
  }
  return labels[status] ?? status
}