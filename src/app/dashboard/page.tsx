'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatarPreco } from '@/lib/utils'

function formatarDataBR(dataISO: string): string {
  return new Date(dataISO).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function formatarHoraBR(dataISO: string): string {
  return new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [usuario, setUsuario] = useState<any>(null)
  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [stats, setStats] = useState({ agendamentosHoje: 0, clientes: 0, faturamento: 0 })
  const [pendentes, setPendentes] = useState<any[]>([])
  const [assinando, setAssinando] = useState(false)
  const [planoAtivado, setPlanoAtivado] = useState(false)

  useEffect(() => {
    carregarDados()
    if (searchParams.get('plano') === 'ativo') setPlanoAtivado(true)
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

    console.log('plano:', estab.plano)

    const hoje = new Date()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString()
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1).toISOString()

    const { data: agendamentosHoje } = await supabase
      .from('agendamentos').select('id')
      .eq('estabelecimentoId', estab.id)
      .gte('data', inicioHoje).lt('data', fimHoje).neq('status', 'CANCELADO')

    const { data: clientes } = await supabase
      .from('clientes').select('id').eq('estabelecimentoId', estab.id)

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString()
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString()

    const { data: agendamentosMes } = await supabase
      .from('agendamentos').select('servico:servicos(preco)')
      .eq('estabelecimentoId', estab.id).eq('status', 'CONCLUIDO')
      .gte('data', inicioMes).lt('data', fimMes)

    const faturamento = (agendamentosMes ?? []).reduce((acc: number, a: any) => acc + (a.servico?.preco ?? 0), 0)

    const { data: agendsPendentes } = await supabase
      .from('agendamentos')
      .select('*, cliente:clientes(nome), servico:servicos(nome)')
      .eq('estabelecimentoId', estab.id).eq('status', 'PENDENTE')
      .order('data', { ascending: true }).limit(5)

    setStats({ agendamentosHoje: agendamentosHoje?.length ?? 0, clientes: clientes?.length ?? 0, faturamento })
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

  async function assinar() {
    if (!usuario || !estabelecimento) return
    setAssinando(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: usuario.id, email: usuario.email }),
      })
      const { url, error } = await res.json()
      if (error) { alert('Erro: ' + error); return }
      window.location.href = url
    } catch {
      alert('Erro ao redirecionar para pagamento.')
    } finally {
      setAssinando(false)
    }
  }

  const isPro = estabelecimento?.plano === 'pro' || estabelecimento?.plano === 'profissional'
  const agendamentosRestantes = !isPro ? Math.max(0, 5 - (estabelecimento?.agendamentos_trial ?? 0)) : null

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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn .4s ease both; }
      `}</style>

      {planoAtivado && (
        <div className="fade-in" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#166534' }}>Plano Pro ativado com sucesso!</div>
            <div style={{ fontSize: 13, color: '#16a34a', marginTop: 2 }}>Agendamentos ilimitados liberados. Aproveite!</div>
          </div>
          <button onClick={() => setPlanoAtivado(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#16a34a', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
      )}

      {estabelecimento && !isPro && (
        <div className="fade-in" style={{
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 100%)',
          borderRadius: 16, padding: '24px 28px', marginBottom: 28,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 36 }}>{agendamentosRestantes === 0 ? '🔒' : '⚡'}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                {agendamentosRestantes === 0
                  ? 'Você atingiu o limite do plano gratuito'
                  : `Você tem ${agendamentosRestantes} agendamento(s) gratuito(s) restantes`}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                Assine o plano Pro por <strong style={{ color: '#00C27C' }}>R$49,90/mês</strong> e tenha agendamentos ilimitados
              </div>
            </div>
          </div>
          <button onClick={assinar} disabled={assinando}
            style={{ background: '#00C27C', color: '#fff', padding: '12px 28px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: assinando ? 'not-allowed' : 'pointer', border: 'none', opacity: assinando ? 0.7 : 1, whiteSpace: 'nowrap' }}>
            {assinando ? 'Redirecionando...' : '💳 Assinar agora — R$49,90/mês'}
          </button>
        </div>
      )}

      {isPro && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#00C27C15', border: '1px solid #00C27C40', borderRadius: 100, padding: '6px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#00C27C' }}>Plano Pro ativo</span>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: '#0A0A0A' }}>
          {estabelecimento ? 'Olá, ' + estabelecimento.nome + '! 👋' : 'Bem-vindo! 👋'}
        </h1>
        <p style={{ color: '#666', fontSize: 15, marginTop: 6 }}>Aqui está um resumo do seu estabelecimento hoje.</p>
      </div>

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
                  <button onClick={() => confirmar(a.id)} style={{ background: '#00C27C', color: '#fff', padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>✓ Confirmar</button>
                  <button onClick={() => cancelar(a.id)} style={{ background: 'transparent', border: '1.5px solid #fecaca', color: '#dc2626', padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer' }}>✕ Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
    </main>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#666' }}>Carregando...</p></div>}>
      <DashboardContent />
    </Suspense>
  )
}
