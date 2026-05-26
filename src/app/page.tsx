import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agenda Fácil — Seu negócio com agenda online em minutos',
  description: 'Chega de caderno e confusão de horários. Com o Agenda Fácil seu cliente agenda sozinho, 24 horas por dia.',
}

export default function Home() {
  return (
    <main style={{ fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A', overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow-x: hidden; }
        .serif { font-family: 'Instrument Serif', serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .animate-1 { animation: fadeUp .6s ease both; }
        .animate-2 { animation: fadeUp .7s .1s ease both; }
        .animate-3 { animation: fadeUp .7s .2s ease both; }
        .animate-4 { animation: fadeUp .7s .3s ease both; }
        .pulse { animation: pulse 2s infinite; }
        .step-card { transition: transform .2s; }
        .step-card:hover { transform: translateY(-4px); }
        .btn-primary { transition: all .25s; display: inline-block; text-decoration: none; }
        .btn-primary:hover { background: #008F5B !important; transform: translateY(-2px); }
        .btn-ghost { transition: all .25s; display: inline-block; text-decoration: none; }
        .btn-ghost:hover { border-color: #0A0A0A !important; background: #f9f9f9 !important; }
        .nav-btn { transition: all .2s; text-decoration: none; display: inline-block; }
        .nav-btn:hover { background: #00C27C !important; color: #fff !important; }
        a { text-decoration: none; }
        @media (max-width: 768px) {
          .hero-btns { flex-direction: column; align-items: center; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .logos-grid { gap: 20px !important; }
          nav { padding: 16px 20px !important; }
        }
      `}</style>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '20px 40px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid #eee'
      }}>
        <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22 }}>
          Agenda<span style={{ color: '#00C27C' }}>Fácil</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/auth/login" className="nav-btn" style={{
            color: '#666', padding: '10px 18px', borderRadius: 100,
            fontSize: 14, fontWeight: 500, border: '1.5px solid #eee',
            background: 'transparent'
          }}>
            Entrar
          </a>
          <a href="/auth/cadastro" className="nav-btn" style={{
            background: '#0A0A0A', color: '#fff', padding: '10px 22px',
            borderRadius: 100, fontSize: 14, fontWeight: 500
          }}>
            Assinar agora
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', textAlign: 'center',
        padding: '120px 40px 80px'
      }}>
        <div className="animate-1" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#F5F5F2', border: '1px solid #e0e0e0', padding: '8px 16px',
          borderRadius: 100, fontSize: 13, color: '#666', marginBottom: 32
        }}>
          <span className="pulse" style={{ width: 8, height: 8, background: '#00C27C', borderRadius: '50%', display: 'inline-block' }} />
          Mais de 500 estabelecimentos já utilizam
        </div>

        <h1 className="animate-2 serif" style={{
          fontSize: 'clamp(48px, 7vw, 90px)', lineHeight: 1.05, color: '#0A0A0A', maxWidth: 900
        }}>
          Seu negócio com{' '}
          <em style={{ color: '#00C27C', fontStyle: 'italic' }}>agenda online</em>
          {' '}em minutos
        </h1>

        <p className="animate-3" style={{
          fontSize: 'clamp(16px, 2vw, 20px)', color: '#666',
          maxWidth: 560, lineHeight: 1.6, marginTop: 24
        }}>
          Chega de caderno e confusão de horários. Com o Agenda Fácil seu cliente agenda sozinho, 24 horas por dia, sem precisar falar com ninguém.
        </p>

        <div className="animate-4 hero-btns" style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/auth/cadastro?trial=true" className="btn-primary" style={{
            background: '#00C27C', color: '#fff', padding: '16px 32px',
            borderRadius: 100, fontSize: 16, fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,194,124,.35)'
          }}>
            🎁 Testar grátis — 5 agendamentos
          </a>
          <a href="/auth/login" className="btn-ghost" style={{
            background: 'transparent', color: '#0A0A0A', padding: '16px 32px',
            borderRadius: 100, fontSize: 16, fontWeight: 500,
            border: '1.5px solid #ddd'
          }}>
            Já tenho uma conta
          </a>
        </div>

        <p style={{ marginTop: 16, fontSize: 13, color: '#bbb' }}>
          Sem cartão de crédito · 5 agendamentos gratuitos · Assine quando quiser
        </p>
      </section>

      {/* TIPOS DE NEGÓCIO */}
      <div style={{ padding: '40px', textAlign: 'center', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 12, color: '#bbb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Funciona para qualquer tipo de negócio</div>
        <div className="logos-grid" style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {['✂ Barbearias','💆 Salões','🐾 Petshops','🏥 Clínicas','💪 Academias','🦷 Consultórios'].map(item => (
            <span key={item} style={{ fontSize: 15, color: '#bbb', fontWeight: 600, letterSpacing: .5 }}>{item}</span>
          ))}
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <div style={{ padding: '100px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 12, color: '#00C27C', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, marginBottom: 16 }}>Como funciona</div>
        <div className="serif" style={{ fontSize: 'clamp(36px, 4vw, 54px)', lineHeight: 1.1, color: '#0A0A0A', maxWidth: 600 }}>
          Tudo pronto em <em style={{ fontStyle: 'italic', color: '#00C27C' }}>3 passos simples</em>
        </div>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 60 }}>
          {[
            { num: '01', icon: '⚡', title: 'Crie sua conta', text: 'Cadastre seu estabelecimento, adicione seus serviços, profissionais e horários de atendimento em minutos.' },
            { num: '02', icon: '🔗', title: 'Compartilhe seu link', text: 'Você recebe um link exclusivo como agendafacil.com/agendar/seu-negocio. Divulgue no Instagram, WhatsApp ou onde preferir.' },
            { num: '03', icon: '📅', title: 'Clientes agendam sozinhos', text: 'O cliente escolhe o serviço, o horário e o profissional. Recebe a confirmação por e-mail automaticamente. Simples assim.' },
          ].map(step => (
            <div key={step.num} className="step-card" style={{ padding: 32, borderRadius: 16, background: '#F5F5F2' }}>
              <div className="serif" style={{ fontSize: 48, color: '#e0e0e0', lineHeight: 1, marginBottom: 16 }}>{step.num}</div>
              <div style={{ width: 44, height: 44, background: '#00C27C', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>{step.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0A0A0A', marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{step.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PLANO */}
      <div style={{ background: '#F5F5F2', padding: '100px 40px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#00C27C', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, marginBottom: 16 }}>Plano e preço</div>
          <div className="serif" style={{ fontSize: 'clamp(36px, 4vw, 54px)', lineHeight: 1.1, color: '#0A0A0A', marginBottom: 48 }}>
            Simples e <em style={{ fontStyle: 'italic', color: '#00C27C' }}>sem surpresas</em>
          </div>

          <div style={{
            background: '#fff', borderRadius: 24, padding: 40,
            border: '2px solid #00C27C',
            boxShadow: '0 8px 40px rgba(0,194,124,.12)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
              background: '#00C27C', color: '#fff', padding: '4px 20px',
              borderRadius: 100, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap'
            }}>Tudo incluso — sem limites</div>

            <div className="serif" style={{ fontSize: 64, color: '#0A0A0A', lineHeight: 1, marginBottom: 4 }}>
              <sup style={{ fontSize: 22, verticalAlign: 'top', marginTop: 14, display: 'inline-block' }}>R$</sup>
              49,90
              <sub style={{ fontSize: 18, color: '#666' }}>/mês</sub>
            </div>

            <p style={{ fontSize: 15, color: '#666', margin: '16px 0 32px', lineHeight: 1.6 }}>
              Um plano único com tudo que você precisa para gerenciar sua agenda profissionalmente.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36, textAlign: 'left' }}>
              {[
                'Profissionais ilimitados',
                'Agendamentos ilimitados',
                'Link personalizado de agendamento',
                'Confirmação por e-mail automática',
                'Painel de gestão completo',
                'Cadastro de clientes',
                'Relatórios de faturamento',
                'Suporte por e-mail',
              ].map(f => (
                <li key={f} style={{ fontSize: 15, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#00C27C', fontWeight: 700, fontSize: 18 }}>✓</span> {f}
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="/auth/cadastro" style={{
                display: 'block', width: '100%', padding: '16px', borderRadius: 100,
                fontSize: 16, fontWeight: 600, background: '#0A0A0A', color: '#fff',
                textAlign: 'center', textDecoration: 'none'
              }}>
                Assinar agora — R$49,90/mês
              </a>
              <a href="/auth/cadastro?trial=true" style={{
                display: 'block', width: '100%', padding: '14px', borderRadius: 100,
                fontSize: 15, fontWeight: 500, background: 'transparent', color: '#00C27C',
                textAlign: 'center', textDecoration: 'none', border: '1.5px solid #00C27C'
              }}>
                🎁 Ou testar grátis — 5 agendamentos
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '120px 40px', textAlign: 'center', background: '#0A0A0A', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(0,194,124,.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <h2 className="serif" style={{ fontSize: 'clamp(40px, 5vw, 64px)', color: '#fff', lineHeight: 1.1, maxWidth: 700, margin: '0 auto 24px' }}>
          Pronto para <em style={{ color: '#00C27C', fontStyle: 'italic' }}>lotar sua agenda?</em>
        </h2>
        <p style={{ color: '#888', fontSize: 18, marginBottom: 40 }}>Comece grátis e assine quando estiver pronto.</p>
        <a href="/auth/cadastro?trial=true" className="btn-primary" style={{
          background: '#00C27C', color: '#fff', padding: '18px 40px',
          borderRadius: 100, fontSize: 18, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,194,124,.35)'
        }}>
          🎁 Começar teste grátis
        </a>
      </div>

      {/* FOOTER */}
      <footer style={{ padding: 40, textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
        <p style={{ fontSize: 13, color: '#bbb' }}>
          © 2025 <strong style={{ color: '#00C27C' }}>Agenda Fácil</strong> · Feito com ❤ no Brasil
        </p>
      </footer>

    </main>
  )
}