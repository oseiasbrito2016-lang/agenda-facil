'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { usePreferences } from '@/lib/preferences'

export default function Clientes() {
  const router = useRouter()
  const supabase = createClient()
  const { darkMode, t } = usePreferences()

  const bg = darkMode ? '#0f0f0f' : '#F5F5F2'
  const bg2 = darkMode ? '#1a1a1a' : '#fff'
  const border = darkMode ? '#2a2a2a' : '#eee'
  const text = darkMode ? '#f0f0f0' : '#0A0A0A'
  const text2 = darkMode ? '#aaa' : '#666'
  const inputBorder = darkMode ? '#333' : '#e5e7eb'

  const [clientes, setClientes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: estab } = await supabase.from('estabelecimentos').select('id').eq('userId', user.id).single()
    if (!estab) { setCarregando(false); return }
    const { data } = await supabase.from('clientes').select('*, agendamentos(id, status, servico:servicos(nome, preco))').eq('estabelecimentoId', estab.id).order('nome')
    setClientes(data ?? [])
    setCarregando(false)
  }

  async function excluir(id: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o cliente "${nome}"?`)) return
    await supabase.from('agendamentos').delete().eq('clienteId', id)
    await supabase.from('clientes').delete().eq('id', id)
    carregar()
  }

  const filtrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || c.email.toLowerCase().includes(busca.toLowerCase()))

  return (
    <main style={{ minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", padding: '40px 32px', transition: 'background .2s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
        .excluir-btn:hover { background: ${darkMode ? '#2d0a0a' : '#fee2e2'} !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: text }}>{t('clientes')}</h1>
          <p style={{ color: text2, fontSize: 14, marginTop: 4 }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <input type="text" placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 14, width: 220, background: bg2, color: text }} />
      </div>

      {carregando ? (
        <div style={{ textAlign: 'center', padding: 60, color: text2 }}>Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: bg2, borderRadius: 16, border: `1px solid ${border}` }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>👤</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: text, marginBottom: 8 }}>{busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}</h3>
          <p style={{ fontSize: 14, color: text2 }}>{busca ? 'Tente buscar por outro nome ou e-mail.' : 'Os clientes aparecerão aqui quando realizarem agendamentos.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtrados.map(c => {
            const totalAgendamentos = c.agendamentos?.length ?? 0
            const totalGasto = (c.agendamentos ?? []).reduce((acc: number, a: any) => {
              if (a.status === 'CONFIRMADO' || a.status === 'CONCLUIDO') return acc + (a.servico?.preco ?? 0)
              return acc
            }, 0)
            return (
              <div key={c.id} style={{ background: bg2, borderRadius: 12, padding: '20px 24px', border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#00C27C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>👤</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: text }}>{c.nome}</div>
                    <div style={{ fontSize: 13, color: text2, marginTop: 2 }}>{c.email}</div>
                    {c.telefone && <div style={{ fontSize: 13, color: text2 }}>📱 {c.telefone}</div>}
                    <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: text2 }}>📅 {totalAgendamentos} agendamento{totalAgendamentos !== 1 ? 's' : ''}</span>
                      {totalGasto > 0 && <span style={{ fontSize: 12, color: '#00C27C', fontWeight: 600 }}>💰 R$ {totalGasto.toFixed(2).replace('.', ',')} gastos</span>}
                    </div>
                  </div>
                </div>
                <button className="excluir-btn" onClick={() => excluir(c.id, c.nome)} style={{ background: bg2, border: '1.5px solid #fecaca', color: '#dc2626', padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}>🗑 Excluir</button>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}