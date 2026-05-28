'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type Idioma = 'pt' | 'en' | 'es' | 'fr' | 'ar' | 'ja'

export const IDIOMAS = [
  { id: 'pt', label: 'Português', flag: '🇧🇷' },
  { id: 'en', label: 'English',   flag: '🇺🇸' },
  { id: 'es', label: 'Español',   flag: '🇪🇸' },
  { id: 'fr', label: 'Français',  flag: '🇫🇷' },
  { id: 'ar', label: 'العربية',   flag: '🇸🇦' },
  { id: 'ja', label: '日本語',     flag: '🇯🇵' },
]

export const TRADUCOES: Record<Idioma, Record<string, string>> = {
  pt: {
    painel: 'Painel', agendamentos: 'Agendamentos', servicos: 'Serviços',
    profissionais: 'Profissionais', clientes: 'Clientes', faturamento: 'Faturamento',
    configuracoes: 'Configurações', sair: 'Sair', copiarLink: 'Copiar link',
    estabelecimento: 'Estabelecimento', salvar: 'Salvar configurações',
    salvando: 'Salvando...', sucesso: '✓ Configurações salvas com sucesso!',
    infoBasicas: 'Informações básicas', horarioFunc: 'Horário de funcionamento',
    aparencia: 'Aparência e idioma', modoEscuro: 'Modo escuro',
    idioma: 'Idioma', voltar: '← Voltar',
    nomeEstab: 'Nome do estabelecimento', linkAgend: 'Link de agendamento',
    telefone: 'Telefone', descricao: 'Descrição', diasAtend: 'Dias de atendimento',
    abertura: 'Abertura', fechamento: 'Fechamento',
  },
  en: {
    painel: 'Dashboard', agendamentos: 'Appointments', servicos: 'Services',
    profissionais: 'Professionals', clientes: 'Clients', faturamento: 'Revenue',
    configuracoes: 'Settings', sair: 'Logout', copiarLink: 'Copy link',
    estabelecimento: 'Business', salvar: 'Save settings',
    salvando: 'Saving...', sucesso: '✓ Settings saved successfully!',
    infoBasicas: 'Basic information', horarioFunc: 'Business hours',
    aparencia: 'Appearance & language', modoEscuro: 'Dark mode',
    idioma: 'Language', voltar: '← Back',
    nomeEstab: 'Business name', linkAgend: 'Booking link',
    telefone: 'Phone', descricao: 'Description', diasAtend: 'Working days',
    abertura: 'Opening', fechamento: 'Closing',
  },
  es: {
    painel: 'Panel', agendamentos: 'Citas', servicos: 'Servicios',
    profissionais: 'Profesionales', clientes: 'Clientes', faturamento: 'Facturación',
    configuracoes: 'Configuración', sair: 'Salir', copiarLink: 'Copiar enlace',
    estabelecimento: 'Negocio', salvar: 'Guardar configuración',
    salvando: 'Guardando...', sucesso: '✓ ¡Configuración guardada con éxito!',
    infoBasicas: 'Información básica', horarioFunc: 'Horario de atención',
    aparencia: 'Apariencia e idioma', modoEscuro: 'Modo oscuro',
    idioma: 'Idioma', voltar: '← Volver',
    nomeEstab: 'Nombre del negocio', linkAgend: 'Enlace de reserva',
    telefone: 'Teléfono', descricao: 'Descripción', diasAtend: 'Días de atención',
    abertura: 'Apertura', fechamento: 'Cierre',
  },
  fr: {
    painel: 'Tableau de bord', agendamentos: 'Rendez-vous', servicos: 'Services',
    profissionais: 'Professionnels', clientes: 'Clients', faturamento: 'Facturation',
    configuracoes: 'Paramètres', sair: 'Déconnexion', copiarLink: 'Copier le lien',
    estabelecimento: 'Établissement', salvar: 'Enregistrer',
    salvando: 'Enregistrement...', sucesso: '✓ Paramètres enregistrés avec succès!',
    infoBasicas: 'Informations de base', horarioFunc: "Heures d'ouverture",
    aparencia: 'Apparence et langue', modoEscuro: 'Mode sombre',
    idioma: 'Langue', voltar: '← Retour',
    nomeEstab: "Nom de l'établissement", linkAgend: 'Lien de réservation',
    telefone: 'Téléphone', descricao: 'Description', diasAtend: 'Jours de travail',
    abertura: 'Ouverture', fechamento: 'Fermeture',
  },
  ar: {
    painel: 'لوحة التحكم', agendamentos: 'المواعيد', servicos: 'الخدمات',
    profissionais: 'المهنيون', clientes: 'العملاء', faturamento: 'الفواتير',
    configuracoes: 'الإعدادات', sair: 'تسجيل الخروج', copiarLink: 'نسخ الرابط',
    estabelecimento: 'المنشأة', salvar: 'حفظ الإعدادات',
    salvando: 'جارٍ الحفظ...', sucesso: '✓ تم حفظ الإعدادات بنجاح!',
    infoBasicas: 'المعلومات الأساسية', horarioFunc: 'ساعات العمل',
    aparencia: 'المظهر واللغة', modoEscuro: 'الوضع الداكن',
    idioma: 'اللغة', voltar: 'رجوع →',
    nomeEstab: 'اسم المنشأة', linkAgend: 'رابط الحجز',
    telefone: 'الهاتف', descricao: 'الوصف', diasAtend: 'أيام العمل',
    abertura: 'الافتتاح', fechamento: 'الإغلاق',
  },
  ja: {
    painel: 'ダッシュボード', agendamentos: '予約', servicos: 'サービス',
    profissionais: 'スタッフ', clientes: 'お客様', faturamento: '売上',
    configuracoes: '設定', sair: 'ログアウト', copiarLink: 'リンクをコピー',
    estabelecimento: '店舗', salvar: '設定を保存',
    salvando: '保存中...', sucesso: '✓ 設定が正常に保存されました！',
    infoBasicas: '基本情報', horarioFunc: '営業時間',
    aparencia: '外観と言語', modoEscuro: 'ダークモード',
    idioma: '言語', voltar: '← 戻る',
    nomeEstab: '店舗名', linkAgend: '予約リンク',
    telefone: '電話番号', descricao: '説明', diasAtend: '営業日',
    abertura: '開店', fechamento: '閉店',
  },
}

