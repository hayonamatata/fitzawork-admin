'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const STATUS_COLOR = {
  미시작: 'bg-gray-100 text-gray-500',
  진행중: 'bg-blue-100 text-blue-600',
  완료:   'bg-green-100 text-green-700',
  보류:   'bg-red-100 text-red-400',
}

export default function SharePage() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    const load = async () => {
      const [{ data: ev }, { data: ts }] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('event_tasks').select('*').eq('event_id', id).order('order_num'),
      ])
      setEvent(ev)
      setTasks(ts || [])
    }
    load()
  }, [id])

  const cycleStatus = async (t) => {
    const next = { 미시작: '진행중', 진행중: '완료', 완료: '보류', 보류: '미시작' }
    const newStatus = next[t.status]
    await supabase.from('event_tasks').update({ status: newStatus }).eq('id', t.id)
    setTasks(prev => prev.map(task => task.id === t.id ? { ...task, status: newStatus } : task))
  }

  const done     = tasks.filter(t => t.status === '완료').length
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  if (!event) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-brand px-6 py-5">
        <p className="text-xs text-white/60 mb-0.5 tracking-wider">핏자워크라운지</p>
        <h1 className="text-lg font-bold text-white">{event.name}</h1>
        <p className="text-sm text-white/70 mt-0.5">
          {event.start_date}
          {event.end_date && event.end_date !== event.start_date ? ` ~ ${event.end_date}` : ''}
          {event.day_of_week && ` · 매주 ${event.day_of_week}요일`}
          {event.time && ` · ${event.time}`}
        </p>
      </div>

      <div className="p-5 max-w-lg mx-auto">
        {/* 진행률 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">전체 진행률</span>
            <span className="font-bold text-brand">{done}/{tasks.length} 완료 · {progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-brand h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 태스크 목록 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">준비 태스크</h2>
            <p className="text-xs text-gray-400 mt-0.5">상태 버튼을 눌러 업데이트해주세요</p>
          </div>
          <div className="divide-y divide-gray-50">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-4">
                <button onClick={() => cycleStatus(t)}
                  className={`text-xs px-2.5 py-1.5 rounded-full font-semibold shrink-0 transition-all active:scale-95 ${STATUS_COLOR[t.status]}`}>
                  {t.status}
                </button>
                <p className={`flex-1 text-sm ${t.status === '완료' ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                  {t.name}
                </p>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-10">태스크가 없습니다</p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">powered by 핏자워크라운지</p>
      </div>
    </div>
  )
}
