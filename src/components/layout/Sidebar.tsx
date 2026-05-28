'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import { usePreferences } from '@/lib/preferences'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { darkMode, t } = usePreferences()
  const [notificacoes, setNotificacoes] = useState(0)
  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [recolhida, setRecolhida] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showLogoMenu, setShowLogoMenu] = useState(false)
  const logoMenuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const bg = darkMode ? '#141414' : '#fff'
  const border = darkMode ? '#2a2a2a' : '#eee'
  const text = darkMode ? '#f0f0f0' : '#0A0A0A'
  const text2 = darkMode ? '#aaa' : '#555'
  const text3 = darkMode ? '#666' : '#999'
  const hoverBg = darkMode ? 'rgba(0,194,124,0.12)' : 'rgba(0,194,124,0.08)'
  const menuBg = darkMode ? '#1e1e1e' : '#fff'
  const menuItemHover = darkMode ? '#2a2a2a' : '#f5f5f5'

  useEffect(() => {
    carregarDados()
    function handleClickOutside(e: MouseEvent) {
      if (logoMenuRef.current && !logoMenuRef.current.contains(e.target as Node)) {
        setShowLogoMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: estab } = await supabase
      .from('estabelecimentos')
      .select('*')
      .eq('userId', user.id)
      .single()

    if (!estab) return
    setEstabelecimento(estab)

    if (estab.logoUrl) {
      setLogoUrl(estab.logoUrl)
    } else {
      const savedLogo = localStorage.getItem(`logo_${estab.id}`)
      if (savedLogo) setLogoUrl(savedLogo)
    }

    const { data: pendentes } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('estabelecimentoId', estab.id)
      .eq('status', 'PENDENTE')

    setNotificacoes(pendentes?.length ?? 0)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !estabelecimento) return

    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(file.type)) { alert('Formato não suportado. Use PNG, JPG, WebP ou SVG.'); return }
    if (file.size > 2 * 1024 * 1024) { alert('Arquivo muito grande. Máximo 2MB.'); return }

    setUploadingLogo(true)
    setShowLogoMenu(false)

    try {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        setLogoUrl(dataUrl)
        localStorage.setItem(`logo_${estabelecimento.id}`, dataUrl)
      }
      reader.readAsDataURL(file)

      const ext = file.name.split('.').pop()
      const path = `logos/${estabelecimento.id}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('estabelecimentos')
        .upload(path, file, { upsert: true })

      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from('estabelecimentos').getPublicUrl(path)
        setLogoUrl(publicUrl)
        localStorage.setItem(`logo_${estabelecimento.id}`, publicUrl)
        await supabase.from('estabelecimentos').update({ logoUrl: publicUrl }).eq('id', estabelecimento.id)
      }
    } catch (err) {
      console.error('Erro ao enviar logo:', err)
    } finally {
      setUploadingLogo(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleRemoveLogo() {
    setLogoUrl(null)
    setShowLogoMenu(false)
    if (estabelecimento) {
      localStorage.removeItem(`logo_${estabelecimento.id}`)
      supabase.from('estabelecimentos').update({ logoUrl: null }).eq('id', estabelecimento.id).then(() => {})
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const menuItems = [
    { icon: '🏠', labelKey: 'painel',        href: '/dashboard' },
    { icon: '📅', labelKey: 'agendamentos',  href: '/dashboard/agendamentos', badge: notificacoes },
    { icon: '✂️', labelKey: 'servicos',      href: '/dashboard/servicos' },
    { icon: '👥', labelKey: 'profissionais', href: '/dashboard/profissionais' },
    { icon: '👤', labelKey: 'clientes',      href: '/dashboard/clientes' },
    { icon: '💰', labelKey: 'faturamento',   href: '/dashboard/faturamento' },
    { icon: '⚙️', labelKey: 'configuracoes', href: '/dashboard/configuracoes' },
  ]

  const inicial = estabelecimento?.nome?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        .sidebar-item { transition: all .15s; cursor: pointer; }
        .sidebar-item:hover { background: ${hoverBg} !important; color: #00C27C !important; }
        .sidebar-item.active { background: ${hoverBg} !important; color: #00C27C !important; }
        .toggle-btn:hover { background: ${darkMode ? '#2a2a2a' : '#f0f0f0'} !important; }
        .logo-avatar { transition: all .2s; }
        .logo-avatar:hover .logo-overlay { opacity: 1 !important; }
        .logo-menu-item:hover { background: ${menuItemHover} !important; }
        .logo-menu-item.danger:hover { background: ${darkMode ? '#2d0a0a' : '#fef2f2'} !important; color: #ef4444 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinning { animation: spin 1s linear infinite; display: inline-block; }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={handleLogoUpload}
        style={{ display: 'none' }}
      />

      <aside style={{
        width: recolhida ? 72 : 240,
        minHeight: '100vh',
        background: bg,
        borderRight: `1px solid ${border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width .25s ease, background .2s',
        position: 'fixed',
        top: 0, left: 0,
        zIndex: 50,
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{ padding: recolhida ? '20px 0' : '24px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: recolhida ? 'center' : 'space-between' }}>
          {!recolhida && (
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, whiteSpace: 'nowrap', color: text }}>
              Agenda<span style={{ color: '#00C27C' }}>Fácil</span>
            </div>
          )}
          <button className="toggle-btn" onClick={() => setRecolhida(!recolhida)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, fontSize: 16, color: text3, transition: 'background .2s' }}>
            {recolhida ? '→' : '←'}
          </button>
        </div>

        {/* Estabelecimento + logo */}
        {estabelecimento && (
          <div style={{ padding: recolhida ? '16px 0' : '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: recolhida ? 0 : 12, justifyContent: recolhida ? 'center' : 'flex-start' }}>
            <div ref={logoMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
              <div className="logo-avatar" onClick={() => !uploadingLogo && setShowLogoMenu(v => !v)}
                style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', cursor: uploadingLogo ? 'default' : 'pointer', border: `2px solid ${border}`, position: 'relative', background: logoUrl ? bg : '#00C27C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {uploadingLogo ? (
                  <span className="spinning" style={{ fontSize: 18 }}>⟳</span>
                ) : logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
                    <div className="logo-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s' }}>
                      <span style={{ fontSize: 14 }}>✏️</span>
                    </div>
                  </>
                ) : (
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{inicial}</span>
                )}
              </div>

              {showLogoMenu && (
                <div style={{ position: 'absolute', top: 46, left: 0, background: menuBg, border: `1px solid ${border}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 180, overflow: 'hidden', padding: '6px 0' }}>
                  <div className="logo-menu-item" onClick={() => { setShowLogoMenu(false); fileInputRef.current?.click() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: text, cursor: 'pointer', transition: 'background .15s' }}>
                    <span>📁</span><span>{logoUrl ? 'Trocar logo' : 'Adicionar logo'}</span>
                  </div>
                  {logoUrl && (
                    <div className="logo-menu-item danger" onClick={handleRemoveLogo}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', fontSize: 13, color: '#ef4444', cursor: 'pointer', transition: 'background .15s' }}>
                      <span>🗑️</span><span>Remover logo</span>
                    </div>
                  )}
                  <div style={{ padding: '6px 14px 4px', borderTop: `1px solid ${border}`, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: text3 }}>PNG, JPG, SVG — máx. 2MB</span>
                  </div>
                </div>
              )}
            </div>

            {!recolhida && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{t('estabelecimento')}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {estabelecimento.nome}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navegação */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map(item => {
            const ativo = pathname === item.href
            return (
              <div key={item.href} className={`sidebar-item${ativo ? ' active' : ''}`}
                onClick={() => router.push(item.href)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: recolhida ? '10px 0' : '10px 12px', borderRadius: 10, justifyContent: recolhida ? 'center' : 'flex-start', color: ativo ? '#00C27C' : text2, fontWeight: ativo ? 600 : 400, fontSize: 14, position: 'relative' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {!recolhida && <span style={{ whiteSpace: 'nowrap' }}>{t(item.labelKey)}</span>}
                {item.badge && item.badge > 0 && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 100, marginLeft: 'auto', flexShrink: 0 }}>
                    {item.badge}
                  </span>
                )}
              </div>
            )
          })}
        </nav>

        {/* Link público */}
        {!recolhida && estabelecimento && (
          <div style={{ padding: '12px 10px', borderTop: `1px solid ${border}` }}>
            <div onClick={() => { navigator.clipboard.writeText(window.location.origin + '/agendar/' + estabelecimento.slug); alert('Link copiado!') }}
              style={{ padding: '10px 12px', borderRadius: 10, background: '#00C27C15', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔗</span>
              <div>
                <div style={{ fontSize: 11, color: '#00C27C', fontWeight: 600 }}>{t('copiarLink')}</div>
                <div style={{ fontSize: 10, color: text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                  /agendar/{estabelecimento.slug}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${border}` }}>
          <div className="sidebar-item" onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: recolhida ? '10px 0' : '10px 12px', borderRadius: 10, color: text3, fontSize: 14, justifyContent: recolhida ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 18 }}>🚪</span>
            {!recolhida && <span>{t('sair')}</span>}
          </div>
        </div>
      </aside>
    </>
  )
}