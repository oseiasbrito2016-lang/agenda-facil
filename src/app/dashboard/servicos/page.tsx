'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatarPreco, formatarDuracao } from '@/lib/utils'
import { usePreferences } from '@/lib/preferences'

export default function Servicos() {
  const router = useRouter()
  const supabase = createClient()
  const { darkMode, t } = usePreferences()

  const bg        = darkMode ? '#0f0f0f' : '#F5F5F2'
  const bg2       = darkMode ? '#1a1a1a' : '#fff'
  const border    = darkMode ? '#2a2a2a' : '#eee'
  const text      = darkMode ? '#f0f0f0' : '#0A0A0A'
  const text2     = darkMode ? '#aaa'    : '#666'
  const inputBg   = darkMode ? '#222'    : '#fff'
  const inputBorder = darkMode ? '#333'  : '#e5e7eb'

  const [servicos, setServicos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [duracao, setDuracao] = useState('60')
  const [preco, setPreco] = useState('')

  useEffect(() => { carregarServicos() }, [])

  async function carregarServicos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: estabelecimento } = await supabase
      .from('estabelecimentos').select('id').eq('userId', user.id).single()
    if (!estabelecimento) { setCarregando(false); return }
    const { data } = await supabase
      .from('servicos').select('*').eq('estabelecimentoId', estabelecimento.id).order('nome')
    setServicos(data ?? [])
    setCarregando(false)
  }

  async function salvarServico() {
    setErro('')
    if (!nome || !preco || !duracao) { setErro(t('erroPreencherCampos')); return }
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: estabelecimento } = await supabase
      .from('estabelecimentos').select('id').eq('userId', user!.id).single()
    if (!estabelecimento) { setErro(t('erroConfigurarEstab')); setSalvando(false); return }
    const { error } = await supabase.from('servicos').insert({
      nome, descricao,
      duracao: parseInt(duracao),
      preco: parseFloat(preco.replace(',', '.')),
      estabelecimentoId: estabelecimento.id,
    })
    if (error) { setErro(t('erroSalvarServico')); setSalvando(false); return }
    setNome(''); setDescricao(''); setDuracao('60'); setPreco('')
    setMostrarForm(false)
    carregarServicos()
    setSalvando(false)
  }

  async function excluirServico(id: string) {
    await supabase.from('servicos').delete().eq('id', id)
    carregarServicos()
  }

  return (
    <main style={{ minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", transition: 'background .2s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
      `}</style>

      {/* Header */}
      <header style={{ background: bg2, borderBottom: `1px solid ${border}`, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: text }}>
          Agenda<span style={{ color: '#00C27C' }}>Fácil</span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: `1.5px solid ${border}`, padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer', color: text2 }}
        >
          {t('voltar')}
        </button>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>

        {/* Título + botão novo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: text }}>{t('servicos')}</h1>
            <p style={{ color: text2, fontSize: 14, marginTop: 4 }}>{t('servicosSubtitle')}</p>
          </div>
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            style={{ background: mostrarForm ? 'transparent' : '#00C27C', color: mostrarForm ? text2 : '#fff', padding: '12px 24px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: mostrarForm ? `1.5px solid ${border}` : 'none' }}
          >
            {mostrarForm ? t('cancelar') : t('novoServico')}
          </button>
        </div>

        {/* Formulário novo serviço */}
        {mostrarForm && (
          <div style={{ background: bg2, borderRadius: 16, padding: 28, marginBottom: 24, border: `1px solid ${border}`, boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,.04)' }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 600, color: text, marginBottom: 20 }}>
              {t('novoServicoTitulo')}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Nome */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: text2, display: 'block', marginBottom: 6 }}>{t('nomeServico')}</label>
                <input
                  type="text" placeholder={t('placeholderServico')} value={nome}
                  onChange={e => setNome(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 15, background: inputBg, color: text }}
                />
              </div>

              {/* Descrição */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: text2, display: 'block', marginBottom: 6 }}>{t('descricaoOpcional')}</label>
                <textarea
                  placeholder={t('placeholderDescricao')} value={descricao}
                  onChange={e => setDescricao(e.target.value)} rows={2}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 15, resize: 'vertical', background: inputBg, color: text }}
                />
              </div>

              {/* Duração */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: text2, display: 'block', marginBottom: 6 }}>{t('duracaoLabel')}</label>
                <select
                  value={duracao} onChange={e => setDuracao(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 15, background: inputBg, color: text }}
                >
                  {[15, 20, 30, 45, 60, 90, 120].map(min => (
                    <option key={min} value={min}>{formatarDuracao(min)}</option>
                  ))}
                </select>
              </div>

              {/* Preço */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: text2, display: 'block', marginBottom: 6 }}>{t('precoLabel')}</label>
                <input
                  type="text" placeholder={t('placeholderPreco')} value={preco}
                  onChange={e => setPreco(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 15, background: inputBg, color: text }}
                />
              </div>
            </div>

            {erro && (
              <div style={{ background: darkMode ? '#2d0a0a' : '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginTop: 16 }}>
                {erro}
              </div>
            )}

            <button
              onClick={salvarServico} disabled={salvando}
              style={{ background: '#00C27C', color: '#fff', padding: '12px 28px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer', border: 'none', marginTop: 20, opacity: salvando ? .7 : 1 }}
            >
              {salvando ? t('salvando') : t('salvarServico')}
            </button>
          </div>
        )}

        {/* Lista */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: 60, color: text2 }}>{t('carregando')}</div>
        ) : servicos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: bg2, borderRadius: 16, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✂️</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: text, marginBottom: 8 }}>{t('nenhumServico')}</h3>
            <p style={{ fontSize: 14, color: text2 }}>{t('nenhumServicoDesc')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {servicos.map(s => (
              <div key={s.id} style={{ background: bg2, borderRadius: 12, padding: '20px 24px', border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: text }}>{s.nome}</div>
                  {s.descricao && <div style={{ fontSize: 13, color: text2, marginTop: 2 }}>{s.descricao}</div>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: text2 }}>⏱ {formatarDuracao(s.duracao)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#00C27C' }}>{formatarPreco(s.preco)}</span>
                  </div>
                </div>
                <button
                  onClick={() => excluirServico(s.id)}
                  style={{ background: 'transparent', border: '1.5px solid #fecaca', color: '#dc2626', padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
                >
                  {t('excluir')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}