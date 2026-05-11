'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react'

const STATUS_OPTIONS = ['활성', '휴가', '탈퇴']
const STATUS_COLOR   = {
  활성: 'bg-green-100 text-green-700',
  휴가: 'bg-yellow-100 text-yellow-700',
  탈퇴: 'bg-gray-100 text-gray-400',
}

const MONTHLY_EMPTY = { name: '', occupation: '', contact: '', instagram: '', pass_type: '1개월권', start_date: '', end_date: '', issue: '', status: '활성', notes: '' }
const ONEDAY_EMPTY  = { name: '', occupation: '', contact: '', instagram: '', pass_type: '원데이', issue: '', status: '활성', notes: '' }

// 만료까지 남은 일수
const daysLeft = (endDate) => {
  if (!endDate) return null
  const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(MONTHLY_EMPTY)
  const [editId,  setEditId]  = useState(null)
  const [tab,     setTab]     = useState('1개월권') // '1개월권' | '원데이'

  const load = async () => {
    const { data } = await supabase.from('members').select('*').order('created_at')
    setMembers(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => {
    setForm(tab === '1개월권' ? MONTHLY_EMPTY : ONEDAY_EMPTY)
    setEditId(null); setModal(true)
  }
  const openEdit = (m) => {
    const base = m.pass_type === '1개월권' ? MONTHLY_EMPTY : ONEDAY_EMPTY
    setForm({ ...base, ...m }); setEditId(m.id); setModal(true)
  }

  const save = async () => {
    if (!form.name.trim()) return alert('이름을 입력해주세요')
    const payload = { ...form }
    if (editId) await supabase.from('members').update(payload).eq('id', editId)
    else        await supabase.from('members').insert([payload])
    setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm('멤버를 삭제할까요?')) return
    await supabase.from('members').delete().eq('id', id)
    load()
  }

  // 원데이: 오늘 방문 체크인
  const checkIn = async (m) => {
    await supabase.from('members').update({
      attendance_count: (m.attendance_count || 0) + 1,
      last_visit_date: new Date().toISOString().slice(0, 10),
    }).eq('id', m.id)
    load()
  }

  const monthly = members.filter(m => m.pass_type === '1개월권')
  const oneday  = members.filter(m => m.pass_type === '원데이')
  const shown   = tab === '1개월권' ? monthly : oneday

  const activeMonthly = monthly.filter(m => m.status === '활성').length
  const activeOneday  = oneday.filter(m => m.status === '활성').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">멤버 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            <span className="text-brand font-medium">1개월권 {activeMonthly}명</span>
            {' · '}
            <span className="text-orange-500 font-medium">원데이 {activeOneday}명</span>
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
          <Plus size={16} /> 멤버 추가
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-5">
        {['1개월권', '원데이'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all
              ${tab === t ? 'bg-brand text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand'}`}>
            {t} {t === '1개월권' ? monthly.length : oneday.length}명
          </button>
        ))}
      </div>

      {/* 1개월권 테이블 */}
      {tab === '1개월권' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
                {['이름', '직업', '연락처', '시작일', '만료일', '남은 일', '상태', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0
                ? <tr><td colSpan={8} className="text-center text-gray-400 py-12">등록된 멤버가 없어요</td></tr>
                : shown.map(m => {
                  const left = daysLeft(m.end_date)
                  return (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-gray-800">
                        {m.name}
                        {m.instagram && <span className="block text-xs text-brand font-normal">@{m.instagram.replace('@','')}</span>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{m.occupation || '-'}</td>
                      <td className="px-4 py-3.5 text-gray-600">{m.contact || '-'}</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{m.start_date || '-'}</td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{m.end_date || '-'}</td>
                      <td className="px-4 py-3.5">
                        {left === null ? <span className="text-gray-300">-</span>
                          : left < 0   ? <span className="text-xs font-semibold text-red-500">만료됨</span>
                          : left <= 7  ? <span className="text-xs font-semibold text-orange-500">{left}일 남음</span>
                          : <span className="text-xs text-gray-500">{left}일</span>}
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
                  )
                })
              }
            </tbody>
          </table>
        </div>
      )}

      {/* 원데이 테이블 */}
      {tab === '원데이' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
                {['이름', '직업', '연락처', '총 방문', '마지막 방문', '오늘 체크인', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.length === 0
                ? <tr><td colSpan={7} className="text-center text-gray-400 py-12">등록된 멤버가 없어요</td></tr>
                : shown.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-gray-800">
                      {m.name}
                      {m.instagram && <span className="block text-xs text-brand font-normal">@{m.instagram.replace('@','')}</span>}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{m.occupation || '-'}</td>
                    <td className="px-4 py-3.5 text-gray-600">{m.contact || '-'}</td>
                    <td className="px-4 py-3.5 text-gray-600 font-semibold">{m.attendance_count || 0}회</td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {m.last_visit_date === new Date().toISOString().slice(0,10)
                        ? <span className="text-green-600 font-semibold">오늘 방문 ✓</span>
                        : m.last_visit_date || '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => checkIn(m)}
                        className="flex items-center gap-1.5 text-xs bg-brand/10 text-brand font-semibold px-3 py-1.5 rounded-lg hover:bg-brand/20 transition-colors">
                        <UserCheck size={13} /> 체크인
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(m)} className="text-gray-400 hover:text-brand transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => remove(m.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={editId ? '멤버 수정' : '멤버 추가'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            {/* 패스 유형 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">패스 유형</label>
              <div className="flex gap-2">
                {['1개월권', '원데이'].map(p => (
                  <button key={p} type="button" onClick={() => setForm(prev => ({ ...prev, pass_type: p }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all
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
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input type={type} value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            ))}

            {/* 1개월권: 시작일/만료일 */}
            {form.pass_type === '1개월권' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">시작일</label>
                  <input type="date" value={form.start_date || ''} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">만료일</label>
                  <input type="date" value={form.end_date || ''} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">이슈 메모</label>
              <input type="text" placeholder="예: 5월 휴가" value={form.issue || ''} onChange={e => setForm(p => ({ ...p, issue: e.target.value }))}
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
