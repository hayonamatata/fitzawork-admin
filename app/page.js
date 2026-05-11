'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CalendarDays, Users, TrendingUp, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLOR = { 확정: 'bg-green-100 text-green-700', 기획중: 'bg-blue-100 text-blue-700', 완료: 'bg-gray-100 text-gray-500' }

const EVENT_TYPE_STYLE = {
  '대관':             { bar: 'bg-purple-400', bg: 'bg-purple-100', text: 'text-purple-700' },
  '크리에이터 전시/팝업': { bar: 'bg-orange-400', bg: 'bg-orange-100', text: 'text-orange-700' },
  '프로그램':          { bar: 'bg-blue-400',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
}

export default function Dashboard() {
  const [events,     setEvents]     = useState([])
  const [membership, setMembership] = useState(null)
  const [monthVisit, setMonthVisit] = useState(0)
  const [allVisits,  setAllVisits]  = useState([])
  const [memberCount, setMemberCount] = useState(0)
  const [needRefill,  setNeedRefill]  = useState(0)
  const [calMonth,    setCalMonth]    = useState(new Date())

  const now       = new Date()
  const thisMonth = now.getMonth() + 1
  const thisYear  = now.getFullYear()

  useEffect(() => {
    const load = async () => {
      const [{ data: ev }, { data: mem }, { data: vis }, { data: members }, { data: supplies }] = await Promise.all([
        supabase.from('events').select('*').order('start_date'),
        supabase.from('membership_monthly').select('*').eq('year', thisYear).eq('month', thisMonth).single(),
        supabase.from('daily_visits').select('*'),
        supabase.from('members').select('id').eq('status', '활성'),
        supabase.from('supplies').select('current_qty, min_qty'),
      ])
      setEvents(ev || [])
      setMembership(mem)
      const thisM = (vis || []).filter(v => v.visit_date?.startsWith(`${thisYear}-${String(thisMonth).padStart(2,'0')}`))
      setMonthVisit(thisM.reduce((s, r) => s + (r.visitor_count || 0), 0))
      setAllVisits(vis || [])
      setMemberCount((members || []).length)
      setNeedRefill((supplies || []).filter(s => s.current_qty <= s.min_qty).length)
    }
    load()
  }, [])

  // 캘린더 계산
  const calYear  = calMonth.getFullYear()
  const calMon   = calMonth.getMonth()
  const firstDay = new Date(calYear, calMon, 1).getDay()
  const daysInMon = new Date(calYear, calMon + 1, 0).getDate()
  const todayStr  = now.toISOString().slice(0, 10)

  const eventsForDay = (dateStr) =>
    events.filter(e => {
      if (e.status === '완료') return false
      if (e.day_of_week) {
        const idx = new Date(dateStr + 'T12:00:00').getDay()
        return e.day_of_week === ['일','월','화','수','목','금','토'][idx]
      }
      return e.start_date <= dateStr && (e.end_date || e.start_date) >= dateStr
    })

  const visitForDay = (dateStr) => allVisits.find(v => v.visit_date === dateStr)

  const upcoming = events
    .filter(e => e.start_date >= todayStr && e.status !== '완료')
    .slice(0, 4)

  const stats = [
    { label: '활성 멤버',       value: `${memberCount}명`,                      icon: Users,       color: 'text-brand' },
    { label: '이번 달 1개월권', value: `${membership?.monthly_pass_count ?? '-'}명`, icon: TrendingUp,  color: 'text-blue-600' },
    { label: '이번 달 1일권 방문', value: `${monthVisit}회`,                     icon: CalendarDays, color: 'text-orange-500' },
    { label: '비품 리필 필요',  value: needRefill > 0 ? `${needRefill}개` : '없음', icon: Package, color: needRefill > 0 ? 'text-yellow-500' : 'text-gray-400' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
        <p className="text-sm text-gray-500 mt-1">{thisYear}년 {thisMonth}월 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`${color} mb-3`}><Icon size={22} /></div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* 캘린더 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* 월 이동 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={() => setCalMonth(new Date(calYear, calMon - 1, 1))}
            className="text-gray-400 hover:text-brand p-1 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-base font-bold text-gray-800">{calYear}년 {calMon + 1}월</h3>
          <button onClick={() => setCalMonth(new Date(calYear, calMon + 1, 1))}
            className="text-gray-400 hover:text-brand p-1 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {['일','월','화','수','목','금','토'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold py-2.5
              ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e${i}`} className="border-b border-r border-gray-50 h-28" />
          ))}
          {Array.from({ length: daysInMon }).map((_, i) => {
            const day      = i + 1
            const col      = (firstDay + i) % 7
            const dateStr  = `${calYear}-${String(calMon + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const dayEvs   = eventsForDay(dateStr)
            const visit    = visitForDay(dateStr)
            const isToday  = dateStr === todayStr

            return (
              <div key={day}
                className={`border-b border-r border-gray-50 h-28 p-1.5 min-w-0
                  ${col === 0 ? 'bg-red-50/20' : col === 6 ? 'bg-blue-50/10' : ''}`}>
                <p className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? 'bg-brand text-white' : col === 0 ? 'text-red-400' : col === 6 ? 'text-blue-400' : 'text-gray-600'}`}>
                  {day}
                </p>
                <div className="space-y-0.5 overflow-hidden">
                  {dayEvs.slice(0, 2).map(ev => {
                    const style = EVENT_TYPE_STYLE[ev.type] || { bg: 'bg-gray-100', text: 'text-gray-600' }
                    return (
                      <Link key={ev.id} href={`/events/${ev.id}`}>
                        <div className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate leading-tight ${style.bg} ${style.text}`}>
                          {ev.name}
                        </div>
                      </Link>
                    )
                  })}
                  {dayEvs.length > 2 && (
                    <p className="text-[9px] text-gray-400 pl-1">+{dayEvs.length - 2}개 더</p>
                  )}
                  {visit && (
                    <div className="text-[10px] text-brand font-bold px-1.5 py-0.5 bg-brand/10 rounded leading-tight">
                      방문 {visit.visitor_count}명
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 범례 */}
        <div className="px-5 py-3 border-t border-gray-50 flex gap-4 flex-wrap">
          {Object.entries(EVENT_TYPE_STYLE).map(([type, s]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={`w-3 h-3 rounded ${s.bg}`} />{type}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded bg-brand/10" />원데이 방문
          </div>
        </div>
      </div>

      {/* 다가오는 이벤트 */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">다가오는 이벤트</h3>
          <div className="space-y-1">
            {upcoming.map(ev => (
              <Link key={ev.id} href={`/events/${ev.id}`}>
                <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/60 -mx-2 px-2 rounded-lg cursor-pointer transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{ev.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ev.start_date}{ev.end_date && ev.end_date !== ev.start_date ? ` ~ ${ev.end_date}` : ''}
                      {ev.time && ` · ${ev.time}`}{ev.partner && ` · ${ev.partner}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[ev.status] || 'bg-gray-100 text-gray-500'}`}>
                    {ev.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
