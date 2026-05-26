'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Profissionais() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputEditRef = useRef<HTMLInputElement>(null)

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
      .from('estabelecimentos')
      .select('id')
      .eq('userId', user.id)
      .single()

    if (!estab) { setCarregando(false); return }
    setEstabelecimentoId(estab.id)

    const { data } = await supabase
      .from('profissionais')
      .select('*')
      .eq('estabelecimentoId', estab.id)
      .order('nome')

    setProfissionais(data ?? [])
    setCarregando(false)
  }

  function selecionarFoto(file: File) {
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = e => setFotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  // Upload de foto para profissional já existente
  async function uploadFotoExistente(profId: string, file: File) {
    if (!estabelecimentoId) return
    setUploadandoFotoId(profId)

    const ext = file.name.split('.').pop()
    const nomeArquivo = `${estabelecimentoId}/${profId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('profissionais-fotos')
      .upload(nomeArquivo, file, { upsert: true })

    if (uploadError) {
      alert('Erro ao enviar foto: ' + uploadError.message)
      setUploadandoFotoId(null)
      return
    }

    // Força cache bust adicionando timestamp na URL
    const { data: urlData } = supabase.storage
      .from('profissionais-fotos')
      .getPublicUrl(nomeArquivo)

    const foto_url = urlData.publicUrl + '?t=' + Date.now()

    const { error: updateError } = await supabase
      .from('profissionais')
      .update({ foto_url })
      .eq('id', profId)

    if (updateError) {
      alert('Erro ao salvar foto: ' + updateError.message)
    } else {
      // Atualiza localmente sem precisar recarregar tudo
      setProfissionais(prev =>
        prev.map(p => p.id === profId ? { ...p, foto_url } : p)
      )
    }

    setUploadandoFotoId(null)
  }

  async function salvar() {
    if (!nome) { setErro('Digite o nome do profissional.'); return }
    if (!estabelecimentoId) return
    setSalvando(true)
    setErro('')

    // Primeiro insere o profissional para ter o ID
    const { data: novoProfissional, error: insertError } = await supabase
      .from('profissionais')
      .insert({ nome, descricao, estabelecimentoId })
      .select()
      .single()

    if (insertError || !novoProfissional) {
      setErro(insertError?.message ?? 'Erro ao salvar.')
      setSalvando(false)
      return
    }

    // Se tem foto, faz upload agora que temos o ID
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop()
      const nomeArquivo = `${estabelecimentoId}/${novoProfissional.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('profissionais-fotos')
        .upload(nomeArquivo, fotoFile, { upsert: true })

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('profissionais-fotos')
          .getPublicUrl(nomeArquivo)

        const foto_url = urlData.publicUrl + '?t=' + Date.now()

        await supabase
          .from('profissionais')
          .update({ foto_url })
          .eq('id', novoProfissional.id)
      }
    }

    setNome('')
    setDescricao('')
    setFotoFile(null)
    setFotoPreview(null)
    setMostrarForm(false)
    carregar()
    setSalvando(false)
  }

  async function excluir(id: string) {
    if (!window.confirm('Tem certeza que deseja excluir este profissional?')) return
    await supabase.from('profissionais').delete().eq('id', id)
    carregar()
  }

  function cancelar() {
    setMostrarForm(false)
    setNome('')
    setDescricao('')
    setFotoFile(null)
    setFotoPreview(null)
    setErro('')
  }

  return (
    <main style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", padding: '40px 32px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
        .avatar-hover:hover .avatar-overlay { opacity: 1 !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 32, color: '#0A0A0A' }}>Profissionais</h1>
          <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Gerencie a equipe do seu estabelecimento</p>
        </div>
        <button
          onClick={() => mostrarForm ? cancelar() : setMostrarForm(true)}
          style={{ background: mostrarForm ? 'transparent' : '#00C27C', color: mostrarForm ? '#666' : '#fff', padding: '12px 24px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: mostrarForm ? '1.5px solid #ddd' : 'none' }}
        >
          {mostrarForm ? 'Cancelar' : '+ Novo profissional'}
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 28, marginBottom: 24, border: '1px solid #eee', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#0A0A0A', marginBottom: 20 }}>Novo profissional</h2>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {/* Foto */}
            <div style={{ flexShrink: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 8 }}>Foto</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 110, height: 110, borderRadius: '50%', border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: '#fafafa', position: 'relative' }}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', padding: 8 }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>📷</div>
                    <div style={{ fontSize: 11, color: '#999', lineHeight: 1.3 }}>Clique para<br/>adicionar</div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) selecionarFoto(f) }} style={{ display: 'none' }} />
              {fotoPreview && (
                <button onClick={() => { setFotoFile(null); setFotoPreview(null) }} style={{ marginTop: 6, background: 'transparent', border: 'none', color: '#dc2626', fontSize: 12, cursor: 'pointer', width: '100%', textAlign: 'center' }}>
                  Remover
                </button>
              )}
            </div>

            {/* Campos */}
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Nome *</label>
                <input type="text" placeholder="Ex: João Silva" value={nome} onChange={e => setNome(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>
                  Descrição
                  <span style={{ fontWeight: 400, color: '#999', marginLeft: 6 }}>— visível para o cliente</span>
                </label>
                <textarea placeholder="Ex: Especialista em cortes modernos, 5 anos de experiência..."
                  value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {erro && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginTop: 16 }}>{erro}</div>}

          <button onClick={salvar} disabled={salvando}
            style={{ background: '#00C27C', color: '#fff', padding: '12px 32px', borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: salvando ? 'not-allowed' : 'pointer', border: 'none', marginTop: 20, opacity: salvando ? .7 : 1 }}>
            {salvando ? 'Salvando...' : 'Salvar profissional'}
          </button>
        </div>
      )}

      {/* Input oculto para editar foto de profissional existente */}
      <input
        ref={fileInputEditRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          const profId = fileInputEditRef.current?.dataset.profId
          if (file && profId) uploadFotoExistente(profId, file)
          // Limpa o input para permitir selecionar o mesmo arquivo novamente
          e.target.value = ''
        }}
      />

      {carregando ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>Carregando...</div>
      ) : profissionais.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #eee' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A', marginBottom: 8 }}>Nenhum profissional cadastrado</h3>
          <p style={{ fontSize: 14, color: '#666' }}>Clique em "+ Novo profissional" para adicionar.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profissionais.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                {/* Avatar clicável para trocar foto */}
                <div
                  className="avatar-hover"
                  title="Clique para trocar a foto"
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
                  {/* Overlay no hover */}
                  <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s', borderRadius: '50%' }}>
                    <span style={{ fontSize: 16 }}>📷</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>{p.nome}</div>
                  {p.descricao
                    ? <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{p.descricao}</div>
                    : <div style={{ fontSize: 12, color: '#bbb', marginTop: 2, fontStyle: 'italic' }}>Sem descrição</div>
                  }
                  {p.foto_url
                    ? <div style={{ fontSize: 12, color: '#00C27C', marginTop: 4 }}>✓ Foto adicionada · clique no avatar para trocar</div>
                    : <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Clique no avatar para adicionar foto</div>
                  }
                </div>
              </div>

              <button onClick={() => excluir(p.id)}
                style={{ background: 'transparent', border: '1.5px solid #fecaca', color: '#dc2626', padding: '8px 16px', borderRadius: 100, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}