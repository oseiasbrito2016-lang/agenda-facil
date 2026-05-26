'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatarPreco, formatarDuracao } from '@/lib/utils'

export default function Servicos() {
  const router = useRouter()
  const supabase = createClient()

  const [servicos, setServicos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState('')

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [duracao, setDuracao] = useState('60')
  const [preco, setPreco] = useState('')

  useEffect(() => {
    carregarServicos()
  }, [])

  async function carregarServicos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: estabelecimento } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (!estabelecimento) { setCarregando(false); return }

    const { data } = await supabase
      .from('servicos')
      .select('*')
      .eq('estabelecimentoId', estabelecimento.id)
      .order('nome')

    setServicos(data ?? [])
    setCarregando(false)
  }

  async function salvarServico() {
    setErro('')
    if (!nome || !preco || !duracao) {
      setErro('Preencha todos os campos obrigatórios.')
      return
    }

    setSalvando(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: estabelecimento } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('userId', user!.id)
      .single()

    if (!estabelecimento) {
      setErro('Configure seu estabelecimento primeiro.')
      setSalvando(false)
      return
    }

    const { error } = await supabase.from('servicos').insert({
      nome,
      descricao,
      duracao: parseInt(duracao),
      preco: parseFloat(preco.replace(',', '.')),
      estabelecimentoId: estabelecimento.id,
    })

    if (error) {
      setErro('Erro ao salvar serviço. Tente novamente.')
      setSalvando(false)
      return
    }

    setNome('')
    setDescricao('')
    setDuracao('60')
    setPreco('')
    setMostrarForm(false)
    carregarServicos()
    setSalvando(false)
  }

  async function excluirServico(id: string) {
    await supabase.from('servicos').delete().eq('id', id)
    carregarServicos()
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F5F2', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        input, textarea, select { transition: all .2s; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
      `}</style>

      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #eee',
        padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>
          Agenda<span style={{ color: '#00C27C' }}>Fácil</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => router.push('/dashboard')} style={{
            background: 'transparent', border: '1.5px solid #eee',
            padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer', color: '#666'
          }}>
            ← Painel
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>
        
        {/* Título */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: '#0A0A0A' }}>Serviços</h1>
            <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Gerencie os serviços do seu estabelecimento</p>
          </div>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            style={{
              background: '#00C27C', color: '#fff', padding: '12px 24px',
              borderRadius: 100, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', border: 'none'
            }}
          >
            {mostrarForm ? 'Cancelar' : '+ Novo serviço'}
          </button>
        </div>

        {/* Formulário */}
        {mostrarForm && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 24, border: '1px solid #eee' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', marginBottom: 20 }}>Novo serviço</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Nome do serviço *</label>
                <input
                  type="text"
                  placeholder="Ex: Corte de cabelo"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Descrição</label>
                <textarea
                  placeholder="Descrição opcional do serviço"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Duração *</label>
                <select
                  value={duracao}
                  onChange={e => setDuracao(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, background: '#fff' }}
                >
                  {[15,20,30,45,60,90,120].map(min => (
                    <option key={min} value={min}>{formatarDuracao(min)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Preço (R$) *</label>
                <input
                  type="text"
                  placeholder="Ex: 50,00"
                  value={preco}
                  onChange={e => setPreco(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
                />
              </div>
            </div>

            {erro && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginTop: 16 }}>
                {erro}
              </div>
            )}

            <button
              onClick={salvarServico}
              disabled={salvando}
              style={{
                background: '#00C27C', color: '#fff', padding: '12px 28px',
                borderRadius: 100, fontSize: 14, fontWeight: 600,
                cursor: salvando ? 'not-allowed' : 'pointer',
                border: 'none', marginTop: 20, opacity: salvando ? .7 : 1
              }}
            >
              {salvando ? 'Salvando...' : 'Salvar serviço'}
            </button>
          </div>
        )}

        {/* Lista de serviços */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>Carregando...</div>
        ) : servicos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #eee' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✂️</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A', marginBottom: 8 }}>Nenhum serviço cadastrado</h3>
            <p style={{ fontSize: 14, color: '#666' }}>Clique em "Novo serviço" para adicionar seu primeiro serviço.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {servicos.map(servico => (
              <div key={servico.id} style={{
                background: '#fff', borderRadius: 12, padding: '20px 24px',
                border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>{servico.nome}</div>
                  {servico.descricao && <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{servico.descricao}</div>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: '#666' }}>⏱ {formatarDuracao(servico.duracao)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#00C27C' }}>{formatarPreco(servico.preco)}</span>
                  </div>
                </div>
                <button
                  onClick={() => excluirServico(servico.id)}
                  style={{
                    background: 'transparent', border: '1.5px solid #fecaca',
                    color: '#dc2626', padding: '8px 16px', borderRadius: 100,
                    fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}