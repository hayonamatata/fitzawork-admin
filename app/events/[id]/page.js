'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Share2, Check, X } from 'lucide-react'

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
const STATUS_CYCLE = { 미시작: '진행중', 진행중: '완료', 완료: '보류', 보류: '미시작' }

const TASK_TEMPLATES = {
  '대관': [
    { name: '계약서 확인',       category: '운영',     assignee: '' },
    { name: '보증금 수령',        category: '운영',     assignee: '' },
    { name: '공간 안내 문자 발송', category: '운영',     assignee: '' },
    { name: '당일 세팅',          category: '운영',     assignee: '' },
    { name: '이용 후 정산',        category: '운영',     assignee: '' },
  ],
  '크리에이터 전시/팝업': [
    { name: '작가 미팅',    category: '운영',    assignee: '' },
    { name: '자료 수집',    category: '콘텐츠',  assignee: '' },
    { name: '디자인 작업',  category: '디자인',  assignee: '' },
    { name: '인쇄 발주',    category: '제작/발주', assignee: '' },
    { name: '공간 세팅',    category: '운영',    assignee: '' },
    { name: '오프닝 진행',  category: '운영',    assignee: '' },
    { name: '아카이빙',     category: '운영',    assignee: '' },
  ],
  '프로그램': [
    { name: '참가자 모집',   category: '운영',     assignee: '' },
    { name: '재료 준비',     category: '제작/발주', assignee: '' },
    { name: '공간 세팅',     category: '운영',     assignee: '' },
    { name: '프로그램 진행', category: '운영',     assignee: '' },
    { name: '후기 수집',     category: '운영',     assignee: '' },
  ],
}

