'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const MONTHS_KR  = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const STATUS_OPT = ['기획 전','기획중','진행중','완료']
const PASS_OPT   = ['전체','1개월권','4시간권','1일권']
const STATUS_COLOR = { '진행중':'bg-green-100 text-green-700','기획중':'bg-blue-100 text-blue-700','완료':'bg-gray-100 text-gray-500','기획 전':'bg-orange-50 text-orange-500' }
const EMPTY = { month:'', name:'', target_pass:'전체', description:'', period:'', target_count:'', status:'기획 전', notes:'' }

export default function PromotionsPage() {
  const [promos, setPromos] = useState([])
  const [modal, setModal]   = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('전체')

  const load = async () => {
    const { data } = await supabase.from('promotions').select('*').order('month')
    setPromos(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = (p) => { setForm({ ...EMPTY, ...p }); setEditId(p.id); setModal(true) }
  const save = async () => {
    const payload = { ...form, month: +form.month||null, target_count: +form.target_count||null }
    if (editId) await supabase.from('promotions').update(payload).eq('id', editId)
    else        await supabase.from('promotions').insert([payload])
    setModal(false); load()
  }
  const remove = async (id) => {
    if (!confirm('삭제할까요?')) return
    await supabase.from('promotions').delete().eq('id', id)
    load()
  }

  const filtered = filter === '전체' ? promos : promos.filter(p => p.status === filter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">프로모션 계획</h2>
          <p className="text-sm text-gray-500 mt-1">2026 프로모션 현황</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
          <Plus size={16} /> 프로모션 추가
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {['전체', ...STATUS_OPT].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === s ? 'bg-brand text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
              {['월','프로모션명','대상 이용권','내용','기간','목표 인원','상태',''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8} className="text-center text-gray-400 py-12">등록된 프로모션이 없습니다</td></tr>
              : filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3.5 font-medium text-gray-700 whitespace-nowrap">{p.month ? MONTHS_KR[p.month-1] : '-'}</td>
                  <td className="px-4 py-3.5 font-semibold text-gray-800">{p.name}</td>
                  <td className="px-4 py-3.5 text-gray-600">{p.target_pass}</td>
                  <td className="px-4 py-3.5 text-gray-600 max-w-[200px] truncate">{p.description}</td>
                  <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">{p.period}</td>
                  <td className="px-4 py-3.5 text-center text-gray-600">{p.target_count ? `${p.target_count}명` : '-'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[p.status]||'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-brand"><Pencil size={14}/></button>
                      <button onClick={() => remove(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={editId ? '프로모션 수정' : '프로모션 추가'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">월</label>
              <select value={form.month} onChange={e => setForm(p => ({...p,month:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                <option value="">선택</option>
                {MONTHS_KR.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
              </select>
            </div>
            {[['프로모션명','name'],['내용','description'],['기간','period']].map(([label,key]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input value={form[key]||''} onChange={e => setForm(p => ({...p,[key]:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">대상 이용권</label>
              <select value={form.target_pass} onChange={e => setForm(p => ({...p,target_pass:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {PASS_OPT.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">목표 인원</label>
              <input type="number" value={form.target_count||''} onChange={e => setForm(p => ({...p,target_count:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">상태</label>
              <select value={form.status} onChange={e => setForm(p => ({...p,status:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {STATUS_OPT.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <button onClick={save} className="w-full bg-brand text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors">저장</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
