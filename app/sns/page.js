'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/Modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const STATUS_OPTIONS  = ['미정', '작성중', '업로드완료']
const TYPE_OPTIONS    = ['공간 소개','이벤트 홍보','일상/무드샷','회원 인터뷰','작업 브이로그','프로모션 안내']
const STATUS_COLOR    = { '업로드완료':'bg-green-100 text-green-700', '작성중':'bg-yellow-100 text-yellow-700', '미정':'bg-gray-100 text-gray-500' }
const EMPTY = { post_date:'', content_type:'공간 소개', topic:'', caption_direction:'', status:'미정', notes:'' }

export default function SnsPage() {
  const [posts, setPosts] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [filter, setFilter] = useState('전체')

  const load = async () => {
    const { data } = await supabase.from('sns_content').select('*').order('post_date')
    setPosts(data || [])
  }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = (p) => { setForm({ ...EMPTY, ...p }); setEditId(p.id); setModal(true) }

  const save = async () => {
    if (editId) await supabase.from('sns_content').update(form).eq('id', editId)
    else        await supabase.from('sns_content').insert([form])
    setModal(false); load()
  }
  const remove = async (id) => {
    if (!confirm('삭제할까요?')) return
    await supabase.from('sns_content').delete().eq('id', id)
    load()
  }

  const filtered = filter === '전체' ? posts : posts.filter(p => p.status === filter)
  const stats = { total: posts.length, done: posts.filter(p => p.status === '업로드완료').length, writing: posts.filter(p => p.status === '작성중').length }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">SNS 콘텐츠</h2>
          <p className="text-sm text-gray-500 mt-1">목표: 주 2-3회 업로드</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-dark transition-colors">
          <Plus size={16} /> 콘텐츠 추가
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[['전체 계획',`${stats.total}건`,'bg-gray-50'],['업로드 완료',`${stats.done}건`,'bg-green-50'],['작성중',`${stats.writing}건`,'bg-yellow-50']].map(([label,val,bg]) => (
          <div key={label} className={`${bg} rounded-xl p-4 border border-gray-100`}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{val}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
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
              {['업로드 날짜','콘텐츠 유형','주제 / 내용','캡션 방향','상태',''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} className="text-center text-gray-400 py-12">등록된 콘텐츠가 없습니다</td></tr>
              : filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3.5 text-gray-700 whitespace-nowrap">{p.post_date}</td>
                  <td className="px-4 py-3.5"><span className="bg-brand/10 text-brand text-xs px-2 py-0.5 rounded-full font-medium">{p.content_type}</span></td>
                  <td className="px-4 py-3.5 text-gray-800 max-w-[200px] truncate">{p.topic}</td>
                  <td className="px-4 py-3.5 text-gray-500 max-w-[160px] truncate">{p.caption_direction}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[p.status]||'bg-gray-100 text-gray-500'}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-brand transition-colors"><Pencil size={14}/></button>
                      <button onClick={() => remove(p.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={editId ? 'SNS 콘텐츠 수정' : 'SNS 콘텐츠 추가'} onClose={() => setModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">업로드 날짜</label>
              <input type="date" value={form.post_date} onChange={e => setForm(p => ({...p,post_date:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">콘텐츠 유형</label>
              <select value={form.content_type} onChange={e => setForm(p => ({...p,content_type:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            {[['주제 / 내용','topic'],['캡션 방향','caption_direction'],['비고','notes']].map(([label,key]) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input value={form[key]||''} onChange={e => setForm(p => ({...p,[key]:e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">업로드 상태</label>
              <select value={form.status} onChange={e => setForm(p => ({...p,status:e.target.value}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand">
                {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <button onClick={save} className="w-full bg-brand text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors">저장</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