// 커스텀 셀렉트 컴포넌트 (새 항목 추가 가능)
function CreatableSelect({ value, options, onSelect, onCreate, placeholder = '-' }) {
  const [open,   setOpen]   = useState(false)
  const [input,  setInput]  = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes(input.toLowerCase()))
  const canCreate = input.trim() && !options.includes(input.trim())

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); setInput('') }}
        className="text-xs text-gray-600 hover:text-brand transition-colors text-left w-full truncate">
        {value || <span className="text-gray-300">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="검색 또는 새로 만들기"
            className="w-full px-3 py-1.5 text-xs border-b border-gray-100 outline-none"
          />
          <div className="max-h-40 overflow-y-auto">
            {value && (
              <button onClick={() => { onSelect(''); setOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50">
                - 비우기
              </button>
            )}
            {filtered.map(o => (
              <button key={o} onClick={() => { onSelect(o); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors
                  ${value === o ? 'text-brand font-semibold' : 'text-gray-700'}`}>
                {o}
              </button>
            ))}
            {canCreate && (
              <button onClick={() => { onCreate(input.trim()); onSelect(input.trim()); setOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-xs text-brand font-semibold hover:bg-brand/5 border-t border-gray-100">
                + &quot;{input.trim()}&quot; 만들기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router  = useRouter()
  const [event,      setEvent]      = useState(null)
  const [tasks,      setTasks]      = useState([])
  const [categories, setCategories] = useState([])
  const [assignees,  setAssignees]  = useState([])
  const [copied,     setCopied]     = useState(false)
  const [editingId,  setEditingId]  = useState(null)
  const [editName,   setEditName]   = useState('')
  const inputRef = useRef(null)

  const loadCategories = async () => {
    const { data } = await supabase.from('task_categories').select('name').order('created_at')
    setCategories((data || []).map(d => d.name))
  }
  const loadAssignees = async () => {
    const { data } = await supabase.from('task_assignees').select('name').order('created_at')
    setAssignees((data || []).map(d => d.name))
  }

  useEffect(() => {
    const init = async () => {
      const { data: ev } = await supabase.from('events').select('*').eq('id', id).single()
      setEvent(ev)
      const { data: ts } = await supabase.from('event_tasks').select('*').eq('event_id', id).order('order_num')
      if ((ts || []).length === 0 && ev) {
        const templates = (TASK_TEMPLATES[ev.type] || []).map((t, i) => ({ event_id: id, ...t, status: '미시작', order_num: i }))
        if (templates.length > 0) {
          await supabase.from('event_tasks').insert(templates)
          const { data: fresh } = await supabase.from('event_tasks').select('*').eq('event_id', id).order('order_num')
          setTasks(fresh || [])
        }
      } else {
        setTasks(ts || [])
      }
    }
    init()
    loadCategories()
    loadAssignees()
  }, [id])

  useEffect(() => { if (editingId && inputRef.current) inputRef.current.focus() }, [editingId])

  const reload = async () => {
    const { data } = await supabase.from('event_tasks').select('*').eq('event_id', id).order('order_num')
    setTasks(data || [])
  }

  const updateField = async (taskId, field, value) => {
    await supabase.from('event_tasks').update({ [field]: value }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t))
  }

  const cycleStatus = (t) => updateField(t.id, 'status', STATUS_CYCLE[t.status] || '미시작')

  const startEditName = (t) => { setEditingId(t.id); setEditName(t.name) }
  const saveEditName  = async () => {
    if (editingId && editName.trim()) await updateField(editingId, 'name', editName.trim())
    setEditingId(null); setEditName('')
  }

  const addTask = async () => {
    await supabase.from('event_tasks').insert([{ event_id: id, name: '새 태스크', category: '', assignee: '', status: '미시작', order_num: tasks.length }])
    await reload()
  }

  const removeTask = async (tid) => {
    await supabase.from('event_tasks').delete().eq('id', tid)
    setTasks(prev => prev.filter(t => t.id !== tid))
  }

  const createCategory = async (name) => {
    await supabase.from('task_categories').insert([{ name }]).onConflict('name').ignore()
    setCategories(prev => prev.includes(name) ? prev : [...prev, name])
  }
  const createAssignee = async (name) => {
    await supabase.from('task_assignees').insert([{ name }]).onConflict('name').ignore()
    setAssignees(prev => prev.includes(name) ? prev : [...prev, name])
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
    <div className="p-8">
      <button onClick={() => router.push('/events')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft size={15} /> 이벤트 목록
      </button>

      {/* 이벤트 정보 카드 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLOR[event.type] || 'bg-gray-100 text-gray-600'}`}>{event.type}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                event.status === '확정' ? 'bg-green-100 text-green-700' :
                event.status === '완료' ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
              }`}>{event.status}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{event.name}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {event.start_date}{event.end_date && event.end_date !== event.start_date ? ` ~ ${event.end_date}` : ''}
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
        <div className="mt-4 pt-4 border-t border-gray-50">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>준비 진행률</span>
            <span className="font-bold text-brand">{done}/{tasks.length} · {progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-brand h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* 태스크 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_36px] border-b border-gray-100 bg-gray-50 text-xs text-gray-400 font-semibold">
          <div className="px-5 py-3">태스크명</div>
          <div className="px-3 py-3">카테고리</div>
          <div className="px-3 py-3">담당자</div>
          <div className="px-3 py-3">상태</div>
          <div />
        </div>

        {tasks.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">태스크가 없습니다</p>
        )}

        {tasks.map(t => (
          <div key={t.id}
            className="group grid grid-cols-[2fr_1fr_1fr_1fr_36px] border-b border-gray-50 hover:bg-gray-50/40 transition-colors items-center min-h-[48px]">

            {/* 태스크명 */}
            <div className="px-5 py-2.5">
              {editingId === t.id
                ? <input ref={inputRef} value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={saveEditName}
                    onKeyDown={e => { if (e.key === 'Enter') saveEditName(); if (e.key === 'Escape') { setEditingId(null) } }}
                    className="w-full text-sm border-b border-brand outline-none bg-transparent pb-0.5" />
                : <span onClick={() => startEditName(t)}
                    className={`text-sm cursor-text block ${t.status === '완료' ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                    {t.name || <span className="text-gray-300 italic">클릭해서 입력</span>}
                  </span>
              }
            </div>

            {/* 카테고리 — 커스텀 셀렉트 */}
            <div className="px-3 py-2.5">
              <CreatableSelect
                value={t.category}
                options={categories}
                onSelect={(v) => updateField(t.id, 'category', v)}
                onCreate={createCategory}
              />
            </div>

            {/* 담당자 — 커스텀 셀렉트 */}
            <div className="px-3 py-2.5">
              <CreatableSelect
                value={t.assignee}
                options={assignees}
                onSelect={(v) => updateField(t.id, 'assignee', v)}
                onCreate={createAssignee}
              />
            </div>

            {/* 상태 */}
            <div className="px-3 py-2.5">
              <button onClick={() => cycleStatus(t)}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all hover:opacity-70 ${STATUS_COLOR[t.status] || 'bg-gray-100 text-gray-500'}`}>
                {t.status || '미시작'}
              </button>
            </div>

            {/* 삭제 */}
            <div className="flex justify-center">
              <button onClick={() => removeTask(t.id)}
                className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        <button onClick={addTask}
          className="w-full flex items-center gap-2 px-5 py-3 text-sm text-gray-400 hover:text-brand hover:bg-gray-50/50 transition-colors">
          <Plus size={14} /> 태스크 추가
        </button>
      </div>
    </div>
  )
}
