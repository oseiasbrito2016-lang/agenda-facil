'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Cadastro() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleCadastro() {
    setErro('')
    setCarregando(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      }
    })

    if (error) {
      setErro(error.message)
      setCarregando(false)
      return
    }

    if (data.user) {
      router.push('/dashboard')
      return
    }

    setErro('Verifique seu e-mail para confirmar o cadastro.')
    setCarregando(false)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F2', padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        input:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
      `}</style>

      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440, boxShadow: '0 4px 40px rgba(0,0,0,.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26 }}>
            Agenda<span style={{ color: '#00C27C' }}>Fácil</span>
          </div>
          <p style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Crie sua conta e comece a receber agendamentos</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Nome do estabelecimento</label>
            <input type="text" placeholder="Ex: Barbearia do João" value={nome} onChange={e => setNome(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, transition: 'all .2s' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, transition: 'all .2s' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Senha</label>
            <input type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCadastro()}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 15, transition: 'all .2s' }} />
          </div>

          {erro && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
              {erro}
            </div>
          )}

          <button onClick={handleCadastro} disabled={carregando}
            style={{ background: '#00C27C', color: '#fff', padding: 14, borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: carregando ? 'not-allowed' : 'pointer', border: 'none', opacity: carregando ? .7 : 1, marginTop: 4, transition: 'all .2s' }}>
            {carregando ? 'Criando conta...' : 'Criar conta'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#666', marginTop: 24 }}>
          Já tem uma conta?{' '}
          <a href="/auth/login" style={{ color: '#00C27C', fontWeight: 600, textDecoration: 'none' }}>Fazer login</a>
        </p>
      </div>
    </main>
  )
}