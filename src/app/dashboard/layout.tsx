import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5F2' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240, transition: 'margin-left .25s ease' }}>
        {children}
      </div>
    </div>
  )
}