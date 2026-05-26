'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Configuracoes() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [telefone, setTelefone] = useState('')
  const [descricao, setDescricao] = useState('')

  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data } = await supabase
      .from('estabelecimentos')
      .select('*')
      .eq('userId', user.id)
      .maybeSingle()

    if (data) {
      setNome(data.nome || '')
      setSlug(data.slug || '')
      setTelefone(data.telefone || '')
      setDescricao(data.descricao || '')
    }
  }

  function gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
  }

  async function salvar() {
    setErro('')
    setSucesso(false)

    if (!nome || !slug) {
      setErro('Preencha nome e link.')
      return
    }

    setSalvando(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: existente } = await supabase
      .from('estabelecimentos')
      .select('id')
      .eq('userId', user!.id)
      .maybeSingle()

    let error

    if (existente) {
      const res = await supabase
        .from('estabelecimentos')
        .update({ nome, slug, telefone, descricao })
        .eq('userId', user!.id)
      error = res.error
    } else {
      const res = await supabase
        .from('estabelecimentos')
        .insert({ nome, slug, telefone, descricao, email: user!.email, userId: user!.id })
      error = res.error
    }

    if (error) {
      setErro(error.message)
      setSalvando(false)
      return
    }

    setSucesso(true)
    setSalvando(false)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F5F2',
        padding: '40px 24px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:wght@400;500;600&display=swap');
        input, textarea {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          font-size: 14px;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #00C27C;
        }
      `}</style>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 34, margin: 0, fontFamily: "'Instrument Serif', serif" }}>
              Configurações
            </h1>
            <p style={{ color: '#666', marginTop: 8 }}>Configure seu estabelecimento</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ border: '1px solid #ddd', background: '#fff', padding: '10px 18px', borderRadius: 999, cursor: 'pointer' }}
          >
            ← Voltar
          </button>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 24, padding: 28, border: '1px solid #eee' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <label>Nome do estabelecimento</label>
              <input
                type="text"
                value={nome}
                placeholder="Ex: Barbearia do João"
                onChange={(e) => { setNome(e.target.value); setSlug(gerarSlug(e.target.value)) }}
              />
            </div>

            <div>
              <label>Link personalizado</label>
              <input
                type="text"
                value={slug}
                placeholder="barbearia-do-joao"
                onChange={(e) => setSlug(gerarSlug(e.target.value))}
              />
              <p style={{ fontSize: 13, color: '#00C27C', marginTop: 8 }}>
                localhost:3000/agendar/{slug}
              </p>
            </div>

            <div>
              <label>Telefone</label>
              <input
                type="text"
                value={telefone}
                placeholder="(11) 99999-9999"
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div>
              <label>Descrição</label>
              <textarea
                rows={4}
                value={descricao}
                placeholder="Descreva seu estabelecimento..."
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            {erro && (
              <div style={{ background: '#FEF2F2', color: '#DC2626', padding: 14, borderRadius: 12, fontSize: 14 }}>
                {erro}
              </div>
            )}

            {sucesso && (
              <div style={{ background: '#F0FDF4', color: '#16A34A', padding: 14, borderRadius: 12, fontSize: 14 }}>
                Configurações salvas com sucesso!
              </div>
            )}

            <button
              onClick={salvar}
              disabled={salvando}
              style={{ background: '#00C27C', color: '#fff', border: 'none', padding: '16px', borderRadius: 999, fontWeight: 600, cursor: 'pointer', opacity: salvando ? 0.7 : 1 }}
            >
              {salvando ? 'Salvando...' : 'Salvar configurações'}
            </button>

          </div>
        </div>
      </div>
    </main>
  )
}