interface PreferencesContextType {
  darkMode: boolean
  setDarkMode: (v: boolean) => void
  idioma: Idioma
  setIdioma: (v: Idioma) => void
  t: (key: string) => string
}

const PreferencesContext = createContext<PreferencesContextType>({
  darkMode: false,
  setDarkMode: () => {},
  idioma: 'pt',
  setIdioma: () => {},
  t: (k) => k,
})

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkModeState] = useState(false)
  const [idioma, setIdiomaState] = useState<Idioma>('pt')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true'
    const savedIdioma = (localStorage.getItem('idioma') as Idioma) || 'pt'
    setDarkModeState(savedDark)
    setIdiomaState(savedIdioma)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('idioma', idioma)
    document.documentElement.setAttribute('lang', idioma)
    document.documentElement.setAttribute('dir', idioma === 'ar' ? 'rtl' : 'ltr')
  }, [idioma, mounted])

  function setDarkMode(v: boolean) { setDarkModeState(v) }
  function setIdioma(v: Idioma) { setIdiomaState(v) }
  function t(key: string) { return TRADUCOES[idioma]?.[key] ?? TRADUCOES['pt'][key] ?? key }

  if (!mounted) return <>{children}</>

  return (
    <PreferencesContext.Provider value={{ darkMode, setDarkMode, idioma, setIdioma, t }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  return useContext(PreferencesContext)
}