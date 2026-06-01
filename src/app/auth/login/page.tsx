'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [carregandoGoogle, setCarregandoGoogle] = useState(false)

  async function handleLogin() {
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) { setErro(error.message); setCarregando(false); return }
    router.push('/dashboard')
  }

  async function handleGoogle() {
    setCarregandoGoogle(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) { setErro(error.message); setCarregandoGoogle(false) }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', fontSize: 15,
    transition: 'all .2s', color: '#1a1a1a', background: '#fff',
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F2', padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        input:-webkit-autofill { -webkit-text-fill-color: #1a1a1a !important; -webkit-box-shadow: 0 0 0 1000px #fff inset !important; }
        input:focus { outline: none; border-color: #00C27C !important; box-shadow: 0 0 0 3px rgba(0,194,124,.15); }
        .btn-login:hover { background: #008F5B !important; }
        .btn-google:hover { background: #f3f4f6 !important; }
      `}</style>

      <div style={{ background: '#fff', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440, boxShadow: '0 4px 40px rgba(0,0,0,.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: '#1a1a1a' }}>
            Agenda<span style={{ color: '#00C27C' }}>Fácil</span>
          </div>
          <p style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Entre na sua conta para gerenciar sua agenda</p>
        </div>

        {/* ✅ Botão Google */}
        <button className="btn-google" onClick={handleGoogle} disabled={carregandoGoogle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 15, fontWeight: 500, color: '#333', cursor: carregandoGoogle ? 'not-allowed' : 'pointer', transition: 'all .2s', opacity: carregandoGoogle ? .7 : 1, marginBottom: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {carregandoGoogle ? 'Redirecionando...' : 'Entrar com Google'}
        </button>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ fontSize: 13, color: '#999' }}>ou entre com e-mail</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>E-mail</label>
            <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#333', display: 'block', marginBottom: 6 }}>Senha</label>
            <input type="password" placeholder="Sua senha" value={senha} onChange={e => setSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} style={inputStyle} />
          </div>

          {erro && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
              {erro}
            </div>
          )}

          <button className="btn-login" onClick={handleLogin} disabled={carregando}
            style={{ background: '#00C27C', color: '#fff', padding: '14px', borderRadius: 100, fontSize: 15, fontWeight: 600, cursor: carregando ? 'not-allowed' : 'pointer', border: 'none', opacity: carregando ? .7 : 1, marginTop: 4, transition: 'all .2s' }}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#666', marginTop: 24 }}>
          Ainda não tem conta?{' '}
          <a href="/auth/cadastro" style={{ color: '#00C27C', fontWeight: 600, textDecoration: 'none' }}>Criar conta grátis</a>
        </p>
      </div>
    </main>
  )
}