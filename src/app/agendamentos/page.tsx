'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Agendamentos() {
  const supabase = createClient()

  const [agendamentos, setAgendamentos] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('userId', user?.id)
      .order('created_at', { ascending: false })

    setAgendamentos(data || [])
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F5F5F2',
        padding: 40,
      }}
    >
      <h1>Agendamentos</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginTop: 24,
        }}
      >
        {agendamentos.map((item) => (
          <div
            key={item.id}
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 20,
            }}
          >
            <h3>{item.cliente}</h3>

            <p>{item.telefone}</p>

            <p>
              {item.data} às {item.horario}
            </p>

            <p>Status: {item.status}</p>
          </div>
        ))}
      </div>
    </main>
  )
}