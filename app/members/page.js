'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2, UserCheck, AlertCircle } from 'lucide-react'

const PASS_OPTIONS   = ['1개월권', '원데이']
const STATUS_OPTIONS = ['활성', '휴가', '탈퇴']
const STATUS_COLOR   = {
  활성: 'bg-green-100 text-green-700',
  휴가: 'bg-yellow-100 text-yellow-700',
  탈퇴: 'bg-gray-100 text-gray-400',
}
const PASS_COLOR = {
  '1개월권': 'bg-brand/10 text-brand',
  '원데이':  'bg-orange-100 text-orange-700',
}
const EMPTY = { name: '', occupation: '', contact: '', instagram: '', pass_type: '1개월권', attendance_count: 0, issue: '', status: '활성', notes: '' }

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('전체')
  const [passFilter, setPassFilter] = useState('전체')

  const load = async () => {
    const { data } = await supabase.from('members').select('*').order('created_at')
    setMembers(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = (m) => { setForm({ ...EMPTY, ...m }); setEditId(m.id); setModal(true) }

  const save = async () => {
    if (!form.name.trim()) return alert('이름을 입력해주세요')
    const payload = { ...form, attendance_count: +form.attendance_count || 0 }
    if (editId) await supabase.from('members').update(payload).eq('id', editId)
    else        await supabase.from('members').insert([payload])
    setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm('멤버를 삭제할까요?')) return
    await supabase.from('members').delete().eq('id', id)
    load()
  }

  const addAttendance = async (m) => {
    await supabase.from('members').update({ attendance_count: (m.attendance_count || 0) + 1 }).eq('id', m.id)
    load()
  }

  const filtered = members
    .filter(m => filter === '전체' || m.status === filter)
    .filter(m => passFilter === '전체' || m.pass_type === passFilter)
  const activeCount   = members.filter(m => m.status === '활성').length
  const monthlyCount  = members.filter(m => m.pass_type === '1개월권' && m.status === '활성').length
  const onedayCount   = members.filter(m => m.pass_type === '원데이'  && m.status === '활성').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">멤버 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            활성 {activeCount}명 · <span className="text-brand font-medium">1개월권 {monthlyCount}명</span> · <span className="text-orange-500 font-medium">원데이 {onedayCount}명</span>
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
          <Plus size={16} /> 멤버 추가
        </button>
      </div>

      {/* 패스 유형 필터 */}
      <div className="flex gap-2 mb-3">
        {['전체', ...PASS_OPTIONS].map(p => (
          <button key={p} onClick={() => setPassFilter(p)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${passFilter === p ? 'bg-brand text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand'}`}>
            {p}
          </button>
        ))}
      </div>
      {/* 상태 필터 */}
      <div className="flex gap-2 mb-5">
        {['전체', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all text-xs ${filter === s ? 'bg-gray-700 text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-400'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
              {['이름', '패스', '직업', '연락처', '인스타그램', '출석', '이슈', '상태', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8} className="text-center text-gray-400 py-12">등록된 멤버가 없습니다</td></tr>
              : filtered.map(m => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-gray-800">{m.name}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${PASS_COLOR[m.pass_type] || 'bg-gray-100 text-gray-500'}`}>
                      {m.pass_type || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500">{m.occupation || '-'}</td>
                  <td className="px-4 py-3.5 text-gray-600">{m.contact || '-'}</td>
                  <td className="px-4 py-3.5 text-gray-500">
                    {m.instagram ? <span className="text-brand">@{m.instagram.replace('@','')}</span> : '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => addAttendance(m)}
                      className="flex items-center gap-1.5 text-brand font-semibold hover:bg-green-50 px-2 py-1 rounded-lg transition-colors">
                      <UserCheck size={14} />
                      {m.attendance_count || 0}회
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    {m.issue
                      ? <span className="flex items-center gap-1 text-yellow-600 text-xs"><AlertCircle size={12}/>{m.issue}</span>
                      : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[m.status] || 'bg-gray-100 text-gray-500'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(m)} className="text-gray-400 hover:text-brand transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => remove(m.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={editId ? '멤버 수정' : '멤버 추가'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">패스 유형</label>
              <div className="flex gap-2">
                {PASS_OPTIONS.map(p => (
                  <button key={p} type="button" onClick={() => setForm(prev => ({ ...prev, pass_type: p }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all border
                      ${form.pass_type === p ? 'bg-brand text-white border-brand' : 'bg-white text-gray-500 border-gray-200 hover:border-brand'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {[
              ['이름 *', 'name', 'text'],
              ['직업', 'occupation', 'text'],
              ['연락처', 'contact', 'text'],
              ['인스타그램 (@ 생략 가능)', 'instagram', 'text'],
              ['출석 횟수', 'attendance_count', 'number'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input type={type} value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">이슈 / 휴가</label>
              <input type="text" placeholder="예: 5월 휴가, 장기 부재" value={form.issue || ''} onChange={e => setForm(p => ({ ...p, issue: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
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
