'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Share2, Check } from 'lucide-react'

const TYPE_COLOR = {
  '대관': 'bg-purple-100 text-purple-700',
  '크리에이터 전시/팝업': 'bg-orange-100 text-orange-700',
  '프로그램': 'bg-blue-100 text-blue-700',
}
const STATUS_COLOR = {
  미시작: 'bg-gray-100 text-gray-500',
  진행중: 'bg-blue-100 text-blue-600',
  완료:   'bg-green-100 text-green-700',
  보류:   'bg-red-100 text-red-400',
}
const TASK_TEMPLATES = {
  '대관':            ['계약서 확인', '보증금 수령', '공간 안내 문자 발송', '당일 세팅', '이용 후 정산'],
  '크리에이터 전시/팝업': ['작가 미팅', '자료 수집', '디자인 작업', '인쇄 발주', '공간 세팅', '오프닝 진행', '아카이빙'],
  '프로그램':         ['참가자 모집', '재료 준비', '공간 세팅', '프로그램 진행', '후기 수집'],
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const [event,   setEvent]   = useState(null)
  const [tasks,   setTasks]   = useState([])
  const [newTask, setNewTask] = useState('')
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
      setEvent(ev)
      const { data: ts } = await supabase.from('event_tasks').select('*').eq('event_id', id).order('order_num')
      if ((ts || []).length === 0 && ev) {
        const templates = TASK_TEMPLATES[ev.type] || []
        if (templates.length > 0) {
          await supabase.from('event_tasks').insert(
            templates.map((name, i) => ({ event_id: id, name, status: '미시작', order_num: i }))
          )
          const { data: fresh } = await supabase.from('event_tasks').select('*').eq('event_id', id).order('order_num')
          setTasks(fresh || [])
        }
      } else {
        setTasks(ts || [])
      }
    }
    init()
  }, [id])

  const reloadTasks = async () => {
    const { data } = await supabase.from('event_tasks').select('*').eq('event_id', id).order('order_num')
    setTasks(data || [])
  }

  const cycleStatus = async (t) => {
    const next = { 미시작: '진행중', 진행중: '완료', 완료: '보류', 보류: '미시작' }
    await supabase.from('event_tasks').update({ status: next[t.status] }).eq('id', t.id)
    reloadTasks()
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    await supabase.from('event_tasks').insert([{ event_id: id, name: newTask, status: '미시작', order_num: tasks.length }])
    setNewTask('')
    reloadTasks()
  }

  const removeTask = async (tid) => {
    await supabase.from('event_tasks').delete().eq('id', tid)
    setTasks(prev => prev.filter(t => t.id !== tid))
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const done     = tasks.filter(t => t.status === '완료').length
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  if (!event) return <div className="p-8 text-gray-400 text-sm">불러오는 중...</div>

  return (
    <div className="p-8 max-w-2xl">
      {/* Back */}
      <button onClick={() => router.push('/events')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft size={15} /> 이벤트 목록
      </button>

      {/* Event Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLOR[event.type] || 'bg-gray-100 text-gray-600'}`}>
                {event.type}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                event.status === '확정' ? 'bg-green-100 text-green-700' :
                event.status === '완료' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
              }`}>{event.status}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{event.name}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {event.start_date}
              {event.end_date && event.end_date !== event.start_date ? ` ~ ${event.end_date}` : ''}
              {event.day_of_week && ` · 매주 ${event.day_of_week}요일`}
              {event.time && ` · ${event.time}`}
            </p>
            {event.partner && <p className="text-xs text-gray-400 mt-0.5">파트너: {event.partner}</p>}
          </div>
          <button onClick={copyShareLink}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all
              ${copied ? 'bg-green-100 text-green-700' : 'bg-brand text-white hover:bg-brand-dark'}`}>
            {copied ? <><Check size={13} /> 복사됨!</> : <><Share2 size={13} /> 협업 링크</>}
          </button>
        </div>

        {tasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>준비 진행률</span>
              <span className="font-bold text-brand">{done}/{tasks.length} · {progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-brand h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">준비 태스크</h3>
          <p className="text-xs text-gray-400 mt-0.5">상태 버튼 클릭으로 업데이트 · 협업 링크로 외부 공유 가능</p>
        </div>
        <div className="divide-y divide-gray-50">
          {tasks.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-10">태스크가 없습니다</p>
          )}
          {tasks.map(t => (
            <div key={t.id} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <button onClick={() => cycleStatus(t)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all hover:opacity-70 ${STATUS_COLOR[t.status]}`}>
                {t.status}
              </button>
              <p className={`flex-1 text-sm ${t.status === '완료' ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                {t.name}
              </p>
              <button onClick={() => removeTask(t.id)}
                className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        {/* 태스크 추가 인풋 */}
        <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            placeholder="태스크 추가 후 Enter"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
          <button onClick={addTask}
            className="bg-brand text-white px-3 py-2 rounded-lg hover:bg-brand-dark transition-colors">
            <Plus size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
