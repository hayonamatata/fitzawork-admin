'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CalendarDays, Users, TrendingUp, Package } from 'lucide-react'

const STATUS_COLOR = { 확정: 'bg-green-100 text-green-700', 기획중: 'bg-blue-100 text-blue-700', 완료: 'bg-gray-100 text-gray-500' }

export default function Dashboard() {
  const [events, setEvents] = useState([])
  const [membership, setMembership] = useState(null)
  const [visits, setVisits] = useState(0)
  const [memberCount, setMemberCount] = useState(0)
  const [needRefill, setNeedRefill] = useState(0)
  const now = new Date()
  const thisMonth = now.getMonth() + 1
  const thisYear = now.getFullYear()

  useEffect(() => {
    const load = async () => {
      const [{ data: ev }, { data: mem }, { data: vis }, { data: members }, { data: supplies }] = await Promise.all([
        supabase.from('events').select('*').order('start_date'),
        supabase.from('membership_monthly').select('*').eq('year', thisYear).eq('month', thisMonth).single(),
        supabase.from('daily_visits').select('visitor_count').gte('visit_date', `${thisYear}-${String(thisMonth).padStart(2,'0')}-01`),
        supabase.from('members').select('id').eq('status', '활성'),
        supabase.from('supplies').select('current_qty, min_qty'),
      ])
      setEvents(ev || [])
      setMembership(mem)
      setVisits((vis || []).reduce((s, r) => s + (r.visitor_count || 0), 0))
      setMemberCount((members || []).length)
      setNeedRefill((supplies || []).filter(s => s.current_qty <= s.min_qty).length)
    }
    load()
  }, [])

  const upcoming = events.filter(e => e.start_date >= new Date().toISOString().slice(0, 10) && e.status !== '완료').slice(0, 4)

  const stats = [
    { label: '활성 멤버', value: `${memberCount}명`, icon: Users, color: 'text-brand' },
    { label: '이번 달 1개월권', value: `${membership?.monthly_pass_count ?? '-'}명`, icon: TrendingUp, color: 'text-blue-600' },
    { label: '이번 달 1일권 방문', value: `${visits}회`, icon: CalendarDays, color: 'text-orange-500' },
    { label: '비품 리필 필요', value: needRefill > 0 ? `${needRefill}개` : '없음', icon: Package, color: needRefill > 0 ? 'text-yellow-500' : 'text-gray-400' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
        <p className="text-sm text-gray-500 mt-1">{thisYear}년 {thisMonth}월 현황</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`${color} mb-3`}><Icon size={22} /></div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-bold text-gray-800 mb-4">다가오는 이벤트</h3>
        {upcoming.length === 0
          ? <p className="text-sm text-gray-400">등록된 이벤트가 없습니다</p>
          : <div className="space-y-3">
              {upcoming.map(ev => (
                <div key={ev.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{ev.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ev.start_date} {ev.time && `· ${ev.time}`} {ev.partner && `· ${ev.partner}`}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[ev.status] || 'bg-gray-100 text-gray-500'}`}>
                    {ev.status}
                  </span>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}
