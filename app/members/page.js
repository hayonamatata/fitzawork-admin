'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_OPTIONS = ['활성', '휴가', '탈퇴']
const STATUS_COLOR   = { 활성: 'bg-green-100 text-green-700', 휴가: 'bg-yellow-100 text-yellow-700', 탈퇴: 'bg-gray-100 text-gray-400' }

const MONTHLY_EMPTY = { name: '', occupation: '', contact: '', instagram: '', pass_type: '1개월권', start_date: '', end_date: '', issue: '', status: '활성', notes: '' }

const daysLeft = (endDate) => {
  if (!endDate) return null
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
}

export default function MembersPage() {
  const [members,  setMembers]  = useState([])
  const [visits,   setVisits]   = useState([])   // daily_visits 데이터
  const [modal,    setModal]    = useState(false)
  const [visitModal, setVisitModal] = useState(false)
  const [form,     setForm]     = useState(MONTHLY_EMPTY)
  const [visitForm, setVisitForm] = useState({ visit_date: '', visitor_count: 1, visitor_names: '', notes: '' })
  const [editId,   setEditId]   = useState(null)
  const [editVisitId, setEditVisitId] = useState(null)
  const [tab,      setTab]      = useState('1개월권')
  const [calMonth, setCalMonth] = useState(new Date())

  const loadMembers = async () => {
    const { data } = await supabase.from('members').select('*').order('created_at')
    setMembers(data || [])
  }
  const loadVisits = async () => {
    const { data } = await supabase.from('daily_visits').select('*').order('visit_date')
    setVisits(data || [])
  }

  useEffect(() => { loadMembers(); loadVisits() }, [])

  // 1개월권 CRUD
  const openAdd  = () => { setForm(MONTHLY_EMPTY); setEditId(null); setModal(true) }
  const openEdit = (m) => { setForm({ ...MONTHLY_EMPTY, ...m }); setEditId(m.id); setModal(true) }
  const save = async () => {
    if (!form.name.trim()) return alert('이름을 입력해주세요')
    if (editId) await supabase.from('members').update(form).eq('id', editId)
    else        await supabase.from('members').insert([form])
    setModal(false); loadMembers()
  }
  const remove = async (id) => {
    if (!confirm('멤버를 삭제할까요?')) return
    await supabase.from('members').delete().eq('id', id)
    loadMembers()
  }

  // 원데이 방문 기록
  const openVisitAdd = (dateStr) => {
    setVisitForm({ visit_date: dateStr, visitor_count: 1, visitor_names: '', notes: '' })
    setEditVisitId(null); setVisitModal(true)
  }
  const openVisitEdit = (v) => {
    setVisitForm({ visit_date: v.visit_date, visitor_count: v.visitor_count, visitor_names: v.visitor_names || '', notes: v.notes || '' })
    setEditVisitId(v.id); setVisitModal(true)
  }
  const saveVisit = async () => {
    const payload = { ...visitForm, visitor_count: +visitForm.visitor_count || 1 }
    if (editVisitId) await supabase.from('daily_visits').update(payload).eq('id', editVisitId)
    else             await supabase.from('daily_visits').insert([payload])
    setVisitModal(false); loadVisits()
  }
  const removeVisit = async (id) => {
    if (!confirm('기록을 삭제할까요?')) return
    await supabase.from('daily_visits').delete().eq('id', id)
    loadVisits()
  }

  // 캘린더 계산
  const year      = calMonth.getFullYear()
  const month     = calMonth.getMonth()
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const today     = new Date()
  const todayStr  = today.toISOString().slice(0, 10)

  const visitForDay = (day) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return visits.find(v => v.visit_date === d)
  }

  // 이번 달 원데이 통계
  const thisMonthVisits = visits.filter(v => v.visit_date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
  const thisMonthTotal  = thisMonthVisits.reduce((s, v) => s + (v.visitor_count || 0), 0)

  const monthly = members.filter(m => m.pass_type === '1개월권' || !m.pass_type)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">멤버 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            <span className="text-brand font-medium">1개월권 {monthly.filter(m => m.status === '활성').length}명</span>
            {' · '}
            <span className="text-orange-500 font-medium">이번 달 원데이 {thisMonthTotal}명</span>
          </p>
        </div>
        {tab === '1개월권' && (
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
            <Plus size={16} /> 멤버 추가
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6">
        {['1개월권', '원데이'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all
              ${tab === t ? 'bg-brand text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── 1개월권 테이블 ── */}
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
              {monthly.length === 0
                ? <tr><td colSpan={8} className="text-center text-gray-400 py-12">등록된 멤버가 없어요</td></tr>
                : monthly.map(m => {
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

      {/* ── 원데이 캘린더 ── */}
      {tab === '원데이' && (
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* 월 이동 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button onClick={() => setCalMonth(new Date(year, month - 1, 1))}
                className="text-gray-400 hover:text-brand p-1 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-800">{year}년 {month + 1}월</h3>
                <p className="text-xs text-gray-400 mt-0.5">방문 {thisMonthTotal}명</p>
              </div>
              <button onClick={() => setCalMonth(new Date(year, month + 1, 1))}
                className="text-gray-400 hover:text-brand p-1 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={d} className={`text-center text-xs font-semibold py-2.5 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} className="border-b border-r border-gray-50 h-24" />
              ))}
              {Array.from({ length: daysInMon }).map((_, i) => {
                const day    = i + 1
                const col    = (firstDay + i) % 7
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const visit  = visitForDay(day)
                const isToday = dayStr === todayStr

                return (
                  <div key={day}
                    onClick={() => visit ? openVisitEdit(visit) : openVisitAdd(dayStr)}
                    className={`border-b border-r border-gray-50 h-24 p-2 cursor-pointer transition-colors
                      ${visit ? 'hover:bg-brand/5' : 'hover:bg-gray-50'}
                      ${col === 0 ? 'bg-red-50/20' : col === 6 ? 'bg-blue-50/10' : ''}`}>
                    <p className={`text-xs font-semibold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-brand text-white' : col === 0 ? 'text-red-400' : col === 6 ? 'text-blue-400' : 'text-gray-600'}`}>
                      {day}
                    </p>
                    {visit && (
                      <div className="space-y-0.5">
                        <div className="bg-brand/10 text-brand text-[10px] font-bold px-1.5 py-0.5 rounded inline-block">
                          {visit.visitor_count}명
                        </div>
                        {visit.visitor_names && (
                          <p className="text-[10px] text-gray-400 leading-tight truncate">{visit.visitor_names}</p>
                        )}
                      </div>
                    )}
                    {!visit && (
                      <p className="text-[10px] text-gray-200 mt-1">+ 기록</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 이번 달 방문 목록 */}
          {thisMonthVisits.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">{month + 1}월 방문 기록</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {[...thisMonthVisits].sort((a,b) => b.visit_date.localeCompare(a.visit_date)).map(v => (
                  <div key={v.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/50">
                    <p className="text-sm font-semibold text-gray-700 w-20 shrink-0">{v.visit_date.slice(5)}</p>
                    <p className="text-sm text-brand font-bold shrink-0">{v.visitor_count}명</p>
                    <p className="text-sm text-gray-500 flex-1 truncate">{v.visitor_names || '-'}</p>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openVisitEdit(v)} className="text-gray-400 hover:text-brand"><Pencil size={14} /></button>
                      <button onClick={() => removeVisit(v.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1개월권 멤버 모달 */}
      {modal && (
        <Modal title={editId ? '멤버 수정' : '멤버 추가'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            {[['이름 *','name','text'],['직업','occupation','text'],['연락처','contact','text'],['인스타그램','instagram','text']].map(([label,key,type]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input type={type} value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            ))}
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
              className="w-full bg-brand text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors">저장</button>
          </div>
        </Modal>
      )}

      {/* 원데이 방문 기록 모달 */}
      {visitModal && (
        <Modal title={editVisitId ? '방문 기록 수정' : '방문 기록 추가'} onClose={() => setVisitModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">날짜</label>
              <input type="date" value={visitForm.visit_date} onChange={e => setVisitForm(p => ({ ...p, visit_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">방문 인원</label>
              <input type="number" min="1" value={visitForm.visitor_count} onChange={e => setVisitForm(p => ({ ...p, visitor_count: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">성함 <span className="text-gray-400 font-normal">(쉼표로 구분)</span></label>
              <input type="text" value={visitForm.visitor_names} onChange={e => setVisitForm(p => ({ ...p, visitor_names: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">메모</label>
              <input type="text" value={visitForm.notes || ''} onChange={e => setVisitForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <button onClick={saveVisit}
              className="w-full bg-brand text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors">저장</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
