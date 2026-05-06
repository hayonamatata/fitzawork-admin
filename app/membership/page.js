'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const YEAR   = 2026

export default function MembershipPage() {
  const [monthly, setMonthly]   = useState([])
  const [visits,  setVisits]    = useState([])
  const [editMon, setEditMon]   = useState(null)   // { year, month, monthly_pass_count, four_hour_pass_count }
  const [visitForm, setVisitForm] = useState({ visit_date:'', visitor_count:'', notes:'' })
  const [visitModal, setVisitModal] = useState(null) // null | 'add' | id
  const [editVisit, setEditVisit] = useState(null)

  const loadMonthly = async () => {
    const { data } = await supabase.from('membership_monthly').select('*').eq('year', YEAR).order('month')
    setMonthly(data || [])
  }
  const loadVisits = async () => {
    const { data } = await supabase.from('daily_visits').select('*').order('visit_date', { ascending: false })
    setVisits(data || [])
  }
  useEffect(() => { loadMonthly(); loadVisits() }, [])

  // 1개월권/4시간권 저장
  const saveMon = async () => {
    const { year, month, monthly_pass_count, four_hour_pass_count, notes } = editMon
    await supabase.from('membership_monthly').upsert({ year, month, monthly_pass_count: +monthly_pass_count||0, four_hour_pass_count: +four_hour_pass_count||0, notes }, { onConflict: 'year,month' })
    setEditMon(null); loadMonthly()
  }

  // 1일권 저장
  const saveVisit = async () => {
    const payload = { visit_date: visitForm.visit_date, visitor_count: +visitForm.visitor_count||0, notes: visitForm.notes }
    if (editVisit) await supabase.from('daily_visits').update(payload).eq('id', editVisit)
    else           await supabase.from('daily_visits').insert([payload])
    setVisitModal(null); setEditVisit(null); setVisitForm({ visit_date:'', visitor_count:'', notes:'' }); loadVisits()
  }
  const removeVisit = async (id) => {
    if (!confirm('삭제할까요?')) return
    await supabase.from('daily_visits').delete().eq('id', id)
    loadVisits()
  }
  const openEditVisit = (v) => { setVisitForm({ visit_date: v.visit_date, visitor_count: v.visitor_count, notes: v.notes||'' }); setEditVisit(v.id); setVisitModal('add') }

  // 월별 1일권 집계
  const visitsByMonth = (m) => visits.filter(v => new Date(v.visit_date).getMonth() + 1 === m).reduce((s, v) => s + (v.visitor_count||0), 0)

  // 연간 합계
  const totalMonthly   = monthly.reduce((s, r) => s + (r.monthly_pass_count||0), 0)
  const totalFourHour  = monthly.reduce((s, r) => s + (r.four_hour_pass_count||0), 0)
  const totalDayVisits = visits.reduce((s, r) => s + (r.visitor_count||0), 0)

  const getRow = (m) => monthly.find(r => r.month === m) || {}

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">멤버십 관리</h2>
        <p className="text-sm text-gray-500 mt-1">2026 멤버십 현황</p>
      </div>

      {/* 월별 요약 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">📊 월별 멤버십 현황</h3>
          <p className="text-xs text-gray-400">셀 클릭 → 수정</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
              {['월','1개월권 인원(명)','4시간권 이용(회)','1일권 이용(회)','월 합계',''].map(h => (
                <th key={h} className="px-4 py-3 text-center font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((m, i) => {
              const mn = i + 1
              const row = getRow(mn)
              const dayV = visitsByMonth(mn)
              const total = (row.monthly_pass_count||0) + (row.four_hour_pass_count||0) + dayV
              return (
                <tr key={m} className={`border-b border-gray-50 ${i%2===0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">{m}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{row.monthly_pass_count ?? '-'}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{row.four_hour_pass_count ?? '-'}</td>
                  <td className="px-4 py-3 text-center text-blue-600 font-medium">{dayV}</td>
                  <td className="px-4 py-3 text-center font-bold text-brand">{total || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setEditMon({ year: YEAR, month: mn, monthly_pass_count: row.monthly_pass_count||'', four_hour_pass_count: row.four_hour_pass_count||'', notes: row.notes||'' })}
                      className="text-gray-400 hover:text-brand transition-colors">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
            <tr className="bg-brand text-white font-bold">
              <td className="px-4 py-3 text-center">연간 합계</td>
              <td className="px-4 py-3 text-center">{totalMonthly}명</td>
              <td className="px-4 py-3 text-center">{totalFourHour}회</td>
              <td className="px-4 py-3 text-center">{totalDayVisits}회</td>
              <td className="px-4 py-3 text-center">{totalMonthly + totalFourHour + totalDayVisits}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 1일권 일자별 로그 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">📅 1일권 일자별 방문 로그</h3>
          <button onClick={() => { setVisitForm({ visit_date:'', visitor_count:'', notes:'' }); setEditVisit(null); setVisitModal('add') }}
            className="flex items-center gap-1.5 bg-brand text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-brand-dark transition-colors">
            <Plus size={13} /> 방문 추가
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
              {['방문 날짜','이용자 수(명)','비고',''].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {visits.length === 0
              ? <tr><td colSpan={4} className="text-center text-gray-400 py-10">방문 기록이 없습니다</td></tr>
              : visits.map(v => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-800">{v.visit_date}</td>
                  <td className="px-4 py-3 font-semibold text-blue-600">{v.visitor_count}명</td>
                  <td className="px-4 py-3 text-gray-500">{v.notes||'-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEditVisit(v)} className="text-gray-400 hover:text-brand transition-colors"><Pencil size={14}/></button>
                      <button onClick={() => removeVisit(v.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 1개월/4시간 수정 모달 */}
      {editMon && (
        <Modal title={`${MONTHS[editMon.month-1]} 멤버십 수정`} onClose={() => setEditMon(null)}>
          <div className="space-y-4">
            {[['1개월권 인원 (명)','monthly_pass_count'],['4시간권 이용 (회)','four_hour_pass_count']].map(([label,key]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input type="number" value={editMon[key]} onChange={e => setEditMon(p => ({...p,[key]:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">메모</label>
              <input value={editMon.notes} onChange={e => setEditMon(p => ({...p,notes:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <button onClick={saveMon} className="w-full bg-brand text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors">저장</button>
          </div>
        </Modal>
      )}

      {/* 1일권 모달 */}
      {visitModal && (
        <Modal title={editVisit ? '방문 기록 수정' : '방문 기록 추가'} onClose={() => { setVisitModal(null); setEditVisit(null) }}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">방문 날짜</label>
              <input type="date" value={visitForm.visit_date} onChange={e => setVisitForm(p => ({...p,visit_date:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">이용자 수 (명)</label>
              <input type="number" value={visitForm.visitor_count} onChange={e => setVisitForm(p => ({...p,visitor_count:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">비고</label>
              <input value={visitForm.notes} onChange={e => setVisitForm(p => ({...p,notes:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <button onClick={saveVisit} className="w-full bg-brand text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors">저장</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
