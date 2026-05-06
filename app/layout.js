import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata = { title: '핏자워크라운지 어드민', description: '망원동 공유작업실 관리 대시보드' }

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
