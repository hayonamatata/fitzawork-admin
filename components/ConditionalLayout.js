'use client'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function ConditionalLayout({ children }) {
  const path = usePathname()
  if (path.startsWith('/share')) {
    return <>{children}</>
  }
  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </>
  )
}
