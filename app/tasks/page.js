'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const CATEGORY_OPTIONS = ['디자인', '제작/발주', '콘텐츠', '운영']
const ASSIGNEE_OPTIONS  = ['하연', '수담님', '공동', '외부업체']
const STATUS_OPTIONS    = ['미시작', '진행중', '완료', '보류']

const STATUS_COLOR = {
  미시작: 'bg-gray-100 text-gray-500',
  진행중: 'bg-blue-100 text-blue-600',
  완료:   'bg-green-100 text-green-700',
  보류:   'bg-red-100 text-red-500',
}
const CATEGORY_COLOR = {
  '디자인':   'bg-blue-50 text-blue-600',
  '제작/발주': 'bg-orange-50 text-orange-600',
  '콘텐츠':   'bg-green-50 text-green-700',
  '운영':     'bg-purple-50 text-purple-600',
}
const ASSIGNEE_COLOR = {
  '하연':   'bg-yellow-100 text-yellow-700',
  '수담님': 'bg-pink-100 text-pink-600',
  '공동':   'bg-gray-100 text-gray-600',
  '외부업체': 'bg-brown-100 text-amber-700',
}

const EMPTY = { name: '', category: '디자인', assignee: '하연', status: '미시작', project: '수담과 방법', notes: '' }

export default function TasksPage() {
  const [tasks, setTasks]       = useState([])
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [catFilter, setCatFilter]   = useState('전체')
  const [statusFilter, setStatusFilter] = useState('전체')

  const load = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at')
    setTasks(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = (t) => { setForm({ ...EMPTY, ...t }); setEditId(t.id); setModal(true) }

  const save = async () => {
    if (!form.name.trim()) return alert('태스크명을 입력해주세요')
    if (editId) await supabase.from('tasks').update(form).eq('id', editId)
    else        await supabase.from('tasks').insert([form])
    setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm('태스크를 삭제할까요?')) return
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  // 상태 빠른 변경
  const cycleStatus = async (t) => {
    const next = { 미시작: '진행중', 진행중: '완료', 완료: '보류', 보류: '미시작' }
    await supabase.from('tasks').update({ status: next[t.status] }).eq('id', t.id)
    load()
  }

  const filtered = tasks
    .filter(t => catFilter    === '전체' || t.category === catFilter)
    .filter(t => statusFilter === '전체' || t.status   === statusFilter)

  // 진행률 계산
  const total    = tasks.length
  const done     = tasks.filter(t => t.status === '완료').length
  const progress = total ? Math.round((done / total) * 100) : 0

  // 카테고리별 그룹
  const grouped = CATEGORY_OPTIONS.reduce((acc, cat) => {
    const items = filtered.filter(t => t.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">프로젝트 태스크</h2>
          <p className="text-sm text-gray-500 mt-1">수담과 방법 팝업전시</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
          <Plus size={16} /> 태스크 추가
        </button>
      </div>

      {/* 진행률 바 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">전체 진행률</span>
          <span className="text-sm font-bold text-brand">{done}/{total} 완료 · {progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div className="bg-brand h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
        {/* 카테고리별 미니 통계 */}
        <div className="flex gap-4 mt-4">
          {CATEGORY_OPTIONS.map(cat => {
            const total = tasks.filter(t => t.category === cat).length
            const done  = tasks.filter(t => t.category === cat && t.status === '완료').length
            return (
              <div key={cat} className="flex-1 text-center">
                <p className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1 ${CATEGORY_COLOR[cat]}`}>{cat}</p>
                <p className="text-xs text-gray-400">{done}/{total}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {['전체', ...CATEGORY_OPTIONS].map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${catFilter === c ? 'bg-brand text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {['전체', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-gray-700 text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-400'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* 카테고리별 그룹 */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CATEGORY_COLOR[cat]}`}>{cat}</span>
              <span className="text-xs text-gray-400">{items.filter(t => t.status === '완료').length}/{items.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map(t => (
                <div key={t.id} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  {/* 상태 빠른 토글 */}
                  <button onClick={() => cycleStatus(t)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 transition-all hover:opacity-70 ${STATUS_COLOR[t.status]}`}>
                    {t.status}
                  </button>
                  {/* 태스크명 */}
                  <p className={`flex-1 text-sm ${t.status === '완료' ? 'line-through text-gray-300' : 'text-gray-800'}`}>
                    {t.name}
                  </p>
                  {/* 담당자 */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ASSIGNEE_COLOR[t.assignee] || 'bg-gray-100 text-gray-500'}`}>
                    {t.assignee}
                  </span>
                  {/* 액션 */}
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button onClick={() => openEdit(t)} className="text-gray-300 hover:text-brand"><Pencil size={14} /></button>
                    <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 text-sm">
            태스크가 없습니다
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={editId ? '태스크 수정' : '태스크 추가'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">카테고리</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORY_OPTIONS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(p => ({ ...p, category: c }))}
                    className={`py-2 rounded-lg text-sm font-semibold border transition-all
                      ${form.category === c ? 'bg-brand text-white border-brand' : 'bg-white text-gray-500 border-gray-200 hover:border-brand'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">태스크명 *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">담당자</label>
              <div className="flex gap-2 flex-wrap">
                {ASSIGNEE_OPTIONS.map(a => (
                  <button key={a} type="button" onClick={() => setForm(p => ({ ...p, assignee: a }))}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all
                      ${form.assignee === a ? 'bg-brand text-white border-brand' : 'bg-white text-gray-500 border-gray-200 hover:border-brand'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">상태</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">메모</label>
              <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand resize-none" />
            </div>
            <button onClick={save}
              className="w-full bg-brand text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors">
              저장
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
