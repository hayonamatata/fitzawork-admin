'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react'

const STATUS_OPTIONS = ['기획중', '확정', '완료']
const TYPE_OPTIONS   = ['대관', '크리에이터 전시/팝업', '프로그램']
const FEE_OPTIONS    = ['대관비', '1인당 참가비', '무료']
const DAY_OPTIONS    = ['월', '화', '수', '목', '금', '토', '일']
const DAY_MAP        = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0 }

const TYPE_COLOR = {
  '대관': 'bg-purple-100 text-purple-700',
  '크리에이터 전시/팝업': 'bg-orange-100 text-orange-700',
  '프로그램': 'bg-blue-100 text-blue-700',
}
const TYPE_CAL = {
  '대관': 'bg-purple-400',
  '크리에이터 전시/팝업': 'bg-orange-400',
  '프로그램': 'bg-blue-400',
}
const STATUS_COLOR = {
  확정: 'bg-green-100 text-green-700',
  기획중: 'bg-blue-100 text-blue-700',
  완료: 'bg-gray-100 text-gray-500',
}

const EMPTY = {
  name: '', type: '대관', start_date: '', end_date: '', day_of_week: '',
  time: '', fee_type: '대관비', unit_price: '', expected_attendees: '',
  partner: '', status: '기획중', poster_url: '', notes: ''
}

