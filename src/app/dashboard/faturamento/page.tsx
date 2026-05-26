'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatarPreco } from '@/lib/utils'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_COMPLETOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const PAGAMENTO_INFO: Record<string, { label: string; emoji: string; cor: string }> = {
  dinheiro: { label: 'Dinheiro', emoji: '💵', cor: '#00C27C' },
  pix:      { label: 'Pix',      emoji: '📱', cor: '#6366f1' },
  cartao:   { label: 'Cartão',   emoji: '💳', cor: '#f59e0b' },
  outro:    { label: 'Outros',   emoji: '❓', cor: '#9ca3af' },
}

interface MesDado {
  mes: number; ano: number; label: string
  faturamento: number; agendamentos: number
  inicio: string; fim: string
}

interface PizzaSlice {
  id: string; label: string; emoji: string; cor: string
  valor: number; quantidade: number; percentual: number
  startAngle: number; endAngle: number
}

function calcularPizza(agendamentos: any[]): PizzaSlice[] {
  const totais: Record<string, { valor: number; quantidade: number }> = {}
  agendamentos.forEach(a => {
    const fp = a.forma_pagamento || 'outro'
    if (!totais[fp]) totais[fp] = { valor: 0, quantidade: 0 }
    totais[fp].valor += a.servico?.preco ?? 0
    totais[fp].quantidade += 1
  })
  const totalValor = Object.values(totais).reduce((acc, t) => acc + t.valor, 0)
  if (totalValor === 0) return []
  const slices: PizzaSlice[] = []
  let currentAngle = -Math.PI / 2
  Object.entries(totais)
    .sort((a, b) => b[1].valor - a[1].valor)
    .forEach(([id, dados]) => {
      const info = PAGAMENTO_INFO[id] ?? PAGAMENTO_INFO.outro
      const percentual = (dados.valor / totalValor) * 100
      const angulo = (dados.valor / totalValor) * 2 * Math.PI
      slices.push({
        id, label: info.label, emoji: info.emoji, cor: info.cor,
        valor: dados.valor, quantidade: dados.quantidade, percentual,
        startAngle: currentAngle, endAngle: currentAngle + angulo,
      })
      currentAngle += angulo
    })
  return slices
}

