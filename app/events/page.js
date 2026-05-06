'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const STATUS_OPTIONS = ['기획중', '확정', '완료']
const TYPE_OPTIONS   = ['자체기획', '외부협업', '자체+협업']
const STATUS_COLOR   = { 확정: 'bg-green-100 text-green-700', 기획중: 'bg-blue-100 text-blue-700', 완료: 'bg-gray-100 text-gray-500' }
const EMPTY = { name:'', type:'자체기획', start_date:'', end_date:'', time:'', duration:'', space_setup:'', expected_attendees:'', revenue:'', partner:'', status:'기획중', notes:'' }

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [modal, setModal] = useState(null)  // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('전체')

  const load = async () => {
    const { data } = await supabase.from('events').select('*').order('start_date')
    setEvents(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal('edit') }
  const openEdit = (ev) => { setForm({ ...EMPTY, ...ev }); setEditId(ev.id); setModal('edit') }

  const save = async () => {
    const payload = { ...form, expected_attendees: form.expected_attendees || null, revenue: form.revenue || null }
    if (editId) await supabase.from('events').update(payload).eq('id', editId)
    else        await supabase.from('events').insert([payload])
    setModal(null); load()
  }

  const remove = async (id) => {
    if (!confirm('이벤트를 삭제할까요?')) return
    await supabase.from('events').delete().eq('id', id)
    load()
  }

  const filtered = filter === '전체' ? events : events.filter(e => e.status === filter)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">이벤트 관리</h2>
          <p className="text-sm text-gray-500 mt-1">2026 이벤트 기획 현황</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
          <Plus size={16} /> 이벤트 추가
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5">
        {['전체', ...STATUS_OPTIONS].map(s => (
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
              {['이벤트명','유형','날짜','시간','파트너','상태',''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} className="text-center text-gray-400 py-12">등록된 이벤트가 없습니다</td></tr>
              : filtered.map(ev => (
                <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-gray-800">{ev.name}</td>
                  <td className="px-4 py-3.5 text-gray-600">{ev.type}</td>
                  <td className="px-4 py-3.5 text-gray-600">{ev.start_date}{ev.end_date && ev.end_date !== ev.start_date ? ` ~ ${ev.end_date}` : ''}</td>
                  <td className="px-4 py-3.5 text-gray-600">{ev.time || '-'}</td>
                  <td className="px-4 py-3.5 text-gray-600">{ev.partner || '-'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[ev.status] || 'bg-gray-100 text-gray-500'}`}>{ev.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(ev)} className="text-gray-400 hover:text-brand transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => remove(ev.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal === 'edit' && (
        <Modal title={editId ? '이벤트 수정' : '이벤트 추가'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {[['이벤트명','name','text'],['시작일','start_date','date'],['종료일','end_date','date'],['시간','time','text'],['기간','duration','text'],['장소 구성','space_setup','text'],['예상 인원','expected_attendees','number'],['수익(원)','revenue','number'],['파트너','partner','text']].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input type={type} value={form[key] || ''} onChange={e => setForm(p => ({...p,[key]:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">유형</label>
              <select value={form.type} onChange={e => setForm(p => ({...p,type:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">상태</label>
              <select value={form.status} onChange={e => setForm(p => ({...p,status:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">비고</label>
              <textarea value={form.notes || ''} onChange={e => setForm(p => ({...p,notes:e.target.value}))} rows={2}
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
