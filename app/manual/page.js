'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORY_OPTIONS = ['공간 이용', '예약 및 결제', '장비 사용', '긴급 상황', '청소 및 마감', '기타']
const EMPTY = { category: '공간 이용', title: '', content: '', order_num: 0 }

export default function ManualPage() {
  const [items, setItems] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [activeCategory, setActiveCategory] = useState('전체')

  const load = async () => {
    const { data } = await supabase.from('manual_items').select('*').order('category').order('order_num')
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd = (cat) => { setForm({ ...EMPTY, category: cat || '공간 이용' }); setEditId(null); setModal(true) }
  const openEdit = (item) => { setForm({ ...EMPTY, ...item }); setEditId(item.id); setModal(true) }

  const save = async () => {
    if (!form.title.trim()) return alert('제목을 입력해주세요')
    if (editId) await supabase.from('manual_items').update(form).eq('id', editId)
    else        await supabase.from('manual_items').insert([form])
    setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm('항목을 삭제할까요?')) return
    await supabase.from('manual_items').delete().eq('id', id)
    load()
  }

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const usedCategories = [...new Set(items.map(i => i.category))]
  const categories = ['전체', ...CATEGORY_OPTIONS.filter(c => usedCategories.includes(c)), ...usedCategories.filter(c => !CATEGORY_OPTIONS.includes(c))]
  const filtered = activeCategory === '전체' ? items : items.filter(i => i.category === activeCategory)
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">매뉴얼 가이드</h2>
          <p className="text-sm text-gray-500 mt-1">공간 운영 가이드 및 규칙</p>
        </div>
        <button onClick={() => openAdd()}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
          <Plus size={16} /> 항목 추가
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setActiveCategory(c)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === c ? 'bg-brand text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand'}`}>
            {c}
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm mb-3">아직 등록된 매뉴얼이 없어요</p>
          <button onClick={() => openAdd()}
            className="text-brand text-sm font-semibold hover:underline">
            첫 번째 항목 추가하기
          </button>
        </div>
      )}

      {/* Grouped Accordion */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">📋 {category}</h3>
              <button onClick={() => openAdd(category)}
                className="flex items-center gap-1 text-xs text-brand font-semibold hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors">
                <Plus size={13} /> 추가
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {categoryItems.map(item => (
                <div key={item.id} className="group">
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleExpand(item.id)}>
                    <div className="flex items-center gap-3">
                      <span className="text-brand font-bold text-lg leading-none">·</span>
                      <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); openEdit(item) }}
                        className="text-gray-300 hover:text-brand opacity-0 group-hover:opacity-100 transition-all">
                        <Pencil size={14} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); remove(item.id) }}
                        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all mr-1">
                        <Trash2 size={14} />
                      </button>
                      {expanded[item.id]
                        ? <ChevronUp size={16} className="text-gray-400" />
                        : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>
                  {expanded[item.id] && item.content && (
                    <div className="px-5 pb-4">
                      <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={editId ? '항목 수정' : '항목 추가'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">카테고리</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {CATEGORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">제목 *</label>
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">내용</label>
              <textarea value={form.content || ''} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6}
                placeholder="단계별 설명, 주의사항 등을 자유롭게 작성하세요"
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
