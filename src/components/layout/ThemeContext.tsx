'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Idioma = 'pt' | 'en' | 'es' | 'fr' | 'ar' | 'jp'

interface ThemeContextType {
  darkMode: boolean
  toggleDarkMode: () => void
  idioma: Idioma
  setIdioma: (i: Idioma) => void
  t: (key: string) => string
}

const traducoes: Record<Idioma, Record<string, string>> = {
  pt: {
    painel: 'Painel', agendamentos: 'Agendamentos', servicos: 'Serviços',
    profissionais: 'Profissionais', clientes: 'Clientes', faturamento: 'Faturamento',
    configuracoes: 'Configurações', sair: 'Sair', copiar_link: 'Copiar link',
    hoje: 'Agendamentos hoje', clientes_label: 'Clientes cadastrados',
    faturamento_mes: 'Faturamento do mês', resumo: 'Aqui está um resumo do seu estabelecimento hoje.',
    ola: 'Olá', bem_vindo: 'Bem-vindo',
  },
  en: {
    painel: 'Dashboard', agendamentos: 'Appointments', servicos: 'Services',
    profissionais: 'Professionals', clientes: 'Clients', faturamento: 'Revenue',
    configuracoes: 'Settings', sair: 'Logout', copiar_link: 'Copy link',
    hoje: 'Appointments today', clientes_label: 'Registered clients',
    faturamento_mes: 'Monthly revenue', resumo: "Here's a summary of your business today.",
    ola: 'Hello', bem_vindo: 'Welcome',
  },
  es: {
    painel: 'Panel', agendamentos: 'Citas', servicos: 'Servicios',
    profissionais: 'Profesionales', clientes: 'Clientes', faturamento: 'Facturación',
    configuracoes: 'Configuración', sair: 'Salir', copiar_link: 'Copiar enlace',
    hoje: 'Citas hoy', clientes_label: 'Clientes registrados',
    faturamento_mes: 'Facturación del mes', resumo: 'Aquí hay un resumen de tu negocio hoy.',
    ola: 'Hola', bem_vindo: 'Bienvenido',
  },
  fr: {
    painel: 'Tableau de bord', agendamentos: 'Rendez-vous', servicos: 'Services',
    profissionais: 'Professionnels', clientes: 'Clients', faturamento: 'Chiffre d\'affaires',
    configuracoes: 'Paramètres', sair: 'Déconnexion', copiar_link: 'Copier le lien',
    hoje: 'Rendez-vous aujourd\'hui', clientes_label: 'Clients enregistrés',
    faturamento_mes: 'Chiffre d\'affaires du mois', resumo: 'Voici un résumé de votre entreprise aujourd\'hui.',
    ola: 'Bonjour', bem_vindo: 'Bienvenue',
  },
  ar: {
    painel: 'لوحة التحكم', agendamentos: 'المواعيد', servicos: 'الخدمات',
    profissionais: 'المهنيون', clientes: 'العملاء', faturamento: 'الإيرادات',
    configuracoes: 'الإعدادات', sair: 'تسجيل الخروج', copiar_link: 'نسخ الرابط',
    hoje: 'مواعيد اليوم', clientes_label: 'العملاء المسجلون',
    faturamento_mes: 'إيرادات الشهر', resumo: 'إليك ملخص عملك اليوم.',
    ola: 'مرحبا', bem_vindo: 'أهلاً وسهلاً',
  },
  jp: {
    painel: 'ダッシュボード', agendamentos: '予約', servicos: 'サービス',
    profissionais: 'スタッフ', clientes: 'クライアント', faturamento: '売上',
    configuracoes: '設定', sair: 'ログアウト', copiar_link: 'リンクをコピー',
    hoje: '今日の予約', clientes_label: '登録クライアント',
    faturamento_mes: '月間売上', resumo: '今日のビジネスの概要です。',
    ola: 'こんにちは', bem_vindo: 'ようこそ',
  },
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
  idioma: 'pt',
  setIdioma: () => {},
  t: (key) => key,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false)
  const [idioma, setIdiomaState] = useState<Idioma>('pt')

  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true'
    const savedIdioma = (localStorage.getItem('idioma') as Idioma) || 'pt'
    setDarkMode(savedDark)
    setIdiomaState(savedIdioma)
  }, [])

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode))
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  function toggleDarkMode() {
    setDarkMode(prev => !prev)
  }

  function setIdioma(i: Idioma) {
    setIdiomaState(i)
    localStorage.setItem('idioma', i)
  }

  function t(key: string): string {
    return traducoes[idioma]?.[key] ?? traducoes['pt'][key] ?? key
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, idioma, setIdioma, t }}>
      <div style={{
        '--bg': darkMode ? '#0f0f0f' : '#F5F5F2',
        '--bg-card': darkMode ? '#1a1a1a' : '#ffffff',
        '--bg-sidebar': darkMode ? '#111111' : '#ffffff',
        '--text': darkMode ? '#f0f0f0' : '#0A0A0A',
        '--text-muted': darkMode ? '#888888' : '#666666',
        '--border': darkMode ? '#2a2a2a' : '#eeeeee',
        '--input-bg': darkMode ? '#222222' : '#ffffff',
        '--input-border': darkMode ? '#333333' : '#e5e7eb',
        background: 'var(--bg)',
        minHeight: '100vh',
        transition: 'background .3s',
      } as React.CSSProperties}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}