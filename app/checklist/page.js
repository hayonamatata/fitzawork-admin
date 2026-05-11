'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, RefreshCw } from 'lucide-react'

export default function ChecklistPage() {
  const [items, setItems] = useState([])
  const [checked, setChecked] = useState({})
  const [adding, setAdding] = useState(null)  // null | '오픈' | '마감'
  const [newContent, setNewContent] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const load = async () => {
    const { data } = await supabase.from('checklist_items').select('*').order('type').order('order_num')
    setItems(data || [])
    setChecked({})
  }
  useEffect(() => { load() }, [])

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }))

  const addItem = async (type) => {
    if (!newContent.trim()) return
    const maxOrder = items.filter(i => i.type === type).length
    await supabase.from('checklist_items').insert([{ type, content: newContent.trim(), description: newDesc.trim(), order_num: maxOrder }])
    setNewContent(''); setNewDesc(''); setAdding(null); load()
  }

  const remove = async (id) => {
    if (!confirm('항목을 삭제할까요?')) return
    await supabase.from('checklist_items').delete().eq('id', id)
    load()
  }

  const resetAll = () => setChecked({})

  const openItems  = items.filter(i => i.type === '오픈')
  const closeItems = items.filter(i => i.type === '마감')
  const openDone   = openItems.filter(i => checked[i.id]).length
  const closeDone  = closeItems.filter(i => checked[i.id]).length

  const Section = ({ type, list, done }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-lg ${type === '오픈' ? '☀️' : '🌙'}`}>{type === '오픈' ? '☀️' : '🌙'}</span>
          <div>
            <h3 className="text-sm font-bold text-gray-800">{type} 체크리스트</h3>
            <p className="text-xs text-gray-400 mt-0.5">{done}/{list.length} 완료</p>
          </div>
        </div>
        <button onClick={() => { setAdding(type); setNewContent(''); setNewDesc('') }}
          className="flex items-center gap-1 text-xs text-brand font-semibold hover:bg-green-50 px-2.5 py-1.5 rounded-lg transition-colors">
          <Plus size={13} /> 항목 추가
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div className="h-1.5 bg-brand transition-all duration-300 rounded-full"
          style={{ width: list.length ? `${(done/list.length)*100}%` : '0%' }} />
      </div>

      <div className="p-4 space-y-2">
        {list.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-6">항목을 추가해주세요</p>
        )}
        {list.map(item => (
          <div key={item.id}
            className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer group
              ${checked[item.id] ? 'bg-green-50' : 'hover:bg-gray-50'}`}
            onClick={() => toggle(item.id)}>
            <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all
              ${checked[item.id] ? 'bg-brand border-brand' : 'border-gray-300'}`}>
              {checked[item.id] && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium transition-colors ${checked[item.id] ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {item.content}
              </p>
              {item.description && (
                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
              )}
            </div>
            <button onClick={e => { e.stopPropagation(); remove(item.id) }}
              className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* 항목 추가 인라인 폼 */}
        {adding === type && (
          <div className="border border-brand/30 rounded-xl p-3 mt-2 bg-green-50/30">
            <input type="text" placeholder="체크리스트 항목" value={newContent}
              onChange={e => setNewContent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(type)}
              autoFocus
              className="w-full text-sm bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 mb-2" />
            <input type="text" placeholder="설명 (선택)" value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem(type)}
              className="w-full text-xs bg-transparent border-none outline-none text-gray-500 placeholder-gray-300 mb-3" />
            <div className="flex gap-2">
              <button onClick={() => addItem(type)}
                className="bg-brand text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-brand-dark transition-colors">
                추가
              </button>
              <button onClick={() => setAdding(null)}
                className="text-gray-400 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">해야할 리스트</h2>
          <p className="text-sm text-gray-500 mt-1">오픈 · 마감 체크리스트</p>
        </div>
        <button onClick={resetAll}
          className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:border-brand hover:text-brand transition-colors">
          <RefreshCw size={15} /> 전체 초기화
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section type="오픈" list={openItems} done={openDone} />
        <Section type="마감" list={closeItems} done={closeDone} />
      </div>
    </div>
  )
}