// 회차 수 계산
const calcSessions = (start, end, dow) => {
  if (!start) return 0
  if (!end || start === end || !dow) return 1
  const target = DAY_MAP[dow]
  let count = 0
  let cur = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  while (cur <= endD) {
    if (cur.getDay() === target) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count || 1
}

// 총액 계산
const calcTotal = (feeType, unitPrice, sessions, attendees) => {
  if (feeType === '무료') return 0
  const p = +unitPrice || 0
  if (feeType === '1인당 참가비') return p * sessions * (+attendees || 1)
  return p * sessions
}

const fmtMoney = (n) => n ? n.toLocaleString() + '원' : '-'

export default function EventsPage() {
  const [events, setEvents]     = useState([])
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [filter, setFilter]     = useState('전체')
  const [view, setView]         = useState('list')
  const [calMonth, setCalMonth] = useState(new Date())

  const load = async () => {
    const { data } = await supabase.from('events').select('*').order('start_date')
    setEvents(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = (ev) => { setForm({ ...EMPTY, ...ev }); setEditId(ev.id); setModal(true) }

  const sessions = calcSessions(form.start_date, form.end_date, form.day_of_week)
  const total    = calcTotal(form.fee_type, form.unit_price, sessions, form.expected_attendees)

  const save = async () => {
    if (!form.name.trim()) return alert('이벤트명을 입력해주세요')
    const payload = {
      name: form.name, type: form.type,
      start_date: form.start_date || null, end_date: form.end_date || null,
      day_of_week: form.day_of_week || null, time: form.time || null,
      fee_type: form.fee_type, unit_price: +form.unit_price || null,
      expected_attendees: +form.expected_attendees || null,
      partner: form.partner || null, status: form.status,
      poster_url: form.poster_url || null, notes: form.notes || null,
    }
    if (editId) await supabase.from('events').update(payload).eq('id', editId)
    else        await supabase.from('events').insert([payload])
    setModal(false); load()
  }

  const remove = async (id) => {
    if (!confirm('이벤트를 삭제할까요?')) return
    await supabase.from('events').delete().eq('id', id)
    load()
  }

  const filtered = filter === '전체' ? events : events.filter(e => e.status === filter)

  // 캘린더 계산
  const year      = calMonth.getFullYear()
  const month     = calMonth.getMonth()
  const firstDay  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const today     = new Date()

  const eventsForDay = (day) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const jsDay = new Date(d + 'T00:00:00').getDay()
    return events.filter(ev => {
      if (!ev.start_date) return false
      if (d < ev.start_date || d > (ev.end_date || ev.start_date)) return false
      // 반복 요일이 있으면 해당 요일에만 표시
      if (ev.day_of_week) return jsDay === DAY_MAP[ev.day_of_week]
      return true
    })
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">이벤트 관리</h2>
          <p className="text-sm text-gray-500 mt-1">{new Date().getFullYear()} 이벤트 기획 현황</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                ${view === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <List size={13} /> 목록
            </button>
            <button onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
                ${view === 'calendar' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              <Calendar size={13} /> 캘린더
            </button>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
            <Plus size={16} /> 이벤트 추가
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {['전체', ...STATUS_OPTIONS].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all
              ${filter === s ? 'bg-brand text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-brand'}`}>
            {s}
          </button>
        ))}
      </div>

      {view === 'list' ? (
        /* ── 목록 뷰 ── */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs border-b border-gray-100">
                {['이벤트명', '유형', '날짜', '회차', '시간', '파트너', '상태', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} className="text-center text-gray-400 py-12">등록된 이벤트가 없습니다</td></tr>
                : filtered.map(ev => {
                  const s = calcSessions(ev.start_date, ev.end_date, ev.day_of_week)
                  const t = calcTotal(ev.fee_type, ev.unit_price, s, ev.expected_attendees)
                  return (
                    <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <Link href={`/events/${ev.id}`} className="font-semibold text-gray-800 hover:text-brand transition-colors">
                          {ev.name}
                        </Link>
                        {ev.fee_type !== '무료' && ev.unit_price &&
                          <p className="text-xs text-gray-400 mt-0.5">{fmtMoney(t)}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLOR[ev.type] || 'bg-gray-100 text-gray-600'}`}>
                          {ev.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-xs">
                        {ev.start_date}
                        {ev.end_date && ev.end_date !== ev.start_date ? ` ~ ${ev.end_date}` : ''}
                        {ev.day_of_week && <span className="ml-1 text-gray-400">매주 {ev.day_of_week}</span>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{s}회</td>
                      <td className="px-4 py-3.5 text-gray-600">{ev.time || '-'}</td>
                      <td className="px-4 py-3.5 text-gray-600">{ev.partner || '-'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[ev.status] || 'bg-gray-100 text-gray-500'}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(ev)} className="text-gray-400 hover:text-brand transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => remove(ev.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      ) : (
        /* ── 캘린더 뷰 ── */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 월 이동 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={() => setCalMonth(new Date(year, month - 1, 1))}
              className="text-gray-400 hover:text-brand transition-colors p-1 rounded-lg hover:bg-gray-50">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-base font-bold text-gray-800">{year}년 {month + 1}월</h3>
            <button onClick={() => setCalMonth(new Date(year, month + 1, 1))}
              className="text-gray-400 hover:text-brand transition-colors p-1 rounded-lg hover:bg-gray-50">
              <ChevronRight size={20} />
            </button>
          </div>
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`text-center text-xs font-semibold py-2.5
                ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>
                {d}
              </div>
            ))}
          </div>
          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="border-b border-r border-gray-50 h-28" />
            ))}
            {Array.from({ length: daysInMon }).map((_, i) => {
              const day    = i + 1
              const col    = (firstDay + i) % 7
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
              const dayEvs = eventsForDay(day)
              return (
                <div key={day} className={`border-b border-r border-gray-50 h-28 p-1.5
                  ${col === 0 ? 'bg-red-50/20' : col === 6 ? 'bg-blue-50/10' : ''}`}>
                  <p className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-brand text-white' : col === 0 ? 'text-red-400' : col === 6 ? 'text-blue-400' : 'text-gray-600'}`}>
                    {day}
                  </p>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvs.slice(0, 3).map(ev => (
                      <button key={ev.id} onClick={() => openEdit(ev)}
                        className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded font-medium text-white truncate
                          ${TYPE_CAL[ev.type] || 'bg-gray-400'}`}>
                        {ev.name}
                      </button>
                    ))}
                    {dayEvs.length > 3 && (
                      <p className="text-[10px] text-gray-400 pl-1">+{dayEvs.length - 3}개</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {/* 범례 */}
          <div className="flex items-center gap-5 px-6 py-3 border-t border-gray-100 bg-gray-50">
            {TYPE_OPTIONS.map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${TYPE_CAL[t]}`} />
                <span className="text-xs text-gray-500">{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 폼 모달 ── */}
      {modal && (
        <Modal title={editId ? '이벤트 수정' : '이벤트 추가'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            {/* 이벤트명 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">이벤트명 *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            {/* 유형 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">유형</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            {/* 날짜 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">시작일</label>
                <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">종료일</label>
                <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            </div>
            {/* 요일 선택 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                반복 요일 <span className="text-gray-400 font-normal">(1일짜리면 선택 안 해도 돼요)</span>
              </label>
              <div className="flex gap-1.5">
                {DAY_OPTIONS.map(d => (
                  <button key={d} type="button"
                    onClick={() => setForm(p => ({ ...p, day_of_week: p.day_of_week === d ? '' : d }))}
                    className={`w-9 h-9 rounded-full text-sm font-semibold transition-all
                      ${form.day_of_week === d ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {/* 회차 자동계산 */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold">자동 계산된 회차 수</span>
              <span className="text-sm font-bold text-brand">{sessions}회</span>
            </div>
            {/* 시간 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">시작 시간</label>
              <input type="text" placeholder="예: 19:30" value={form.time || ''} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            {/* 과금 방식 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">과금 방식</label>
              <select value={form.fee_type} onChange={e => setForm(p => ({ ...p, fee_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {FEE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            {/* 금액 관련 */}
            {form.fee_type !== '무료' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">1회 금액 (원)</label>
                  <input type="number" value={form.unit_price || ''} onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                </div>
                {form.fee_type === '1인당 참가비' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">예상 인원</label>
                    <input type="number" value={form.expected_attendees || ''} onChange={e => setForm(p => ({ ...p, expected_attendees: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
                  </div>
                )}
                {/* 총액 자동계산 */}
                <div className="bg-brand/5 border border-brand/20 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">예상 총액</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {fmtMoney(+form.unit_price || 0)} × {sessions}회
                      {form.fee_type === '1인당 참가비' ? ` × ${form.expected_attendees || 1}명` : ''}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-brand">{total.toLocaleString()}원</span>
                </div>
              </>
            )}
            {/* 파트너 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">파트너</label>
              <input type="text" value={form.partner || ''} onChange={e => setForm(p => ({ ...p, partner: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            {/* 포스터 URL */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">포스터/아카이브 URL</label>
              <input type="text" placeholder="Google Drive, Instagram 링크 등" value={form.poster_url || ''} onChange={e => setForm(p => ({ ...p, poster_url: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            {/* 상태 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">상태</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            {/* 비고 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">비고</label>
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
