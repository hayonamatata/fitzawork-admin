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
const STATUS_CYCLE = { 미시작: '진행중', 진행중: '완료', 완료: '보류', 보류: '미시작' }

const CATEGORY_PALETTE = [
  'bg-purple-100 text-purple-700',
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-yellow-100 text-yellow-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
]
const getCategoryColor = (name, categories) => {
  if (!name) return ''
  const idx = categories.indexOf(name)
  return idx === -1 ? 'bg-gray-100 text-gray-500' : CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length]
}

export default function SharePage() {
  const { id } = useParams()
  const [event,      setEvent]      = useState(null)
  const [tasks,      setTasks]      = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const load = async () => {
      const [{ data: ev }, { data: ts }, { data: cats }] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('event_tasks').select('*').eq('event_id', id).order('order_num'),
        supabase.from('task_categories').select('name').order('created_at'),
      ])
      setEvent(ev)
      setTasks(ts || [])
      setCategories((cats || []).map(d => d.name))
    }
    load()
  }, [id])

  const cycleStatus = async (t) => {
    const newStatus = STATUS_CYCLE[t.status] || '미시작'
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

      <div className="p-5 max-w-2xl mx-auto">
        {/* 진행률 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">전체 진행률</span>
            <span className="font-bold text-brand">{done}/{tasks.length} 완료 · {progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-brand h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* 태스크 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 헤더 */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-semibold">
            <div className="px-5 py-3">태스크명</div>
            <div className="px-3 py-3">카테고리</div>
            <div className="px-3 py-3">담당자</div>
            <div className="px-3 py-3">상태</div>
          </div>

          {tasks.map(t => (
            <div key={t.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-gray-50 items-center">
              <div className="px-5 py-3.5">
                <span className={`text-sm ${t.status === '완료' ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                  {t.name}
                </span>
              </div>
              <div className="px-3 py-3.5">
                {t.category
                  ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(t.category, categories)}`}>{t.category}</span>
                  : <span className="text-xs text-gray-300">-</span>}
              </div>
              <div className="px-3 py-3.5 text-xs text-gray-500 font-medium">{t.assignee || '-'}</div>
              <div className="px-3 py-3.5">
                <button onClick={() => cycleStatus(t)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all active:scale-95 ${STATUS_COLOR[t.status] || 'bg-gray-100 text-gray-500'}`}>
                  {t.status || '미시작'}
                </button>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">태스크가 없습니다</p>
          )}

          <div className="px-5 py-3 border-t border-gray-50">
            <p className="text-xs text-gray-400">상태 버튼을 눌러 업데이트해주세요</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">핏자워크라운지</p>
      </div>
    </div>
  )
}
