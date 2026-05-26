'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Horarios() {
  const supabase = createClient()
  const router = useRouter()

  const [dia, setDia] = useState('Segunda')
  const [abertura, setAbertura] = useState('08:00')
  const [fechamento, setFechamento] = useState('18:00')

  async function salvarHorario() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('horarios').insert({
      userId: user?.id,
      dia,
      abertura,
      fechamento,
    })

    alert('Horário salvo!')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F5F2',
        padding: 40,
      }}
    >
      <h1>Horários</h1>

      <div
        style={{
          background: '#fff',
          padding: 24,
          borderRadius: 20,
          maxWidth: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <select value={dia} onChange={(e) => setDia(e.target.value)}>
          <option>Segunda</option>
          <option>Terça</option>
          <option>Quarta</option>
          <option>Quinta</option>
          <option>Sexta</option>
          <option>Sábado</option>
          <option>Domingo</option>
        </select>

        <input
          type="time"
          value={abertura}
          onChange={(e) => setAbertura(e.target.value)}
        />

        <input
          type="time"
          value={fechamento}
          onChange={(e) => setFechamento(e.target.value)}
        />

        <button onClick={salvarHorario}>
          Salvar horário
        </button>

        <button onClick={() => router.push('/dashboard')}>
          Voltar
        </button>
      </div>
    </main>
  )
}