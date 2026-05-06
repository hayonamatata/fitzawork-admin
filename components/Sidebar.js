'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Users, Megaphone, Image } from 'lucide-react'

const nav = [
  { href: '/',            label: '대시보드',    icon: LayoutDashboard },
  { href: '/events',      label: '이벤트 관리', icon: CalendarDays },
  { href: '/membership',  label: '멤버십 관리', icon: Users },
  { href: '/sns',         label: 'SNS 콘텐츠',  icon: Image },
  { href: '/promotions',  label: '프로모션',    icon: Megaphone },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-60 min-h-screen bg-brand text-white flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-brand-mid">
        <p className="text-[11px] text-green-300 tracking-widest mb-1">ADMIN</p>
        <h1 className="text-base font-bold leading-tight">핏자워크라운지</h1>
        <p className="text-[11px] text-green-400 mt-0.5">망원동 공유작업실</p>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
              ${path === href
                ? 'bg-brand-mid text-white font-semibold'
                : 'text-green-200 hover:bg-brand-mid/60 hover:text-white'}`}>
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-brand-mid">
        <p className="text-[10px] text-green-500">평일 자율석 · 주말 대관/이벤트</p>
      </div>
    </aside>
  )
}
