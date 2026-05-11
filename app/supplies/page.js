'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'

const CATEGORY_OPTIONS = ['재료', '도구', '비품', '청소용품', '기타']
const UNIT_OPTIONS = ['개', '봉', '통', 'kg', 'L', '롤', '장', '박스']
const EMPTY = { name: '', category: '비품', current_qty: '', unit: '개', min_qty: '1', notes: '' }

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('전체')

  const load = async () => {
    const { data } = await supabase.from('supplies').select('*').order('category').order('name')
    setSupplies(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = (s) => { setForm({ ...EMPTY, ...s, current_qty: s.current_qty ?? '', min_qty: s.min_qty ?? '1' }); setEditId(s.id); setModal(true) }

  const save = async () => {
    if (!form.name.trim()) return alert('품목명을 입력해주세요')
    const payload = { ...form, current_qty: +form.current_qty || 0, min_qty: +form.min_qty || 1 }
    if (editId) await supabase.from('supplies').update(payload).eq('id', editId)
    else        await supabase.from('supplies').insert([payload])
    setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm('비품을 삭제할까요?')) return
    await supabase.from('supplies').delete().eq('id', id)
    load()
  }

  const getStatus = (s) => {
    if (s.current_qty <= 0) return { label: '재고없음', color: 'bg-red-100 text-red-700', icon: <AlertTriangle size={12}/> }
    if (s.current_qty <= s.min_qty) return { label: '리필필요', color: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle size={12}/> }
    return { label: '충분', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12}/> }
  }

  const needRefill = supplies.filter(s => s.current_qty <= s.min_qty)
  const categories = ['전체', ...CATEGORY_OPTIONS.filter(c => supplies.some(s => s.category === c))]
  const filtered = filter === '전체' ? supplies : supplies.filter(s => s.category === filter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">비품 관리</h2>
          <p className="text-sm text-gray-500 mt-1">총 {supplies.length}개 품목 · {needRefill.length > 0 ? <span className="text-yellow-600 font-semibold">{needRefill.length}개 리필 필요</span> : '재고 충분'}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
          <Plus size={16} /> 품목 추가
        </button>
      </div>

      {/* 리필 필요 알림 */}
      {needRefill.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800 mb-1">리필이 필요한 품목</p>
            <p className="text-xs text-yellow-700">{needRefill.map(s => s.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === c ? 'bg-brand text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
              {['품목명', '카테고리', '현재 수량', '최소 수량', '상태', '메모', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} className="text-center text-gray-400 py-12">등록된 비품이 없습니다</td></tr>
              : filtered.map(s => {
                const st = getStatus(s)
                return (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-800">{s.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{s.category}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-800">{s.current_qty} {s.unit}</td>
                    <td className="px-4 py-3.5 text-gray-500">{s.min_qty} {s.unit}</td>
                    <td className="px-4 py-3.5">
                      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium w-fit ${st.color}`}>
                        {st.icon}{st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{s.notes || '-'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-brand transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => remove(s.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={editId ? '비품 수정' : '비품 추가'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">품목명 *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">카테고리</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {CATEGORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">현재 수량</label>
                <input type="number" min="0" value={form.current_qty} onChange={e => setForm(p => ({ ...p, current_qty: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">최소 수량 (리필 기준)</label>
                <input type="number" min="0" value={form.min_qty} onChange={e => setForm(p => ({ ...p, min_qty: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">단위</label>
              <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {UNIT_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">메모</label>
              <input type="text" placeholder="구매처, 브랜드 등" value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
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
