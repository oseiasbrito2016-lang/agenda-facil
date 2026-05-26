'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Reduz a imagem e converte para base64 (máx 300x300, qualidade 80%)
function comprimirImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 300
        let { width, height } = img
        if (width > height) { if (width > MAX) { height = (height * MAX) / width; width = MAX } }
        else { if (height > MAX) { width = (width * MAX) / height; height = MAX } }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = ev.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Profissionais() {
  const router = useRouter()
  const supabase = createClient()

  const [profissionais, setProfissionais] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [especialidade, setEspecialidade] = useState('') // ✅ novo estado
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [uploadandoFoto, setUploadandoFoto] = useState<string | null>(null)

  const fileInputFormRef = useRef<HTMLInputElement>(null)
  const fileInputCardRefs = useRef<{ [id: string]: HTMLInputElement | null }>({})

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: estab } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (!estab) { setCarregando(false); return }

    const { data } = await supabase
      .from('profissionais')
      .select('*')
      .eq('estabelecimentoId', estab.id)
      .order('nome')

    setProfissionais(data ?? [])
    setCarregando(false)
  }

  async function handleFotoFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const base64 = await comprimirImagem(file)
      setFotoPreview(base64)
    } catch {
      setErro('Erro ao processar imagem.')
    }
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Digite o nome do profissional.'); return }
    setSalvando(true)
    setErro('')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: estab } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('userId', user!.id)
      .single()

    const { data: novo, error } = await supabase
      .from('profissionais')
      .insert({
        nome: nome.trim(),
        especialidade: especialidade.trim() || null, // ✅ inclui especialidade
        estabelecimentoId: estab!.id,
        foto: fotoPreview ?? null,
      })
      .select()
      .single()

    if (error || !novo) {
      setErro(error?.message ?? 'Erro ao salvar.')
      setSalvando(false)
      return
    }

    setNome('')
    setEspecialidade('') // ✅ reseta especialidade
    setFotoPreview(null)
    setMostrarForm(false)
    carregar()
    setSalvando(false)
  }

  async function handleTrocarFoto(e: React.ChangeEvent<HTMLInputElement>, profissionalId: string) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadandoFoto(profissionalId)

    try {
      const base64 = await comprimirImagem(file)

      // Preview imediato
      setProfissionais(prev => prev.map(p =>
        p.id === profissionalId ? { ...p, foto: base64 } : p
      ))

      // Salva no banco
      const { error } = await supabase
        .from('profissionais')
        .update({ foto: base64 })
        .eq('id', profissionalId)

      if (error) {
        console.error('Erro ao salvar foto:', error)
        carregar() // reverte se falhou
      }
    } catch {
      setErro('Erro ao processar imagem.')
    } finally {
      setUploadandoFoto(null)
      if (fileInputCardRefs.current[profissionalId]) {
        fileInputCardRefs.current[profissionalId]!.value = ''
      }
    }
  }

  async function handleRemoverFoto(profissionalId: string) {
    const { error } = await supabase
      .from('profissionais')
      .update({ foto: null })
      .eq('id', profissionalId)

    if (!error) {
      setProfissionais(prev => prev.map(p =>
        p.id === profissionalId ? { ...p, foto: null } : p
      ))
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este profissional?')) return
    await supabase.from('profissionais').delete().eq('id', id)
    carregar()
  }

  function getInicial(nome: string) {
    return nome?.charAt(0)?.toUpperCase() ?? '?'
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F5F2', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }

        .foto-avatar { position: relative; cursor: pointer; flex-shrink: 0; }
        .foto-overlay {
          position: absolute; inset: 0; border-radius: 50%;
          background: rgba(0,0,0,0.45);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .2s; gap: 2px;
        }
        .foto-avatar:hover .foto-overlay { opacity: 1; }
        .foto-overlay span { color: #fff; font-size: 11px; font-weight: 600; line-height: 1; }
        .foto-overlay .cam { font-size: 16px; }

        .btn-excluir { transition: background .15s, color .15s; }
        .btn-excluir:hover { background: #fef2f2 !important; color: #dc2626 !important; }
        .card-prof { transition: box-shadow .15s; }
        .card-prof:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning { animation: spin .8s linear infinite; display: inline-block; }

        .foto-form-area {
          width: 80px; height: 80px; border-radius: 50%;
          border: 2px dashed #d1d5db; background: #f9fafb;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          cursor: pointer; transition: border-color .2s, background .2s; gap: 4px; flex-shrink: 0;
        }
        .foto-form-area:hover { border-color: #00C27C; background: #f0fdf4; }
      `}</style>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>
          Agenda<span style={{ color: '#00C27C' }}>Fácil</span>
        </div>
        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'transparent', border: '1.5px solid #eee', padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer', color: '#666' }}>
          ← Painel
        </button>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 32px' }}>

        {/* Título */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: '#0A0A0A' }}>Profissionais</h1>
            <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Gerencie a equipe do seu estabelecimento</p>
          </div>
          <button
            onClick={() => { setMostrarForm(!mostrarForm); setErro(''); setNome(''); setEspecialidade(''); setFotoPreview(null) }}
            style={{ background: mostrarForm ? '#f3f4f6' : '#00C27C', color: mostrarForm ? '#333' : '#fff', padding: '12px 24px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none' }}
          >
            {mostrarForm ? '✕ Cancelar' : '+ Novo profissional'}
          </button>
        </div>

        {/* Formulário */}
        {mostrarForm && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 24, border: '1px solid #eee' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#0A0A0A' }}>Novo profissional</h2>

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div>
                <input ref={fileInputFormRef} type="file" accept="image/*"
                  onChange={handleFotoFormChange} style={{ display: 'none' }} />
                {fotoPreview ? (
                  <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                    <img src={fotoPreview} alt="Preview"
                      style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' }} />
                    <button onClick={() => setFotoPreview(null)}
                      style={{ position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✕
                    </button>
                    <button onClick={() => fileInputFormRef.current?.click()}
                      style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: '#00C27C', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✏️
                    </button>
                  </div>
                ) : (
                  <div className="foto-form-area" onClick={() => fileInputFormRef.current?.click()}>
                    <span style={{ fontSize: 22 }}>📷</span>
                    <span style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 1.3 }}>Adicionar<br />foto</span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                {/* Campo Nome */}
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Nome *</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && salvar()}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
                />

                {/* ✅ Campo Especialidade */}
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6, marginTop: 14 }}>
                  Especialidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: Barbeiro, Cabeleireiro, Manicure..."
                  value={especialidade}
                  onChange={e => setEspecialidade(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && salvar()}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }}
                />

                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                  Foto comprimida automaticamente (máx. 300×300px)
                </p>
              </div>
            </div>

            {erro && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginTop: 16 }}>
                {erro}
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <button onClick={salvar} disabled={salvando}
                style={{ background: '#00C27C', color: '#fff', padding: '12px 28px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', opacity: salvando ? .7 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar profissional'}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {carregando ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>Carregando...</div>
        ) : profissionais.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #eee' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A', marginBottom: 8 }}>Nenhum profissional cadastrado</h3>
            <p style={{ fontSize: 14, color: '#666' }}>Clique em "Novo profissional" para adicionar.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profissionais.map(p => (
              <div key={p.id} className="card-prof"
                style={{ background: '#fff', borderRadius: 14, padding: '18px 24px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="foto-avatar"
                    onClick={() => fileInputCardRefs.current[p.id]?.click()}
                    style={{ width: 52, height: 52 }}>

                    <input type="file" accept="image/*"
                      ref={el => { fileInputCardRefs.current[p.id] = el }}
                      onChange={e => handleTrocarFoto(e, p.id)}
                      style={{ display: 'none' }} />

                    {uploadandoFoto === p.id ? (
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #e5e7eb' }}>
                        <span className="spinning" style={{ fontSize: 20 }}>⟳</span>
                      </div>
                    ) : p.foto ? (
                      <>
                        <img src={p.foto} alt={p.nome}
                          style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb', display: 'block' }} />
                        <div className="foto-overlay">
                          <span className="cam">📷</span>
                          <span>Trocar</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#00C27C22', border: '2px dashed #00C27C66', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 20, color: '#00C27C', fontWeight: 700 }}>{getInicial(p.nome)}</span>
                        </div>
                        <div className="foto-overlay">
                          <span className="cam">📷</span>
                          <span>Foto</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ✅ Nome + Especialidade + status da foto */}
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0A0A0A' }}>{p.nome}</div>
                    {p.especialidade && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>
                        {p.especialidade}
                      </div>
                    )}
                    <div style={{ fontSize: 12, marginTop: 2 }}>
                      {p.foto
                        ? <span style={{ color: '#00C27C' }}>✓ Foto adicionada</span>
                        : <span style={{ color: '#9ca3af' }}>Clique no avatar para adicionar foto</span>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {p.foto && (
                    <button onClick={() => handleRemoverFoto(p.id)}
                      style={{ background: 'transparent', border: '1.5px solid #e5e7eb', color: '#9ca3af', padding: '7px 14px', borderRadius: 100, fontSize: 12, cursor: 'pointer' }}>
                      🗑 Foto
                    </button>
                  )}
                  <button className="btn-excluir" onClick={() => excluir(p.id)}
                    style={{ background: 'transparent', border: '1.5px solid #fecaca', color: '#dc2626', padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer' }}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}