function PizzaChart({ slices, hoveredSlice, setHoveredSlice }: {
  slices: PizzaSlice[]
  hoveredSlice: string | null
  setHoveredSlice: (id: string | null) => void
}) {
  const cx = 120, cy = 120, r = 90, rInner = 50
  if (slices.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 240, height: 240 }}>
      <div style={{ textAlign: 'center', color: '#999' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
        <div style={{ fontSize: 13 }}>Sem dados</div>
      </div>
    </div>
  )
  function describeArc(startAngle: number, endAngle: number, isHovered: boolean) {
    const offset = isHovered ? 6 : 0
    const midAngle = (startAngle + endAngle) / 2
    const dx = Math.cos(midAngle) * offset
    const dy = Math.sin(midAngle) * offset
    const x1 = cx + dx + r * Math.cos(startAngle)
    const y1 = cy + dy + r * Math.sin(startAngle)
    const x2 = cx + dx + r * Math.cos(endAngle)
    const y2 = cy + dy + r * Math.sin(endAngle)
    const x3 = cx + dx + rInner * Math.cos(endAngle)
    const y3 = cy + dy + rInner * Math.sin(endAngle)
    const x4 = cx + dx + rInner * Math.cos(startAngle)
    const y4 = cy + dy + rInner * Math.sin(startAngle)
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`
  }
  return (
    <svg width={240} height={240} style={{ overflow: 'visible' }}>
      {slices.map(s => {
        const isHovered = hoveredSlice === s.id
        return (
          <path key={s.id} d={describeArc(s.startAngle, s.endAngle, isHovered)} fill={s.cor}
            opacity={hoveredSlice && !isHovered ? 0.5 : 1}
            style={{ cursor: 'pointer', transition: 'all .2s' }}
            onMouseEnter={() => setHoveredSlice(s.id)}
            onMouseLeave={() => setHoveredSlice(null)} />
        )
      })}
      <circle cx={cx} cy={cy} r={rInner - 2} fill="#fff" />
      {hoveredSlice ? (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={11} fill="#999">{PAGAMENTO_INFO[hoveredSlice]?.label}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={14} fontWeight={700} fill="#0A0A0A">
            {slices.find(s => s.id === hoveredSlice)?.percentual.toFixed(1)}%
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize={10} fill="#999">Total</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0A0A0A">
            {slices.reduce((a, s) => a + s.quantidade, 0)} pag.
          </text>
        </>
      )}
    </svg>
  )
}

export default function Faturamento() {
  const router = useRouter()
  const supabase = createClient()

  const [dados, setDados] = useState<MesDado[]>([])
  const [carregando, setCarregando] = useState(true)
  const [mesSelecionado, setMesSelecionado] = useState<MesDado | null>(null)
  const [agendamentosMes, setAgendamentosMes] = useState<any[]>([])
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null)
  const [todosAgendamentos, setTodosAgendamentos] = useState<any[]>([])

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: estab } = await supabase
      .from('estabelecimentos').select('*').eq('userId', user.id).single()

    if (!estab) { setCarregando(false); return }
    setEstabelecimento(estab)

    // ✅ Tipagem corrigida com as any[]
    const { data: todosRaw } = await supabase
      .from('agendamentos')
      .select('data, forma_pagamento, servico:servicos(preco)')
      .eq('estabelecimentoId', estab.id)
      .eq('status', 'CONCLUIDO')
      .order('data', { ascending: true })

    const todos = (todosRaw ?? []) as any[]
    setTodosAgendamentos(todos)

    const agora = new Date()
    const meses: MesDado[] = []

    for (let i = 11; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      const ano = d.getFullYear()
      const mes = d.getMonth()
      const inicio = new Date(ano, mes, 1)
      const fim = new Date(ano, mes + 1, 1)

      const agendsMes = todos.filter((a: any) => {
        const data = new Date(a.data)
        return data >= inicio && data < fim
      })

      meses.push({
        mes, ano,
        label: MESES[mes] + '/' + String(ano).slice(2),
        faturamento: agendsMes.reduce((acc: number, a: any) => acc + (a.servico?.preco ?? 0), 0),
        agendamentos: agendsMes.length,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
      })
    }

    setDados(meses)
    const mesAtual = meses[meses.length - 1]
    setMesSelecionado(mesAtual)
    await carregarDetalhesMes(estab.id, mesAtual)
    setCarregando(false)
  }

  async function carregarDetalhesMes(estabelecimentoId: string, mes: MesDado) {
    setCarregandoDetalhe(true)
    const { data } = await supabase
      .from('agendamentos')
      .select('*, cliente:clientes(nome, email), servico:servicos(nome, preco), profissional:profissionais(nome)')
      .eq('estabelecimentoId', estabelecimentoId)
      .eq('status', 'CONCLUIDO')
      .gte('data', mes.inicio)
      .lt('data', mes.fim)
      .order('data', { ascending: false })
    setAgendamentosMes((data ?? []) as any[])
    setCarregandoDetalhe(false)
  }

  async function selecionarMes(mes: MesDado) {
    setMesSelecionado(mes)
    setHoveredSlice(null)
    if (estabelecimento) await carregarDetalhesMes(estabelecimento.id, mes)
  }

  const maxFaturamento = Math.max(...dados.map(d => d.faturamento), 1)
  const totalAno = dados.reduce((acc, d) => acc + d.faturamento, 0)
  const melhorMes = dados.reduce((best, d) => d.faturamento > best.faturamento ? d : best, dados[0] ?? { faturamento: 0, label: '-' })
  const mesAtualDados = dados[dados.length - 1]
  const mesAnteriorDados = dados[dados.length - 2]
  const variacao = mesAnteriorDados?.faturamento > 0
    ? ((mesAtualDados?.faturamento - mesAnteriorDados?.faturamento) / mesAnteriorDados?.faturamento) * 100
    : null

  const pizzaSlices = calcularPizza(agendamentosMes)
  const pizzaGeral = calcularPizza(todosAgendamentos)

  function formatarDataBR(dataISO: string) {
    return new Date(dataISO).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  }
  function formatarHoraBR(dataISO: string) {
    return new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
  }

  if (carregando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666', fontFamily: 'DM Sans, sans-serif' }}>Carregando...</p>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", padding: '40px 32px', background: '#F5F5F2' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        .barra { transition: all .2s; cursor: pointer; }
        .barra:hover { opacity: .85 !important; }
        .barra-wrap:hover .barra-label { opacity: 1 !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: '#0A0A0A' }}>Faturamento</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Acompanhe sua receita mês a mês</p>
        </div>
        <button onClick={() => router.push('/dashboard')}
          style={{ border: '1px solid #ddd', background: '#fff', padding: '10px 18px', borderRadius: 999, cursor: 'pointer', fontSize: 13 }}>
          ← Painel
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee' }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total nos últimos 12 meses</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#00C27C' }}>{formatarPreco(totalAno)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee' }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Melhor mês</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0A0A0A' }}>{melhorMes?.label ?? '-'}</div>
          <div style={{ fontSize: 13, color: '#00C27C', marginTop: 4 }}>{formatarPreco(melhorMes?.faturamento ?? 0)}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #eee' }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vs. mês anterior</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: variacao === null ? '#999' : variacao >= 0 ? '#00C27C' : '#dc2626' }}>
            {variacao === null ? '—' : (variacao >= 0 ? '+' : '') + variacao.toFixed(1) + '%'}
          </div>
          <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
            {mesAnteriorDados ? MESES_COMPLETOS[mesAnteriorDados.mes] + ' → ' + MESES_COMPLETOS[mesAtualDados?.mes ?? 0] : ''}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid #eee', marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', marginBottom: 28 }}>Faturamento por mês</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200, paddingBottom: 32, position: 'relative' }}>
          {[0, 25, 50, 75, 100].map(pct => (
            <div key={pct} style={{ position: 'absolute', left: 0, right: 0, bottom: 32 + (pct / 100) * 168, borderTop: '1px dashed ' + (pct === 0 ? '#e5e7eb' : '#f3f4f6') }} />
          ))}
          {dados.map((d, i) => {
            const altura = maxFaturamento > 0 ? (d.faturamento / maxFaturamento) * 168 : 0
            const selecionado = mesSelecionado?.mes === d.mes && mesSelecionado?.ano === d.ano
            const ehAtual = i === dados.length - 1
            return (
              <div key={i} className="barra-wrap" onClick={() => selecionarMes(d)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}>
                {d.faturamento > 0 && (
                  <div className="barra-label" style={{ position: 'absolute', bottom: altura + 38, left: '50%', transform: 'translateX(-50%)', background: '#0A0A0A', color: '#fff', fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 6, whiteSpace: 'nowrap', opacity: selecionado ? 1 : 0, transition: 'opacity .15s', pointerEvents: 'none', zIndex: 10 }}>
                    {formatarPreco(d.faturamento)}
                  </div>
                )}
                <div className="barra" style={{ width: '100%', borderRadius: '6px 6px 0 0', height: Math.max(altura, d.faturamento > 0 ? 4 : 0), background: selecionado ? '#00C27C' : ehAtual ? '#00C27C55' : '#e5e7eb', border: selecionado ? '2px solid #00C27C' : '2px solid transparent', boxShadow: selecionado ? '0 4px 16px rgba(0,194,124,.3)' : 'none', transition: 'all .2s' }} />
                <div style={{ position: 'absolute', bottom: 0, fontSize: 10, color: selecionado ? '#00C27C' : '#999', fontWeight: selecionado ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {d.label}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#999' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#00C27C', display: 'inline-block' }} /> Selecionado</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#00C27C55', display: 'inline-block' }} /> Mês atual</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: '#e5e7eb', display: 'inline-block' }} /> Meses anteriores</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid #eee' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', marginBottom: 4 }}>Pagamentos — {mesSelecionado ? MESES_COMPLETOS[mesSelecionado.mes] : ''}</h2>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>Como os clientes pagaram neste mês</p>
          {carregandoDetalhe ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Carregando...</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <PizzaChart slices={pizzaSlices} hoveredSlice={hoveredSlice} setHoveredSlice={setHoveredSlice} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pizzaSlices.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#999' }}>Sem pagamentos neste mês.</p>
                ) : pizzaSlices.map(s => (
                  <div key={s.id} onMouseEnter={() => setHoveredSlice(s.id)} onMouseLeave={() => setHoveredSlice(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default', opacity: hoveredSlice && hoveredSlice !== s.id ? 0.4 : 1, transition: 'opacity .2s' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.cor, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{s.emoji} {s.label}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{s.quantidade} pag. · {formatarPreco(s.valor)}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: s.cor }}>{s.percentual.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid #eee' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', marginBottom: 4 }}>Pagamentos — Últimos 12 meses</h2>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>Visão geral de todas as formas de pagamento</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <PizzaChart slices={pizzaGeral} hoveredSlice={hoveredSlice} setHoveredSlice={setHoveredSlice} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pizzaGeral.length === 0 ? (
                <p style={{ fontSize: 13, color: '#999' }}>Sem pagamentos registrados.</p>
              ) : pizzaGeral.map(s => (
                <div key={s.id} onMouseEnter={() => setHoveredSlice(s.id)} onMouseLeave={() => setHoveredSlice(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default', opacity: hoveredSlice && hoveredSlice !== s.id ? 0.4 : 1, transition: 'opacity .2s' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.cor, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{s.emoji} {s.label}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{s.quantidade} pag. · {formatarPreco(s.valor)}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.cor }}>{s.percentual.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {mesSelecionado && (
        <div style={{ background: '#fff', borderRadius: 20, padding: 32, border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A' }}>{MESES_COMPLETOS[mesSelecionado.mes]} de {mesSelecionado.ano}</h2>
              <p style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{mesSelecionado.agendamentos} agendamento(s) concluído(s)</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>Total do mês</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#00C27C' }}>{formatarPreco(mesSelecionado.faturamento)}</div>
            </div>
          </div>

          {carregandoDetalhe ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Carregando...</div>
          ) : agendamentosMes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: '#F5F5F2', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <p style={{ color: '#999', fontSize: 14 }}>Nenhum agendamento concluído neste mês.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agendamentosMes.map((a: any) => {
                const pgto = PAGAMENTO_INFO[a.forma_pagamento] ?? null
                return (
                  <div key={a.id} style={{ background: '#F5F5F2', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{a.cliente?.nome}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        ✂️ {a.servico?.nome}
                        {a.profissional && <span> · 👤 {a.profissional.nome}</span>}
                        {' · '}📅 {formatarDataBR(a.data)} às {formatarHoraBR(a.data)}
                        {pgto && <span> · {pgto.emoji} {pgto.label}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {pgto && (
                        <span style={{ fontSize: 11, fontWeight: 600, background: pgto.cor + '20', color: pgto.cor, padding: '3px 10px', borderRadius: 100 }}>
                          {pgto.emoji} {pgto.label}
                        </span>
                      )}
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#00C27C' }}>{formatarPreco(a.servico?.preco ?? 0)}</div>
                    </div>
                  </div>
                )
              })}
              <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 8, paddingTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, color: '#666' }}>Total de {agendamentosMes.length} serviço(s):</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#00C27C' }}>{formatarPreco(mesSelecionado.faturamento)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}