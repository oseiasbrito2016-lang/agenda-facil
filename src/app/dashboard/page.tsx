'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatarPreco } from '@/lib/utils'

function formatarDataBR(dataISO: string): string {
  return new Date(dataISO).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function formatarHoraBR(dataISO: string): string {
  return new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [usuario, setUsuario] = useState<any>(null)
  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [stats, setStats] = useState({ agendamentosHoje: 0, clientes: 0, faturamento: 0 })
  const [pendentes, setPendentes] = useState<any[]>([])

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setUsuario(user)

    const { data: estab } = await supabase
      .from('estabelecimentos')
      .select('*')
      .eq('userId', user.id)
      .single()

    if (!estab) return
    setEstabelecimento(estab)

    const hoje = new Date()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString()

    const { data: agendamentosHoje } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('estabelecimentoId', estab.id)
      .gte('data', inicioHoje)
      .lt('data', fimHoje)
      .neq('status', 'CANCELADO')

    const { data: clientes } = await supabase
      .from('clientes')
      .select('id')
      .eq('estabelecimentoId', estab.id)

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString()

    const { data: agendamentosMes } = await supabase
      .from('agendamentos')
      .select('servico:servicos(preco)')
      .eq('estabelecimentoId', estab.id)
      .eq('status', 'CONCLUIDO')
      .gte('data', inicioMes)
      .lt('data', fimMes)

    const faturamento = (agendamentosMes ?? []).reduce((acc: number, a: any) => acc + (a.servico?.preco ?? 0), 0)

    const { data: agendsPendentes } = await supabase
      .from('agendamentos')
      .select('*, cliente:clientes(nome), servico:servicos(nome)')
      .eq('estabelecimentoId', estab.id)
      .eq('status', 'PENDENTE')
      .order('data', { ascending: true })
      .limit(5)

    setStats({
      agendamentosHoje: agendamentosHoje?.length ?? 0,
      clientes: clientes?.length ?? 0,
      faturamento,
    })
    setPendentes(agendsPendentes ?? [])
  }

  async function confirmar(id: string) {
    await supabase.from('agendamentos').update({ status: 'CONFIRMADO' }).eq('id', id)
    carregarDados()
  }

  async function cancelar(id: string) {
    await supabase.from('agendamentos').update({ status: 'CANCELADO' }).eq('id', id)
    carregarDados()
  }

  if (!usuario) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666' }}>Carregando...</p>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", padding: '40px 32px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .stat-card { transition: all .2s; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.06) !important; }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: '#0A0A0A' }}>
          {estabelecimento ? 'Olá, ' + estabelecimento.nome + '! 👋' : 'Bem-vindo! 👋'}
        </h1>
        <p style={{ color: '#666', fontSize: 15, marginTop: 6 }}>Aqui está um resumo do seu estabelecimento hoje.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="stat-card" style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>Agendamentos hoje</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#0A0A0A' }}>{stats.agendamentosHoje}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#3b82f615', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📅</div>
          </div>
        </div>

        <div className="stat-card" style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>Clientes cadastrados</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#0A0A0A' }}>{stats.clientes}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ec489915', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👥</div>
          </div>
        </div>

        <div className="stat-card" style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>Faturamento do mês</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#00C27C' }}>{formatarPreco(stats.faturamento)}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#00C27C15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💰</div>
          </div>
        </div>
      </div>

      {/* Notificações pendentes */}
      {pendentes.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>
              Aguardando confirmação
              <span style={{ marginLeft: 8, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>
                {pendentes.length}
              </span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendentes.map(a => (
              <div key={a.id} style={{ background: '#fef9f0', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>{a.cliente?.nome}</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                    ✂️ {a.servico?.nome} · 📅 {formatarDataBR(a.data)} às {formatarHoraBR(a.data)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => confirmar(a.id)} style={{ background: '#00C27C', color: '#fff', padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                    ✓ Confirmar
                  </button>
                  <button onClick={() => cancelar(a.id)} style={{ background: 'transparent', border: '1.5px solid #fecaca', color: '#dc2626', padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer' }}>
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link público */}
      {estabelecimento && (
        <div style={{ background: '#0A0A0A', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Seu link de agendamento</div>
            <div style={{ fontSize: 15, color: '#00C27C', fontWeight: 600 }}>
              {typeof window !== 'undefined' ? window.location.origin : ''}/agendar/{estabelecimento.slug}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/agendar/' + estabelecimento.slug); alert('Link copiado!') }}
              style={{ background: '#fff', color: '#0A0A0A', padding: '10px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
              📋 Copiar
            </button>
            <a href={'/agendar/' + estabelecimento.slug} target="_blank" style={{ background: '#00C27C', color: '#fff', padding: '10px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
              👁 Ver página
            </a>
          </div>
        </div>
      )}

      {!estabelecimento && (
        <div onClick={() => router.push('/dashboard/configuracoes')}
          style={{ background: '#00C27C', borderRadius: 16, padding: '24px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 32 }}>🚀</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Configure seu estabelecimento agora</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>Adicione nome e informações para começar</div>
          </div>
        </div>
      )}
    </main>
  )
}