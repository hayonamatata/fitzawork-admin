'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Users, Package, ClipboardList, BookOpen, ListTodo } from 'lucide-react'

const nav = [
  { href: '/',           label: '대시보드',      icon: LayoutDashboard },
  { href: '/members',    label: '멤버 관리',      icon: Users },
  { href: '/events',     label: '이벤트 관리',    icon: CalendarDays },
  { href: '/supplies',   label: '비품 관리',      icon: Package },
  { href: '/checklist',  label: '해야할 리스트',  icon: ClipboardList },
  { href: '/manual',     label: '매뉴얼 가이드',  icon: BookOpen },
  { href: '/tasks',      label: '프로젝트 태스크', icon: ListTodo },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-60 min-h-screen bg-brand text-white flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-brand-mid">
        <p className="text-[11px] text-blue-100 tracking-widest mb-1">ADMIN</p>
        <h1 className="text-base font-bold leading-tight text-white">핏자워크라운지</h1>
        <p className="text-[11px] text-blue-100 mt-0.5">망원동 공유작업실</p>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
              ${path === href
                ? 'bg-white/20 text-white font-semibold'
                : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-brand-mid">
        <p className="text-[10px] text-blue-100">평일 자율석 · 주말 대관/이벤트</p>
      </div>
    </aside>
  )
}
