'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatarPreco, formatarDuracao } from '@/lib/utils'

const DIAS_MAP: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 }

function gerarHorarios(abertura: string, fechamento: string, duracaoMin: number): string[] {
  const horarios: string[] = []
  const [hA, mA] = abertura.split(':').map(Number)
  const [hF, mF] = fechamento.split(':').map(Number)
  let total = hA * 60 + mA
  const fim = hF * 60 + mF
  while (total + duracaoMin <= fim) {
    const h = String(Math.floor(total / 60)).padStart(2, '0')
    const m = String(total % 60).padStart(2, '0')
    horarios.push(`${h}:${m}`)
    total += duracaoMin
  }
  return horarios
}

function formatarData(data: string): string {
  const [y, m, d] = data.split('-')
  return `${d}/${m}/${y}`
}

const FORMAS_PAGAMENTO = [
  { id: 'dinheiro', label: 'Dinheiro', emoji: '💵' },
  { id: 'pix', label: 'Pix', emoji: '📱' },
  { id: 'cartao', label: 'Cartão', emoji: '💳' },
]

export default function PaginaAgendamento({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const supabase = createClient()

  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [servicos, setServicos] = useState<any[]>([])
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [bloqueado, setBloqueado] = useState(false)
  const [etapa, setEtapa] = useState(1)
  const [sucesso, setSucesso] = useState(false)

  const [servicoSelecionado, setServicoSelecionado] = useState<any>(null)
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<any>(null)
  const [dataSelecionada, setDataSelecionada] = useState('')
  const [horarioSelecionado, setHorarioSelecionado] = useState('')
  const [horarios, setHorarios] = useState<string[]>([])
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([])
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacao, setObservacao] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [avisoHorario, setAvisoHorario] = useState('')

  useEffect(() => { carregar() }, [])

  useEffect(() => {
    if (dataSelecionada && servicoSelecionado && estabelecimento) {
      const abertura = estabelecimento.horario_abertura || '08:00'
      const fechamento = estabelecimento.horario_fechamento || '18:00'
      const horas = gerarHorarios(abertura, fechamento, servicoSelecionado.duracao)
      setHorarios(horas)
      setHorarioSelecionado('')
      setAvisoHorario('')
      buscarHorariosOcupados()
    }
  }, [dataSelecionada, servicoSelecionado, profissionalSelecionado])

  async function buscarHorariosOcupados() {
    if (!dataSelecionada || !estabelecimento) return
    const inicioDia = dataSelecionada + 'T00:00:00.000Z'
    const fimDia = dataSelecionada + 'T23:59:59.999Z'
    let query = supabase
      .from('agendamentos')
      .select('data, profissionalId')
      .eq('estabelecimentoId', estabelecimento.id)
      .gte('data', inicioDia)
      .lte('data', fimDia)
    if (profissionalSelecionado) {
      query = query.eq('profissionalId', profissionalSelecionado.id)
    }
    const { data } = await query
    const ocupados = (data ?? []).map(a => {
      // Extrai o horário direto da string ISO sem converter fuso
      return a.data.substring(11, 16) // ex: "2026-05-26T14:00:00.000Z" → "14:00"
    })
    setHorariosOcupados(ocupados)
  }

  function selecionarHorario(h: string) {
    if (horariosOcupados.includes(h)) {
      setAvisoHorario(`O horário ${h} já está agendado. Escolha outro horário.`)
      setHorarioSelecionado('')
      return
    }
    setAvisoHorario('')
    setHorarioSelecionado(h)
  }

  function isDiaDisponivel(dateStr: string): boolean {
    if (!estabelecimento?.dias_funcionamento) return true
    const d = new Date(dateStr + 'T12:00:00')
    const diaSemana = d.getDay()
    const chave = Object.keys(DIAS_MAP).find(k => DIAS_MAP[k] === diaSemana)
    return chave ? estabelecimento.dias_funcionamento.includes(chave) : false
  }

  async function carregar() {
    const { data: estab } = await supabase
      .from('estabelecimentos')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!estab) { setCarregando(false); return }
    setEstabelecimento(estab)

    if (estab.plano === 'trial' && (estab.agendamentos_trial ?? 0) >= 5) {
      setBloqueado(true); setCarregando(false); return
    }

    const { data: servs } = await supabase.from('servicos').select('*').eq('estabelecimentoId', estab.id).eq('ativo', true).order('nome')
    const { data: profs } = await supabase.from('profissionais').select('*').eq('estabelecimentoId', estab.id).eq('ativo', true).order('nome')

    setServicos(servs ?? [])
    setProfissionais(profs ?? [])
    setCarregando(false)
  }

  async function confirmarAgendamento() {
    setErro('')
    if (!nome || !email) { setErro('Preencha seu nome e e-mail.'); return }
    if (!formaPagamento) { setErro('Escolha uma forma de pagamento.'); return }

    const dataISO = dataSelecionada + 'T' + horarioSelecionado + ':00.000Z'
    const { data: conflito } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('estabelecimentoId', estabelecimento.id)
      .eq('data', dataISO)
      .eq('profissionalId', profissionalSelecionado?.id ?? null)
      .maybeSingle()

    if (conflito) {
      setErro('Este horário acabou de ser ocupado. Volte e escolha outro horário.')
      return
    }

    setSalvando(true)

    let clienteId
    const { data: clienteExistente } = await supabase.from('clientes').select('id').eq('email', email).eq('estabelecimentoId', estabelecimento.id).single()
    if (clienteExistente) {
      clienteId = clienteExistente.id
    } else {
      const { data: novoCliente } = await supabase.from('clientes').insert({ nome, email, telefone, estabelecimentoId: estabelecimento.id }).select().single()
      clienteId = novoCliente?.id
    }

    const { error } = await supabase.from('agendamentos').insert({
      data: dataISO,
      clienteId,
      servicoId: servicoSelecionado.id,
      profissionalId: profissionalSelecionado?.id ?? null,
      estabelecimentoId: estabelecimento.id,
      observacao,
      forma_pagamento: formaPagamento,
    })

    if (error) { setErro(error.message); setSalvando(false); return }

    if (estabelecimento.plano === 'trial') {
      const novoTotal = (estabelecimento.agendamentos_trial ?? 0) + 1
      await supabase.from('estabelecimentos').update({ agendamentos_trial: novoTotal }).eq('id', estabelecimento.id)
    }

    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailCliente: email,
          emailDono: estabelecimento.email,
          nomeCliente: nome,
          nomeEstabelecimento: estabelecimento.nome,
          nomeServico: servicoSelecionado.nome,
          nomeProfissional: profissionalSelecionado?.nome ?? null,
          dataHora: formatarData(dataSelecionada) + ' às ' + horarioSelecionado,
          preco: formatarPreco(servicoSelecionado.preco),
          duracao: formatarDuracao(servicoSelecionado.duracao),
          formaPagamento,
        }),
      })
    } catch (e) { console.error('Erro ao enviar e-mail:', e) }

    setSucesso(true)
    setSalvando(false)
  }

  function resetar() {
    setSucesso(false); setEtapa(1)
    setServicoSelecionado(null); setProfissionalSelecionado(null)
    setDataSelecionada(''); setHorarioSelecionado('')
    setNome(''); setEmail(''); setTelefone(''); setObservacao('')
    setFormaPagamento('')
    setErro(''); setAvisoHorario('')
  }

  if (carregando) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666', fontFamily: 'DM Sans, sans-serif' }}>Carregando...</p>
    </div>
  )

  if (!estabelecimento) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: '#0A0A0A' }}>Estabelecimento não encontrado</h2>
        <p style={{ color: '#666', marginTop: 8 }}>Verifique o link e tente novamente.</p>
      </div>
    </div>
  )

  if (bloqueado) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F2', padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div style={{ background: '#fff', borderRadius: 20, padding: 48, textAlign: 'center', maxWidth: 480, width: '100%', boxShadow: '0 4px 40px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: '#0A0A0A', marginBottom: 8 }}>Agendamentos indisponíveis</h2>
        <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>O período de teste do <strong>{estabelecimento.nome}</strong> foi encerrado.</p>
        <p style={{ color: '#999', fontSize: 13 }}>Se você é o dono, <a href="/auth/login" style={{ color: '#00C27C', fontWeight: 600 }}>faça login</a> para assinar o plano.</p>
      </div>
    </div>
  )

  if (sucesso) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F2', padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <div style={{ background: '#fff', borderRadius: 20, padding: 48, textAlign: 'center', maxWidth: 480, width: '100%', boxShadow: '0 4px 40px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: '#0A0A0A', marginBottom: 8 }}>Agendamento confirmado!</h2>
        <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6 }}>Seu agendamento em <strong>{estabelecimento.nome}</strong> foi realizado com sucesso!</p>
        <div style={{ background: '#F5F5F2', borderRadius: 12, padding: 20, margin: '24px 0', textAlign: 'left' }}>
          <div style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>✂️ <strong>{servicoSelecionado?.nome}</strong></div>
          <div style={{ fontSize: 14, color: '#333', marginBottom: profissionalSelecionado ? 6 : 0 }}>📅 <strong>{formatarData(dataSelecionada)} às {horarioSelecionado}</strong></div>
          {profissionalSelecionado && <div style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>👤 <strong>{profissionalSelecionado?.nome}</strong></div>}
          {formaPagamento && (
            <div style={{ fontSize: 14, color: '#333' }}>
              {FORMAS_PAGAMENTO.find(f => f.id === formaPagamento)?.emoji}{' '}
              <strong>{FORMAS_PAGAMENTO.find(f => f.id === formaPagamento)?.label}</strong>
            </div>
          )}
        </div>
        <button onClick={resetar} style={{ background: '#00C27C', color: '#fff', padding: '14px 32px', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
          Fazer outro agendamento
        </button>
      </div>
    </div>
  )

  const hoje = new Date().toISOString().split('T')[0]
  const agendamentosRestantes = estabelecimento.plano === 'trial' ? 5 - (estabelecimento.agendamentos_trial ?? 0) : null
  const abertura = estabelecimento.horario_abertura || '08:00'
  const fechamento = estabelecimento.horario_fechamento || '18:00'

  return (
    <main style={{ minHeight: '100vh', background: '#F5F5F2', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
        .servico-card { transition: all .15s; cursor: pointer; }
        .servico-card:hover { border-color: #00C27C !important; }
        .prof-card { transition: all .2s; cursor: pointer; }
        .prof-card:hover { border-color: #00C27C !important; background: #f0fdf4 !important; }
        .horario-btn { transition: all .15s; cursor: pointer; }
        .horario-btn:hover:not(:disabled) { background: #00C27C !important; color: #fff !important; border-color: #00C27C !important; }
        .pgto-card { transition: all .15s; cursor: pointer; }
        .pgto-card:hover { border-color: #00C27C !important; background: #f0fdf4 !important; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        .shake { animation: shake .4s ease; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '20px 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: '#0A0A0A' }}>{estabelecimento.nome}</div>
        {estabelecimento.descricao && <p style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{estabelecimento.descricao}</p>}
        <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>🕐 {abertura} às {fechamento}</p>
      </div>

      {agendamentosRestantes !== null && (
        <div style={{ background: agendamentosRestantes <= 2 ? '#fef9c3' : '#f0fdf4', borderBottom: '1px solid ' + (agendamentosRestantes <= 2 ? '#fde68a' : '#bbf7d0'), padding: '10px 20px', textAlign: 'center', fontSize: 13, color: agendamentosRestantes <= 2 ? '#854d0e' : '#166534' }}>
          {agendamentosRestantes <= 2 ? '⚠️ Restam apenas ' + agendamentosRestantes + ' agendamento(s) gratuito(s).' : '🎁 Período de teste: ' + agendamentosRestantes + ' agendamento(s) gratuito(s) restantes.'}
        </div>
      )}

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

        {/* Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {['Serviço', 'Data e hora', 'Seus dados'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: etapa > i + 1 ? '#00C27C' : etapa === i + 1 ? '#0A0A0A' : '#e5e7eb', color: etapa >= i + 1 ? '#fff' : '#999' }}>
                {etapa > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 13, color: etapa === i + 1 ? '#0A0A0A' : '#999', fontWeight: etapa === i + 1 ? 600 : 400 }}>{label}</span>
              {i < 2 && <div style={{ width: 24, height: 1, background: '#e5e7eb' }} />}
            </div>
          ))}
        </div>

        {/* ── ETAPA 1 ── */}
        {etapa === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: '#0A0A0A', marginBottom: 20 }}>Escolha o serviço</h2>
            {servicos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 16 }}>
                <p style={{ color: '#666' }}>Nenhum serviço disponível no momento.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {servicos.map(s => (
                  <div key={s.id} className="servico-card"
                    onClick={() => setServicoSelecionado(s)}
                    style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '2px solid ' + (servicoSelecionado?.id === s.id ? '#00C27C' : '#eee'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>{s.nome}</div>
                      {s.descricao && <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{s.descricao}</div>}
                      <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>⏱ {formatarDuracao(s.duracao)}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#00C27C', marginLeft: 16, flexShrink: 0 }}>{formatarPreco(s.preco)}</div>
                  </div>
                ))}
              </div>
            )}

            {profissionais.length > 0 && servicoSelecionado && (
              <div style={{ marginTop: 28 }}>
                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: '#0A0A0A', marginBottom: 4 }}>Escolha o profissional</h2>
                <p style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>Quem vai te atender?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="prof-card" onClick={() => setProfissionalSelecionado(null)}
                    style={{ padding: '16px 20px', borderRadius: 14, border: '2px solid ' + (!profissionalSelecionado ? '#00C27C' : '#eee'), background: !profissionalSelecionado ? '#f0fdf4' : '#fff', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎲</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>Sem preferência</div>
                      <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Qualquer profissional disponível</div>
                    </div>
                    {!profissionalSelecionado && <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#00C27C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span></div>}
                  </div>
                  {profissionais.map(p => (
                    <div key={p.id} className="prof-card" onClick={() => setProfissionalSelecionado(p)}
                      style={{ padding: '16px 20px', borderRadius: 14, border: '2px solid ' + (profissionalSelecionado?.id === p.id ? '#00C27C' : '#eee'), background: profissionalSelecionado?.id === p.id ? '#f0fdf4' : '#fff', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: '#00C27C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#00C27C', flexShrink: 0 }}>
                        {p.foto_url ? <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>{p.nome}</div>
                        {p.especialidade && (
                          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#555', background: '#f3f4f6', padding: '2px 8px', borderRadius: 20, marginTop: 4 }}>
                            {p.especialidade}
                          </span>
                        )}
                        {p.descricao && <div style={{ fontSize: 13, color: '#666', marginTop: 4, lineHeight: 1.4 }}>{p.descricao}</div>}
                      </div>
                      {profissionalSelecionado?.id === p.id && <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#00C27C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span></div>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setEtapa(2)} style={{ background: '#00C27C', color: '#fff', padding: '14px 32px', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none', width: '100%', marginTop: 20 }}>
                  Continuar →
                </button>
              </div>
            )}

            {profissionais.length === 0 && servicoSelecionado && (
              <button onClick={() => setEtapa(2)} style={{ background: '#00C27C', color: '#fff', padding: '14px 32px', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none', width: '100%', marginTop: 20 }}>
                Continuar →
              </button>
            )}
          </div>
        )}

        {/* ── ETAPA 2 ── */}
        {etapa === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: '#0A0A0A', marginBottom: 20 }}>Escolha a data e horário</h2>

            <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 8 }}>Data</label>
              <input
                type="date" value={dataSelecionada} min={hoje}
                onChange={e => {
                  const d = e.target.value
                  if (d && !isDiaDisponivel(d)) {
                    setAvisoHorario('Este dia não está disponível para agendamento.')
                    setDataSelecionada(d)
                    setHorarios([])
                    return
                  }
                  setAvisoHorario('')
                  setDataSelecionada(d)
                }}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
              />
              {dataSelecionada && !isDiaDisponivel(dataSelecionada) && (
                <div style={{ marginTop: 10, background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#854d0e' }}>
                  ⚠️ Este dia não está disponível. O estabelecimento atende:{' '}
                  <strong>{(estabelecimento.dias_funcionamento ?? []).join(', ')}</strong>
                </div>
              )}
            </div>

            {dataSelecionada && isDiaDisponivel(dataSelecionada) && horarios.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 4 }}>Horário disponível</label>
                <p style={{ fontSize: 12, color: '#999', marginBottom: 14 }}>
                  Funcionamento: {abertura} às {fechamento}
                  {horariosOcupados.length > 0 && ` · ${horariosOcupados.length} horário(s) já agendado(s)`}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {horarios.map(h => {
                    const ocupado = horariosOcupados.includes(h)
                    const selecionado = horarioSelecionado === h
                    return (
                      <button
                        key={h}
                        className="horario-btn"
                        onClick={() => selecionarHorario(h)}
                        disabled={ocupado}
                        title={ocupado ? 'Horário já agendado' : ''}
                        style={{
                          padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                          border: '2px solid ' + (selecionado ? '#00C27C' : ocupado ? '#dc2626' : '#e5e7eb'),
                          background: selecionado ? '#00C27C' : ocupado ? '#dc2626' : '#fff',
                          color: selecionado ? '#fff' : ocupado ? '#fff' : '#333',
                          cursor: ocupado ? 'not-allowed' : 'pointer',
                          opacity: ocupado ? 0.85 : 1,
                        }}
                      >
                        {h}{ocupado && <span style={{ marginLeft: 4, fontSize: 11 }}>✗</span>}
                      </button>
                    )
                  })}
                </div>

                {avisoHorario && (
                  <div className="shake" style={{ marginTop: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>⛔</span>{avisoHorario}
                  </div>
                )}

                {/* Legenda sem "Selecionado", "Já agendado" em vermelho sólido */}
                <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 12, color: '#999' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: '#dc2626', display: 'inline-block' }} />
                    Já agendado
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: '#fff', border: '1px solid #e5e7eb', display: 'inline-block' }} />
                    Disponível
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEtapa(1)} style={{ background: 'transparent', border: '1.5px solid #ddd', color: '#666', padding: '14px 24px', borderRadius: 100, fontSize: 15, cursor: 'pointer' }}>← Voltar</button>
              {horarioSelecionado && (
                <button onClick={() => setEtapa(3)} style={{ flex: 1, background: '#00C27C', color: '#fff', padding: '14px 32px', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
                  Continuar →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── ETAPA 3 ── */}
        {etapa === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: '#0A0A0A', marginBottom: 20 }}>Seus dados</h2>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, marginBottom: 20 }}>

              {/* Resumo */}
              <div style={{ background: '#F5F5F2', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: '#333', marginBottom: 6 }}>✂️ <strong>{servicoSelecionado?.nome}</strong> — {formatarPreco(servicoSelecionado?.preco)}</div>
                <div style={{ fontSize: 13, color: '#333', marginBottom: profissionalSelecionado ? 6 : 0 }}>📅 <strong>{formatarData(dataSelecionada)} às {horarioSelecionado}</strong></div>
                {profissionalSelecionado && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', background: '#00C27C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#00C27C', flexShrink: 0 }}>
                      {profissionalSelecionado.foto_url ? <img src={profissionalSelecionado.foto_url} alt={profissionalSelecionado.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profissionalSelecionado.nome.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, color: '#333' }}><strong>{profissionalSelecionado.nome}</strong></span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Nome completo *</label>
                  <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>E-mail *</label>
                  <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Telefone</label>
                  <input type="text" placeholder="(11) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Observação</label>
                  <textarea placeholder="Alguma observação?" value={observacao} onChange={e => setObservacao(e.target.value)} rows={3} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, resize: 'vertical' }} />
                </div>

                {/* Forma de pagamento */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 10 }}>Forma de pagamento *</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {FORMAS_PAGAMENTO.map(f => {
                      const selecionado = formaPagamento === f.id
                      return (
                        <div
                          key={f.id}
                          className="pgto-card"
                          onClick={() => setFormaPagamento(f.id)}
                          style={{
                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            padding: '14px 8px', borderRadius: 12,
                            border: '2px solid ' + (selecionado ? '#00C27C' : '#e5e7eb'),
                            background: selecionado ? '#f0fdf4' : '#fff',
                            cursor: 'pointer', transition: 'all .15s',
                          }}
                        >
                          <span style={{ fontSize: 26 }}>{f.emoji}</span>
                          <span style={{ fontSize: 13, fontWeight: selecionado ? 600 : 400, color: selecionado ? '#00C27C' : '#333' }}>
                            {f.label}
                          </span>
                          {selecionado && (
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#00C27C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {erro && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginTop: 16 }}>{erro}</div>}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setEtapa(2)} style={{ background: 'transparent', border: '1.5px solid #ddd', color: '#666', padding: '14px 24px', borderRadius: 100, fontSize: 15, cursor: 'pointer' }}>← Voltar</button>
              <button onClick={confirmarAgendamento} disabled={salvando} style={{ flex: 1, background: '#00C27C', color: '#fff', padding: '14px 32px', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer', border: 'none', opacity: salvando ? .7 : 1 }}>
                {salvando ? 'Confirmando...' : '✅ Confirmar agendamento'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}