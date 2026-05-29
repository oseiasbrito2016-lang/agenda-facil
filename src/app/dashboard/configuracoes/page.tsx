'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/layout/ThemeContext'

const IDIOMAS = [
  { code: 'pt', flag: 'BR', label: 'Português' },
  { code: 'en', flag: 'US', label: 'English' },
  { code: 'es', flag: 'ES', label: 'Español' },
  { code: 'fr', flag: 'FR', label: 'Français' },
  { code: 'ar', flag: 'SA', label: 'العربية' },
  { code: 'jp', flag: 'JP', label: '日本語' },
]

export default function Configuracoes() {
  const router = useRouter()
  const supabase = createClient()
  const { darkMode, toggleDarkMode, idioma, setIdioma, t } = useTheme()

  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [telefone, setTelefone] = useState('')
  const [descricao, setDescricao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const bg = darkMode ? '#0f0f0f' : '#F5F5F2'
  const card = darkMode ? '#1a1a1a' : '#ffffff'
  const text = darkMode ? '#f0f0f0' : '#0A0A0A'
  const muted = darkMode ? '#888' : '#666'
  const border = darkMode ? '#2a2a2a' : '#eee'
  const inputBg = darkMode ? '#222' : '#fff'
  const inputBorder = darkMode ? '#333' : '#e5e7eb'

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
    }
  }

  function gerarSlug(texto: string) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
  }

  async function salvar() {
    setErro(''); setSucesso(false)
    if (!nome || !slug) { setErro('Preencha nome e link.'); return }
    setSalvando(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: existente } = await supabase.from('estabelecimentos').select('id').eq('userId', user!.id).maybeSingle()
    let error
    if (existente) {
      const res = await supabase.from('estabelecimentos').update({ nome, slug, telefone, descricao }).eq('userId', user!.id)
      error = res.error
    } else {
      const res = await supabase.from('estabelecimentos').insert({ nome, slug, telefone, descricao, email: user!.email, userId: user!.id })
      error = res.error
    }
    if (error) { setErro(error.message); setSalvando(false); return }
    setSucesso(true); setSalvando(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: bg, padding: '40px 24px', fontFamily: "'DM Sans', sans-serif", transition: 'background .3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .config-input { width: 100%; padding: 14px 16px; border-radius: 12px; font-size: 14px; transition: all .2s; }
        .config-input:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
        .idioma-btn { transition: all .15s; cursor: pointer; }
        .idioma-btn:hover { border-color: #00C27C !important; }
      `}</style>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 34, margin: 0, fontFamily: "'Instrument Serif', serif", color: text }}>
              {t('configuracoes')}
            </h1>
            <p style={{ color: muted, marginTop: 8 }}>Configure seu estabelecimento</p>
          </div>
          <button onClick={() => router.push('/dashboard')}
            style={{ border: `1px solid ${border}`, background: card, color: text, padding: '10px 18px', borderRadius: 999, cursor: 'pointer' }}>
            ← {t('painel')}
          </button>
        </div>

        {/* ✅ Aparência e idioma */}
        <div style={{ background: card, borderRadius: 24, padding: 28, border: `1px solid ${border}`, marginBottom: 20, transition: 'background .3s' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: text, marginBottom: 24, fontFamily: "'Instrument Serif', serif" }}>
            Aparência e idioma
          </h2>

          {/* Modo escuro */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: text }}>Modo escuro</div>
              <div style={{ fontSize: 13, color: muted, marginTop: 2 }}>
                {darkMode ? '🌙 Ativo' : '☀️ Desativado'}
              </div>
            </div>
            <div onClick={toggleDarkMode} style={{
              width: 52, height: 28, borderRadius: 100,
              background: darkMode ? '#00C27C' : '#e5e7eb',
              position: 'relative', cursor: 'pointer', transition: 'background .3s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: darkMode ? 27 : 3,
                width: 22, height: 22, borderRadius: '50%', background: '#fff',
                transition: 'left .3s', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
              }} />
            </div>
          </div>

          {/* Idioma */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 14 }}>Idioma</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {IDIOMAS.map(i => (
                <button key={i.code} className="idioma-btn"
                  onClick={() => setIdioma(i.code as any)}
                  style={{
                    padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                    border: `2px solid ${idioma === i.code ? '#00C27C' : border}`,
                    background: idioma === i.code ? '#00C27C15' : card,
                    color: idioma === i.code ? '#00C27C' : text,
                    cursor: 'pointer',
                  }}>
                  {i.flag} {i.label} {idioma === i.code && '✓'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Informações básicas */}
        <div style={{ background: card, borderRadius: 24, padding: 28, border: `1px solid ${border}`, transition: 'background .3s' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: text, marginBottom: 24, fontFamily: "'Instrument Serif', serif" }}>
            Informações básicas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 8 }}>Nome do estabelecimento</label>
              <input className="config-input" type="text" value={nome} placeholder="Ex: Barbearia do João"
                onChange={(e) => { setNome(e.target.value); setSlug(gerarSlug(e.target.value)) }}
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: text }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 8 }}>Link personalizado</label>
              <input className="config-input" type="text" value={slug} placeholder="barbearia-do-joao"
                onChange={(e) => setSlug(gerarSlug(e.target.value))}
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: text }} />
              <p style={{ fontSize: 13, color: '#00C27C', marginTop: 8 }}>
                {typeof window !== 'undefined' ? window.location.origin : ''}/agendar/{slug}
              </p>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 8 }}>Telefone</label>
              <input className="config-input" type="text" value={telefone} placeholder="(11) 99999-9999"
                onChange={(e) => setTelefone(e.target.value)}
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: text }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: text, display: 'block', marginBottom: 8 }}>Descrição</label>
              <textarea className="config-input" rows={4} value={descricao} placeholder="Descreva seu estabelecimento..."
                onChange={(e) => setDescricao(e.target.value)}
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: text, resize: 'vertical' }} />
            </div>

            {erro && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: 14, borderRadius: 12, fontSize: 14 }}>{erro}</div>}
            {sucesso && <div style={{ background: '#F0FDF4', color: '#16A34A', padding: 14, borderRadius: 12, fontSize: 14 }}>Configurações salvas com sucesso!</div>}

            <button onClick={salvar} disabled={salvando}
              style={{ background: '#00C27C', color: '#fff', border: 'none', padding: '16px', borderRadius: 999, fontWeight: 600, cursor: 'pointer', opacity: salvando ? 0.7 : 1, fontSize: 15 }}>
              {salvando ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}