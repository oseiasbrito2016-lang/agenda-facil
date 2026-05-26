'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const DIAS = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
]

export default function Configuracoes() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [telefone, setTelefone] = useState('')
  const [descricao, setDescricao] = useState('')
  const [horarioAbertura, setHorarioAbertura] = useState('08:00')
  const [horarioFechamento, setHorarioFechamento] = useState('18:00')
  const [diasFuncionamento, setDiasFuncionamento] = useState<string[]>(['seg','ter','qua','qui','sex'])
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data } = await supabase.from('estabelecimentos').select('*').eq('userId', user.id).maybeSingle()
    if (data) {
      setNome(data.nome || '')
      setSlug(data.slug || '')
      setTelefone(data.telefone || '')
      setDescricao(data.descricao || '')
      setHorarioAbertura(data.horario_abertura || '08:00')
      setHorarioFechamento(data.horario_fechamento || '18:00')
      setDiasFuncionamento(data.dias_funcionamento || ['seg','ter','qua','qui','sex'])
    }
  }

  function gerarSlug(texto: string) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
  }

  function toggleDia(dia: string) {
    setDiasFuncionamento(prev =>
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    )
  }

  async function salvar() {
    setErro(''); setSucesso(false)
    if (!nome || !slug) { setErro('Preencha nome e link.'); return }
    if (diasFuncionamento.length === 0) { setErro('Selecione pelo menos um dia de funcionamento.'); return }
    if (horarioAbertura >= horarioFechamento) { setErro('O horário de abertura deve ser antes do fechamento.'); return }
    setSalvando(true)

    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      nome, slug, telefone, descricao,
      horario_abertura: horarioAbertura,
      horario_fechamento: horarioFechamento,
      dias_funcionamento: diasFuncionamento,
    }

    const { data: existente } = await supabase.from('estabelecimentos').select('id').eq('userId', user!.id).maybeSingle()
    let error
    if (existente) {
      const res = await supabase.from('estabelecimentos').update(payload).eq('userId', user!.id)
      error = res.error
    } else {
      const res = await supabase.from('estabelecimentos').insert({ ...payload, email: user!.email, userId: user!.id })
      error = res.error
    }

    if (error) { setErro(error.message); setSalvando(false); return }
    setSucesso(true)
    setSalvando(false)
    setTimeout(() => setSucesso(false), 3000)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F5F2', padding: '40px 24px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
      `}</style>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: '#0A0A0A', margin: 0 }}>Configurações</h1>
            <p style={{ color: '#666', marginTop: 6, fontSize: 14 }}>Configure seu estabelecimento</p>
          </div>
          <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #ddd', background: '#fff', padding: '10px 18px', borderRadius: 999, cursor: 'pointer', fontSize: 14 }}>← Voltar</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Informações básicas */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #eee' }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#0A0A0A', margin: '0 0 20px' }}>Informações básicas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Nome do estabelecimento</label>
                <input
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
                  type="text" value={nome} placeholder="Ex: Barbearia do João"
                  onChange={e => { setNome(e.target.value); setSlug(gerarSlug(e.target.value)) }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Link de agendamento</label>
                <input
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
                  type="text" value={slug} placeholder="barbearia-do-joao"
                  onChange={e => setSlug(gerarSlug(e.target.value))}
                />
                <p style={{ fontSize: 12, color: '#00C27C', marginTop: 6 }}>
                  agendafacil.com/agendar/{slug || '...'}
                </p>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Telefone</label>
                <input
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
                  type="text" value={telefone} placeholder="(11) 99999-9999"
                  onChange={e => setTelefone(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Descrição</label>
                <textarea
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, resize: 'vertical' }}
                  rows={3} value={descricao} placeholder="Descreva seu estabelecimento..."
                  onChange={e => setDescricao(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Horário de funcionamento */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #eee' }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#0A0A0A', margin: '0 0 6px' }}>Horário de funcionamento</h2>
            <p style={{ fontSize: 13, color: '#999', margin: '0 0 20px' }}>Define os horários disponíveis para agendamento</p>

            {/* Dias da semana */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 10 }}>Dias de atendimento</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DIAS.map(d => (
                  <button
                    key={d.key}
                    onClick={() => toggleDia(d.key)}
                    style={{
                      padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                      background: diasFuncionamento.includes(d.key) ? '#00C27C' : '#f5f5f2',
                      color: diasFuncionamento.includes(d.key) ? '#fff' : '#666',
                      border: '2px solid ' + (diasFuncionamento.includes(d.key) ? '#00C27C' : '#e5e7eb'),
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Horários */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Abertura</label>
                <input
                  type="time" value={horarioAbertura}
                  onChange={e => setHorarioAbertura(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Fechamento</label>
                <input
                  type="time" value={horarioFechamento}
                  onChange={e => setHorarioFechamento(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
                />
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginTop: 16, background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#166534' }}>
              ✓ Agendamentos disponíveis das <strong>{horarioAbertura}</strong> às <strong>{horarioFechamento}</strong> nos dias:{' '}
              <strong>{diasFuncionamento.map(d => DIAS.find(x => x.key === d)?.label).join(', ') || '—'}</strong>
            </div>
          </div>

          {/* Erros / sucesso */}
          {erro && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: 14, borderRadius: 12, fontSize: 14 }}>{erro}</div>}
          {sucesso && <div style={{ background: '#F0FDF4', color: '#16A34A', padding: 14, borderRadius: 12, fontSize: 14 }}>✓ Configurações salvas com sucesso!</div>}

          <button
            onClick={salvar} disabled={salvando}
            style={{ background: '#00C27C', color: '#fff', border: 'none', padding: '16px', borderRadius: 999, fontWeight: 600, fontSize: 15, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}
          >
            {salvando ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>
    </main>
  )
}