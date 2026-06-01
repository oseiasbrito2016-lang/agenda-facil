'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { usePreferences } from '@/lib/preferences'

export default function Profissionais() {
  const router = useRouter()
  const supabase = createClient()
  const { darkMode, t } = usePreferences()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputEditRef = useRef<HTMLInputElement>(null)

  const bg         = darkMode ? '#0f0f0f' : '#F5F5F2'
  const bg2        = darkMode ? '#1a1a1a' : '#fff'
  const bgFoto     = darkMode ? '#222'    : '#fafafa'
  const border     = darkMode ? '#2a2a2a' : '#eee'
  const text       = darkMode ? '#f0f0f0' : '#0A0A0A'
  const text2      = darkMode ? '#aaa'    : '#666'
  const text3      = darkMode ? '#666'    : '#bbb'
  const inputBorder = darkMode ? '#333'   : '#e5e7eb'

  const [profissionais, setProfissionais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [estabelecimentoId, setEstabelecimentoId] = useState<string | null>(null)
  const [uploadandoFotoId, setUploadandoFotoId] = useState<string | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: estab } = await supabase
      .from('estabelecimentos').select('id').eq('userId', user.id).single()

    if (!estab) { setCarregando(false); return }
    setEstabelecimentoId(estab.id)

    const { data } = await supabase
      .from('profissionais').select('*').eq('estabelecimentoId', estab.id).order('nome')

    setProfissionais(data ?? [])
    setCarregando(false)
  }

  function selecionarFoto(file: File) {
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = e => setFotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadFotoExistente(profId: string, file: File) {
    if (!estabelecimentoId) return
    setUploadandoFotoId(profId)

    const ext = file.name.split('.').pop()
    const nomeArquivo = `${estabelecimentoId}/${profId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profissionais-fotos').upload(nomeArquivo, file, { upsert: true })

    if (uploadError) {
      alert(t('erroEnviarFoto') + uploadError.message)
      setUploadandoFotoId(null)
      return
    }

    const { data: urlData } = supabase.storage
      .from('profissionais-fotos').getPublicUrl(nomeArquivo)

    const foto_url = urlData.publicUrl + '?t=' + Date.now()

    const { error: updateError } = await supabase
      .from('profissionais').update({ foto_url }).eq('id', profId)

    if (updateError) {
      alert(t('erroSalvarFoto') + updateError.message)
    } else {
      setProfissionais(prev => prev.map(p => p.id === profId ? { ...p, foto_url } : p))
    }

    setUploadandoFotoId(null)
  }

  async function salvar() {
    if (!nome) { setErro(t('erroNomeProfissional')); return }
    if (!estabelecimentoId) return
    setSalvando(true)
    setErro('')

    const { data: novoProfissional, error: insertError } = await supabase
      .from('profissionais').insert({ nome, descricao, estabelecimentoId }).select().single()

    if (insertError || !novoProfissional) {
      setErro(insertError?.message ?? 'Erro ao salvar.')
      setSalvando(false)
      return
    }

    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop()
      const nomeArquivo = `${estabelecimentoId}/${novoProfissional.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('profissionais-fotos').upload(nomeArquivo, fotoFile, { upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('profissionais-fotos').getPublicUrl(nomeArquivo)
        const foto_url = urlData.publicUrl + '?t=' + Date.now()
        await supabase.from('profissionais').update({ foto_url }).eq('id', novoProfissional.id)
      }
    }

    setNome(''); setDescricao(''); setFotoFile(null); setFotoPreview(null)
    setMostrarForm(false)
    carregar()
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!window.confirm(t('confirmarExcluir'))) return
    await supabase.from('profissionais').delete().eq('id', id)
    carregar()
  }

  function cancelar() {
    setMostrarForm(false); setNome(''); setDescricao('')
    setFotoFile(null); setFotoPreview(null); setErro('')
  }

  return (
    <main style={{ minHeight: '100vh', background: bg, fontFamily: "'DM Sans', sans-serif", transition: 'background .2s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
        .avatar-hover:hover .avatar-overlay { opacity: 1 !important; }
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

        {/* Título + botão */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: text }}>{t('profissionais')}</h1>
            <p style={{ color: text2, fontSize: 14, marginTop: 4 }}>{t('profissionaisSubtitle')}</p>
          </div>
          <button
            onClick={() => mostrarForm ? cancelar() : setMostrarForm(true)}
            style={{ background: mostrarForm ? 'transparent' : '#00C27C', color: mostrarForm ? text2 : '#fff', padding: '12px 24px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: mostrarForm ? `1.5px solid ${border}` : 'none' }}
          >
            {mostrarForm ? t('cancelar') : t('novoProfissional')}
          </button>
        </div>

        {/* Formulário */}
        {mostrarForm && (
          <div style={{ background: bg2, borderRadius: 16, padding: 28, marginBottom: 24, border: `1px solid ${border}`, boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,.04)' }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: text, marginBottom: 20 }}>
              {t('novoProfissionalTitulo')}
            </h2>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {/* Foto */}
              <div style={{ flexShrink: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: text2, display: 'block', marginBottom: 8 }}>{t('foto')}</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: 110, height: 110, borderRadius: '50%', border: `2px dashed ${inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: bgFoto, position: 'relative' }}
                >
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 8 }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>📷</div>
                      <div style={{ fontSize: 11, color: text2, lineHeight: 1.3 }}>{t('fotoCliqueAdicionar')}</div>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) selecionarFoto(f) }}
                  style={{ display: 'none' }} />
                {fotoPreview && (
                  <button
                    onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                    style={{ marginTop: 6, background: 'transparent', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'center' }}
                  >
                    {t('fotoRemover')}
                  </button>
                )}
              </div>

              {/* Campos */}
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: text2, display: 'block', marginBottom: 6 }}>{t('nomeLabel')}</label>
                  <input
                    type="text" placeholder="Ex: João Silva" value={nome}
                    onChange={e => setNome(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 15, background: bg2, color: text }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: text2, display: 'block', marginBottom: 6 }}>
                    {t('descricaoVisivelCliente')}
                    <span style={{ fontWeight: 400, color: text3, marginLeft: 6 }}>{t('descricaoVisivelClienteHint')}</span>
                  </label>
                  <textarea
                    placeholder="Ex: Especialista em cortes modernos..."
                    value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 15, resize: 'vertical', background: bg2, color: text }}
                  />
                </div>
              </div>
            </div>

            {erro && (
              <div style={{ background: darkMode ? '#2d0a0a' : '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginTop: 16 }}>
                {erro}
              </div>
            )}

            <button
              onClick={salvar} disabled={salvando}
              style={{ background: '#00C27C', color: '#fff', padding: '12px 32px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer', border: 'none', marginTop: 20, opacity: salvando ? .7 : 1 }}
            >
              {salvando ? t('salvando') : t('salvarProfissional')}
            </button>
          </div>
        )}

        {/* Input oculto para trocar foto de profissional existente */}
        <input
          ref={fileInputEditRef} type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0]
            const profId = fileInputEditRef.current?.dataset.profId
            if (file && profId) uploadFotoExistente(profId, file)
            e.target.value = ''
          }}
        />

        {/* Lista */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: 60, color: text2 }}>{t('carregando')}</div>
        ) : profissionais.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: bg2, borderRadius: 16, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: text, marginBottom: 8 }}>{t('nenhumProfissional')}</h3>
            <p style={{ fontSize: 14, color: text2 }}>{t('nenhumProfissionalDesc')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profissionais.map(p => (
              <div key={p.id} style={{ background: bg2, borderRadius: 12, padding: '20px 24px', border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                  {/* Avatar clicável */}
                  <div
                    className="avatar-hover"
                    title={t('cliqueTrocarFoto')}
                    onClick={() => {
                      if (fileInputEditRef.current) {
                        fileInputEditRef.current.dataset.profId = p.id
                        fileInputEditRef.current.click()
                      }
                    }}
                    style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: '#00C27C22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#00C27C', flexShrink: 0, border: '2px dashed #00C27C55', cursor: 'pointer', position: 'relative' }}
                  >
                    {uploadandoFotoId === p.id ? (
                      <div style={{ fontSize: 10, color: '#00C27C', textAlign: 'center', padding: 4 }}>...</div>
                    ) : p.foto_url ? (
                      <img src={p.foto_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      p.nome.charAt(0).toUpperCase()
                    )}
                    <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s', borderRadius: '50%' }}>
                      <span style={{ fontSize: 16 }}>📷</span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: text }}>{p.nome}</div>
                    {p.descricao
                      ? <div style={{ fontSize: 13, color: text2, marginTop: 2 }}>{p.descricao}</div>
                      : <div style={{ fontSize: 12, color: text3, marginTop: 2, fontStyle: 'italic' }}>{t('semDescricao')}</div>
                    }
                    {p.foto_url
                      ? <div style={{ fontSize: 12, color: '#00C27C', marginTop: 4 }}>{t('fotoAdicionada')}</div>
                      : <div style={{ fontSize: 12, color: text3, marginTop: 4 }}>{t('cliqueFoto')}</div>
                    }
                  </div>
                </div>

                <button
                  onClick={() => excluir(p.id)}
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