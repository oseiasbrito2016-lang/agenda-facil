'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatarPreco, labelStatus } from '@/lib/utils'
import { usePreferences } from '@/lib/preferences'

function formatarDataBR(dataISO: string): string {
  return new Date(dataISO).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}
function formatarHoraBR(dataISO: string): string {
  return new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

const PAGAMENTO_LABEL: Record<string, { emoji: string; label: string }> = {
  dinheiro: { emoji: '💵', label: 'Dinheiro' },
  pix:      { emoji: '📱', label: 'Pix' },
  cartao:   { emoji: '💳', label: 'Cartão' },
}

export default function Agendamentos() {
  const router = useRouter()
  const supabase = createClient()
  const { darkMode, t } = usePreferences()

  const bg = darkMode ? '#0f0f0f' : '#F5F5F2'
  const bg2 = darkMode ? '#1a1a1a' : '#fff'
  const border = darkMode ? '#2a2a2a' : '#eee'
  const text = darkMode ? '#f0f0f0' : '#0A0A0A'
  const text2 = darkMode ? '#aaa' : '#666'

  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('TODOS')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: estab } = await supabase.from('estabelecimentos').select('id').eq('userId', user.id).single()
    if (!estab) { setCarregando(false); return }
    const { data } = await supabase.from('agendamentos').select('*, cliente:clientes(*), servico:servicos(*), profissional:profissionais(*)').eq('estabelecimentoId', estab.id).order('data', { ascending: false })
    setAgendamentos(data ?? [])
    setCarregando(false)
  }

  async function atualizarStatus(id: string, status: string) {
    await supabase.from('agendamentos').update({ status }).eq('id', id)
    carregar()
  }

  async function excluir(id: string, status: string) {
    const confirmado = window.confirm(status === 'CONFIRMADO' || status === 'CONCLUIDO' ? 'Este agendamento será excluído e o valor será descontado do faturamento. Confirma?' : 'Tem certeza que deseja excluir este agendamento?')
    if (!confirmado) return
    await supabase.from('agendamentos').delete().eq('id', id)
    carregar()
  }

  const filtrados = filtro === 'TODOS' ? agendamentos : agendamentos.filter(a => a.status === filtro)
  const filtros = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Pendentes', value: 'PENDENTE' },
    { label: 'Confirmados', value: 'CONFIRMADO' },
    { label: 'Concluídos', value: 'CONCLUIDO' },
    { label: 'Cancelados', value: 'CANCELADO' },
  ]

  const badgeStyle: Record<string, { bg: string; color: string }> = {
    PENDENTE:   { bg: darkMode ? '#2a1f00' : '#fef9c3', color: '#854d0e' },
    CONFIRMADO: { bg: darkMode ? '#052e16' : '#dcfce7', color: '#166534' },
    CONCLUIDO:  { bg: darkMode ? '#1f2937' : '#f3f4f6', color: darkMode ? '#9ca3af' : '#374151' },
    CANCELADO:  { bg: darkMode ? '#2d0a0a' : '#fee2e2', color: '#991b1b' },
  }

  return (
    <main style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", padding: '40px 32px', background: bg, transition: 'background .2s' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap'); * { box-sizing: border-box; } .filtro-btn { transition: all .15s; cursor: pointer; } .filtro-btn:hover { border-color: #00C27C !important; color: #00C27C !important; }`}</style>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: text }}>{t('agendamentos')}</h1>
        <p style={{ color: text2, fontSize: 14, marginTop: 4 }}>Gerencie todos os agendamentos do seu estabelecimento</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {filtros.map(f => (
          <button key={f.value} className="filtro-btn" onClick={() => setFiltro(f.value)}
            style={{ padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500, border: '1.5px solid ' + (filtro === f.value ? '#00C27C' : border), background: filtro === f.value ? '#00C27C' : bg2, color: filtro === f.value ? '#fff' : text2 }}>
            {f.label} <span style={{ marginLeft: 6, fontSize: 11, opacity: .8 }}>({f.value === 'TODOS' ? agendamentos.length : agendamentos.filter(a => a.status === f.value).length})</span>
          </button>
        ))}
      </div>

      {carregando ? (
        <div style={{ textAlign: 'center', padding: 60, color: text2 }}>Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: bg2, borderRadius: 16, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📅</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: text, marginBottom: 8 }}>Nenhum agendamento</h3>
          <p style={{ fontSize: 14, color: text2 }}>Compartilhe seu link para começar a receber agendamentos.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtrados.map(a => {
            const badge = badgeStyle[a.status] ?? { bg: '#f3f4f6', color: '#374151' }
            const pgto = a.forma_pagamento ? PAGAMENTO_LABEL[a.forma_pagamento] : null
            return (
              <div key={a.id} style={{ background: bg2, borderRadius: 12, padding: '20px 24px', border: `1px solid ${border}`, transition: 'background .2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: text }}>{a.cliente?.nome}</div>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>{labelStatus(a.status)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: text2 }}>{a.cliente?.email}</div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: text }}>✂️ {a.servico?.nome}</span>
                      {a.profissional && <span style={{ fontSize: 13, color: text }}>👤 {a.profissional?.nome}</span>}
                      <span style={{ fontSize: 13, color: text }}>📅 {formatarDataBR(a.data)} às {formatarHoraBR(a.data)}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#00C27C' }}>{formatarPreco(a.servico?.preco ?? 0)}</span>
                      {pgto && <span style={{ fontSize: 12, fontWeight: 600, background: darkMode ? '#2a2a2a' : '#f3f4f6', color: darkMode ? '#ccc' : '#374151', padding: '3px 10px', borderRadius: 100 }}>{pgto.emoji} {pgto.label}</span>}
                    </div>
                    {a.observacao && <div style={{ marginTop: 8, fontSize: 13, color: text2 }}>💬 {a.observacao}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {a.status === 'PENDENTE' && (<>
                      <button onClick={() => atualizarStatus(a.id, 'CONFIRMADO')} style={{ background: '#00C27C', color: '#fff', padding: '8px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none' }}>✓ Confirmar</button>
                      <button onClick={() => atualizarStatus(a.id, 'CANCELADO')} style={{ background: 'transparent', border: '1.5px solid #fecaca', color: '#dc2626', padding: '8px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer' }}>✕ Cancelar</button>
                    </>)}
                    {a.status === 'CONFIRMADO' && <button onClick={() => atualizarStatus(a.id, 'CONCLUIDO')} style={{ background: '#6366f1', color: '#fff', padding: '8px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none' }}>✓ Concluir</button>}
                    <button onClick={() => excluir(a.id, a.status)} style={{ background: bg2, border: '1.5px solid #fecaca', color: '#dc2626', padding: '8px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer' }}>🗑 Excluir</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}