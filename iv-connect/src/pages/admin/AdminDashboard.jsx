import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const STAGE_INFO = {
  1: { label:'Brainstorm', icon:'ti-bulb', color:'#185FA5', bg:'#E6F1FB', desc:'Collecting student opinions & destination votes' },
  2: { label:'Registration', icon:'ti-clipboard-list', color:'#0F6E56', bg:'#E1F5EE', desc:'Student registration & pre-order store open' },
  3: { label:'Trip Plan', icon:'ti-map', color:'#854F0B', bg:'#FAEEDA', desc:'Itinerary published, allocations visible to students' },
  4: { label:'Live Hub', icon:'ti-radio', color:'#791F1F', bg:'#FCEBEB', desc:'Trip day live — location tracking & announcements active' },
  5: { label:'Feedback', icon:'ti-star', color:'#3C3489', bg:'#EEEDFE', desc:'Post-trip feedback collection open' },
}
const SECTIONS = ['A','B','C','D','E']
const SEC_COLORS = { A:'#185FA5', B:'#1D9E75', C:'#854F0B', D:'#534AB7', E:'#27500A' }

export default function AdminDashboard() {
  const { activeStage, switchStage, stageLoading, admin, adminLogout } = useApp()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState({ total:0, confirmed:0, paid:0, pending:0, veg:0, nonVeg:0 })
  const [sectionData, setSectionData] = useState([])
  const [paymentData, setPaymentData] = useState([])
  const [stage1Data, setStage1Data] = useState({ kochi:0, bangalore:0 })
  const [registrations, setRegistrations] = useState([])
  const [announcement, setAnnouncement] = useState('')
  const [announcePriority, setAnnouncePriority] = useState('normal')
  const [csvUploading, setCsvUploading] = useState(false)
  const [csvMsg, setCsvMsg] = useState('')
  const [tripFee, setTripFee] = useState(1200)
  const [busCost, setBusCost] = useState(80000)
  const [hotelCost, setHotelCost] = useState(60000)
  const [foodCost, setFoodCost] = useState(40000)
  const [entryCost, setEntryCost] = useState(20000)
  const [miscCost, setMiscCost] = useState(10000)
  const [tshirtCost, setTshirtCost] = useState(180)
  const [tshirtSell, setTshirtSell] = useState(250)
  const [snackCost, setSnackCost] = useState(60)
  const [snackSell, setSnackSell] = useState(100)
  const [itinerary, setItinerary] = useState([])
  const [newItem, setNewItem] = useState({ day_number:1, time_slot:'', activity:'', location:'', notes:'' })

  useEffect(() => { fetchStats(); fetchRegistrations(); fetchStage1(); fetchItinerary() }, [])

  async function fetchStats() {
    const { data: regs } = await supabase.from('stage2_registrations').select('*')
    if (!regs) return
    const confirmed = regs.filter(r => r.attendance === 'coming')
    const paid = regs.filter(r => r.payment_status === 'verified')
    const pending = regs.filter(r => r.payment_status === 'pending' && r.attendance === 'coming')
    const veg = confirmed.filter(r => r.food_preference === 'veg').length
    const nonVeg = confirmed.filter(r => r.food_preference === 'non_veg').length
    setStats({ total: regs.length, confirmed: confirmed.length, paid: paid.length, pending: pending.length, veg, nonVeg })
    const secCounts = SECTIONS.map(s => ({ section: `Sec ${s}`, count: confirmed.filter(r => r.section === s).length }))
    setSectionData(secCounts)
    setPaymentData([
      { name:'UPI Paid', value: regs.filter(r => r.payment_mode==='upi' && r.payment_status==='verified').length, color:'#27500A' },
      { name:'Cash Paid', value: regs.filter(r => r.payment_mode==='cash' && r.payment_status==='verified').length, color:'#185FA5' },
      { name:'Cash Pending', value: regs.filter(r => r.payment_mode==='cash' && r.payment_status==='pending').length, color:'#854F0B' },
      { name:'Not Paid', value: regs.filter(r => r.attendance==='coming' && r.payment_status==='pending' && !r.payment_mode).length, color:'#791F1F' },
    ])
    setRegistrations(regs)
  }

  async function fetchStage1() {
    const { data } = await supabase.from('stage1_responses').select('destination_vote')
    if (data) setStage1Data({ kochi: data.filter(d => d.destination_vote === 'kochi').length, bangalore: data.filter(d => d.destination_vote === 'bangalore').length })
  }

  async function fetchItinerary() {
    const { data } = await supabase.from('trip_itinerary').select('*').order('day_number')
    if (data) setItinerary(data)
  }

  async function handleCSVUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setCsvUploading(true); setCsvMsg('')
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target.result, { type:'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)
      const mapped = rows.map(r => ({
        register_number: String(r.register_number || r['Register Number'] || '').toUpperCase().trim(),
        enrollment_number: String(r.enrollment_number || r['Enrollment Number'] || '').trim(),
        full_name: String(r.full_name || r['Full Name'] || r['Name'] || '').trim(),
        section: String(r.section || r['Section'] || '').toUpperCase().trim(),
        date_of_birth: r.date_of_birth || r['Date of Birth'] || r['DOB'] || '',
      })).filter(r => r.register_number && r.full_name)
      const { error } = await supabase.from('students_master').upsert(mapped, { onConflict: 'register_number' })
      setCsvMsg(error ? `Error: ${error.message}` : `✅ ${mapped.length} students uploaded successfully!`)
      setCsvUploading(false)
    }
    reader.readAsBinaryString(file)
  }

  async function sendAnnouncement() {
    if (!announcement.trim()) return
    await supabase.from('announcements').insert({ message: announcement, priority: announcePriority, created_by: admin.username })
    setAnnouncement('')
  }

  async function exportExcel() {
    const wb = XLSX.utils.book_new()
    SECTIONS.forEach(sec => {
      const secData = registrations.filter(r => r.section === sec).map(r => ({
        'Register No': r.register_number, 'Section': r.section,
        'Attendance': r.attendance, 'Food': r.food_preference,
        'T-Shirt': r.tshirt_size, 'Payment Mode': r.payment_mode,
        'Payment Status': r.payment_status, 'Total (₹)': r.total_amount,
        'Emergency Contact': r.emergency_contact,
        'Photo Album': r.photo_album ? 'Yes' : 'No',
        'Lanyard': r.id_lanyard ? 'Yes' : 'No',
        'Kerala Souvenir': r.kerala_souvenir ? 'Yes' : 'No',
      }))
      const ws = XLSX.utils.json_to_sheet(secData)
      XLSX.utils.book_append_sheet(wb, ws, `Section ${sec}`)
    })
    XLSX.writeFile(wb, 'IV_Connect_Registrations.xlsx')
  }

  async function markPayment(regNo, status) {
    await supabase.from('stage2_registrations').update({ payment_status: status }).eq('register_number', regNo)
    fetchStats()
  }

  async function addItineraryItem() {
    if (!newItem.time_slot || !newItem.activity) return
    await supabase.from('trip_itinerary').insert(newItem)
    fetchItinerary()
    setNewItem({ day_number:1, time_slot:'', activity:'', location:'', notes:'' })
  }

  const totalCollection = stats.confirmed * tripFee
  const totalExpenses = busCost + hotelCost + foodCost + entryCost + miscCost
  const netBalance = totalCollection - totalExpenses
  const tshirtProfit = stats.confirmed * (tshirtSell - tshirtCost)
  const snackProfit = stats.confirmed * (snackSell - snackCost)

  const TAB_LIST = [
    { id:'overview', icon:'ti-chart-pie', label:'Overview' },
    { id:'students', icon:'ti-users', label:'Students' },
    { id:'payments', icon:'ti-cash', label:'Payments' },
    { id:'itinerary', icon:'ti-calendar', label:'Itinerary' },
    { id:'live', icon:'ti-radio', label:'Live Hub' },
    { id:'calculator', icon:'ti-calculator', label:'Calculator' },
    { id:'upload', icon:'ti-file-upload', label:'CSV Upload' },
    { id:'staff', icon:'ti-users-group', label:'Staff' },
  ]

  return (
    <div className="min-h-screen" style={{ background:'var(--surface)' }}>
      {/* Navbar */}
      <nav style={{ background:'var(--brand)', padding:'0 1.25rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <i className="ti ti-shield" style={{ color:'white', fontSize:20 }} />
          <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:15, color:'white' }}>IV Connect — Admin</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>{admin?.username}</span>
          <button onClick={adminLogout} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, padding:'5px 10px', color:'white', fontSize:12, cursor:'pointer' }}>Logout</button>
        </div>
      </nav>

      {/* Stage switcher */}
      <div style={{ background:'white', borderBottom:'1px solid var(--border)', padding:'12px 1.25rem' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:10 }}>Current Stage — Click to switch</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {Object.entries(STAGE_INFO).map(([num, info]) => (
            <button key={num} onClick={() => { if (window.confirm(`Switch to Stage ${num} — ${info.label}?`)) switchStage(parseInt(num)) }}
              disabled={stageLoading}
              style={{ padding:'7px 14px', borderRadius:99, border:`2px solid ${activeStage === parseInt(num) ? info.color : 'var(--border)'}`, background: activeStage === parseInt(num) ? info.bg : 'white', color: activeStage === parseInt(num) ? info.color : 'var(--text-secondary)', fontSize:12, fontFamily:'Syne', fontWeight:700, cursor:'pointer', transition:'all .18s', display:'flex', alignItems:'center', gap:5 }}>
              <i className={`ti ${info.icon}`} style={{ fontSize:13 }} />
              {activeStage === parseInt(num) && <span style={{ width:6, height:6, borderRadius:'50%', background:info.color, display:'inline-block', animation:'pulse-dot 1.5s ease infinite' }} />}
              Stage {num} — {info.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:8 }}><i className="ti ti-info-circle" style={{ fontSize:13 }} /> {STAGE_INFO[activeStage]?.desc}</div>
      </div>

      {/* Tabs */}
      <div style={{ background:'white', borderBottom:'1px solid var(--border)', padding:'0 1.25rem', display:'flex', gap:4, overflowX:'auto' }}>
        {TAB_LIST.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'10px 14px', border:'none', background:'none', fontSize:13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'var(--brand)' : 'var(--text-secondary)', borderBottom: tab === t.id ? '2px solid var(--brand)' : '2px solid transparent', cursor:'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6, transition:'color .15s' }}>
            <i className={`ti ${t.icon}`} style={{ fontSize:14 }} />{t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem 1rem' }}>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="animate-fade-up">
            {/* Stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
              {[
                { label:'Total Registered', val:stats.total, icon:'ti-users', color:'var(--brand)', bg:'#E6F1FB' },
                { label:'Confirmed Coming', val:stats.confirmed, icon:'ti-check', color:'#0F6E56', bg:'#E1F5EE' },
                { label:'Payments Verified', val:stats.paid, icon:'ti-receipt', color:'#854F0B', bg:'#FAEEDA' },
                { label:'Pending Payment', val:stats.pending, icon:'ti-clock', color:'#791F1F', bg:'#FCEBEB' },
              ].map(s => (
                <div key={s.label} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={`ti ${s.icon}`} style={{ color:s.color, fontSize:20 }} />
                  </div>
                  <div>
                    <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:24 }}>{s.val}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              {/* Section chart */}
              <div className="card">
                <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:14 }}>Section-wise Confirmed</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={sectionData}>
                    <XAxis dataKey="section" tick={{ fontSize:12 }} />
                    <YAxis tick={{ fontSize:12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6,6,0,0]}>
                      {sectionData.map((_, i) => <Cell key={i} fill={Object.values(SEC_COLORS)[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Payment chart */}
              <div className="card">
                <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:14 }}>Payment Breakdown</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                      {paymentData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Destination votes */}
            <div className="card" style={{ marginBottom:12 }}>
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Stage 1 — Destination Votes</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[{ label:'🌴 Kochi, Kerala', val:stage1Data.kochi, color:'#1D9E75' }, { label:'🏙️ Bangalore, Karnataka', val:stage1Data.bangalore, color:'#2E5496' }].map(d => {
                  const total = stage1Data.kochi + stage1Data.bangalore
                  const pct = total ? Math.round(d.val/total*100) : 0
                  return (
                    <div key={d.label}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                        <span style={{ fontWeight:500 }}>{d.label}</span>
                        <span style={{ fontWeight:700 }}>{d.val} votes ({pct}%)</span>
                      </div>
                      <div style={{ height:10, background:'#f3f4f6', borderRadius:99, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:d.color, borderRadius:99, transition:'width .5s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Food counts */}
            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:10 }}>Food Preference</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ background:'#E1F5EE', borderRadius:10, padding:'14px', textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>🥗</div>
                  <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, color:'#0F6E56' }}>{stats.veg}</div>
                  <div style={{ fontSize:12, color:'#0F6E56' }}>Vegetarian</div>
                </div>
                <div style={{ background:'#FAEEDA', borderRadius:10, padding:'14px', textAlign:'center' }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>🍗</div>
                  <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, color:'#854F0B' }}>{stats.nonVeg}</div>
                  <div style={{ fontSize:12, color:'#854F0B' }}>Non-Vegetarian</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {tab === 'students' && (
          <div className="animate-fade-up">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, margin:0 }}>All Registrations</h2>
              <button className="btn btn-success" onClick={exportExcel}><i className="ti ti-download" /> Export Excel</button>
            </div>
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'var(--surface)' }}>
                      {['Reg No.','Name','Sec','Attendance','Food','T-Shirt','Payment','Amount','Status'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:'var(--text-secondary)', fontSize:12, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r, i) => (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : 'var(--surface)' }}>
                        <td style={{ padding:'9px 12px', fontWeight:500, color:'var(--brand)' }}>{r.register_number}</td>
                        <td style={{ padding:'9px 12px' }}>{r.register_number}</td>
                        <td style={{ padding:'9px 12px' }}><span className={`stage-pill sec-${r.section?.toLowerCase()}`} style={{ fontSize:11 }}>{r.section}</span></td>
                        <td style={{ padding:'9px 12px' }}>{r.attendance === 'coming' ? '✅' : r.attendance === 'not_coming' ? '❌' : '🤔'}</td>
                        <td style={{ padding:'9px 12px' }}>{r.food_preference === 'veg' ? '🥗 Veg' : '🍗 NV'}</td>
                        <td style={{ padding:'9px 12px', fontWeight:600 }}>{r.tshirt_size}</td>
                        <td style={{ padding:'9px 12px' }}>{r.payment_mode === 'upi' ? '📱 UPI' : r.payment_mode === 'cash' ? '💵 Cash' : '—'}</td>
                        <td style={{ padding:'9px 12px', fontWeight:600 }}>₹{r.total_amount}</td>
                        <td style={{ padding:'9px 12px' }}>
                          {r.payment_status === 'verified'
                            ? <span style={{ background:'#EAF3DE', color:'#27500A', padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600 }}>✅ Paid</span>
                            : r.attendance === 'coming'
                              ? <button onClick={() => markPayment(r.register_number, 'verified')} style={{ background:'#FAEEDA', color:'#633806', border:'none', padding:'3px 8px', borderRadius:99, fontSize:11, fontWeight:600, cursor:'pointer' }}>Mark Paid</button>
                              : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {tab === 'payments' && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:14 }}>Payment Management</h2>
            {registrations.filter(r => r.attendance === 'coming' && r.payment_mode === 'upi').map(r => (
              <div key={r.id} className="card" style={{ marginBottom:10, display:'flex', alignItems:'center', gap:14 }}>
                {r.payment_proof_url && <img src={r.payment_proof_url} alt="proof" style={{ width:60, height:60, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} />}
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:14 }}>{r.register_number}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Sec {r.section} · UPI · ₹{r.total_amount}</div>
                </div>
                {r.payment_status === 'verified'
                  ? <span style={{ background:'#EAF3DE', color:'#27500A', padding:'4px 12px', borderRadius:99, fontSize:12, fontWeight:600 }}>✅ Verified</span>
                  : <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => markPayment(r.register_number, 'verified')} className="btn btn-success" style={{ padding:'6px 12px', fontSize:12 }}>✓ Verify</button>
                      <button onClick={() => markPayment(r.register_number, 'rejected')} className="btn btn-danger" style={{ padding:'6px 12px', fontSize:12 }}>✗ Reject</button>
                    </div>}
              </div>
            ))}
          </div>
        )}

        {/* ITINERARY TAB */}
        {tab === 'itinerary' && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:14 }}>3-Day Trip Itinerary</h2>
            {/* Add item */}
            <div className="card" style={{ marginBottom:16 }}>
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Add Itinerary Item</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 2fr 2fr 2fr', gap:8, marginBottom:10 }}>
                <select className="input" value={newItem.day_number} onChange={e => setNewItem(n => ({ ...n, day_number: parseInt(e.target.value) }))}>
                  <option value={1}>Day 1</option><option value={2}>Day 2</option><option value={3}>Day 3</option>
                </select>
                <input className="input" placeholder="Time e.g. 8:00 AM" value={newItem.time_slot} onChange={e => setNewItem(n => ({ ...n, time_slot: e.target.value }))} />
                <input className="input" placeholder="Activity" value={newItem.activity} onChange={e => setNewItem(n => ({ ...n, activity: e.target.value }))} />
                <input className="input" placeholder="Location (optional)" value={newItem.location} onChange={e => setNewItem(n => ({ ...n, location: e.target.value }))} />
                <input className="input" placeholder="Notes (optional)" value={newItem.notes} onChange={e => setNewItem(n => ({ ...n, notes: e.target.value }))} />
              </div>
              <button className="btn btn-primary" onClick={addItineraryItem}><i className="ti ti-plus" /> Add Item</button>
            </div>
            {[1,2,3].map(day => (
              <div key={day} className="card" style={{ marginBottom:12 }}>
                <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:12, color:'var(--brand)' }}>Day {day}</div>
                {itinerary.filter(i => i.day_number === day).map(item => (
                  <div key={item.id} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'var(--brand)', minWidth:70, flexShrink:0 }}>{item.time_slot}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:500 }}>{item.activity}</div>
                      {item.location && <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{item.location}</div>}
                    </div>
                    <button onClick={async () => { await supabase.from('trip_itinerary').delete().eq('id', item.id); fetchItinerary() }} style={{ background:'#FEF2F2', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'#EF4444', fontSize:11 }}>Remove</button>
                  </div>
                ))}
                {itinerary.filter(i => i.day_number === day).length === 0 && <p style={{ color:'var(--text-muted)', fontSize:13 }}>No items for Day {day} yet</p>}
              </div>
            ))}
          </div>
        )}

        {/* LIVE HUB TAB */}
        {tab === 'live' && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:14 }}>Live Trip Hub Control</h2>
            <div className="card" style={{ marginBottom:16 }}>
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Send Announcement</h3>
              <textarea className="input" rows={3} placeholder="Type announcement message..." value={announcement} onChange={e => setAnnouncement(e.target.value)} style={{ marginBottom:10, resize:'vertical' }} />
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <select className="input" style={{ width:'auto' }} value={announcePriority} onChange={e => setAnnouncePriority(e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="sos">SOS Alert</option>
                </select>
                <button className="btn btn-primary" onClick={sendAnnouncement}><i className="ti ti-speakerphone" /> Send to All Students</button>
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:4 }}>📍 Live Location Map</h3>
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:10 }}>View student locations in real-time on the map. Students sharing location appear as pins colour-coded by bus.</p>
              <div style={{ background:'var(--surface)', borderRadius:10, padding:20, textAlign:'center', border:'2px dashed var(--border)' }}>
                <i className="ti ti-map" style={{ fontSize:32, color:'var(--text-muted)', display:'block', marginBottom:8 }} />
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>Live map renders here during Stage 4 (trip day)</p>
              </div>
            </div>
          </div>
        )}

        {/* CALCULATOR TAB */}
        {tab === 'calculator' && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:14 }}>Trip Cost Calculator</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="card">
                <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Inputs</h3>
                {[
                  ['Students confirmed', tripFee, setTripFee, 'Trip fee per student (₹)'],
                  ['Bus cost total (₹)', busCost, setBusCost, 'Total bus rental'],
                  ['Hotel cost total (₹)', hotelCost, setHotelCost, '3-night accommodation'],
                  ['Food cost total (₹)', foodCost, setFoodCost, 'All meals combined'],
                  ['Entry/visit fees (₹)', entryCost, setEntryCost, 'Industry visit entry'],
                  ['Misc expenses (₹)', miscCost, setMiscCost, 'Miscellaneous'],
                ].map(([label, val, setter, hint]) => (
                  <div key={label} style={{ marginBottom:10 }}>
                    <label style={{ fontSize:12, color:'var(--text-secondary)', display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span>{hint}</span>
                    </label>
                    <input className="input" type="number" value={val} onChange={e => setter(parseInt(e.target.value) || 0)} />
                  </div>
                ))}
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:12, color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Trip fee per student (₹)</label>
                  <input className="input" type="number" value={tripFee} onChange={e => setTripFee(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div>
                <div className="card" style={{ marginBottom:10 }}>
                  <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Trip Summary</h3>
                  {[
                    ['Total collection', `₹${(stats.confirmed * tripFee).toLocaleString('en-IN')}`, '#27500A'],
                    ['Total expenses', `₹${totalExpenses.toLocaleString('en-IN')}`, '#791F1F'],
                    ['Cost per student', `₹${stats.confirmed ? Math.round(totalExpenses/stats.confirmed).toLocaleString('en-IN') : 0}`, 'var(--text-primary)'],
                    ['Break-even students', `${tripFee ? Math.ceil(totalExpenses/tripFee) : 0} students`, 'var(--text-primary)'],
                  ].map(([k, v, c]) => (
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                      <span style={{ color:'var(--text-secondary)' }}>{k}</span>
                      <span style={{ fontWeight:700, color:c }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:12, padding:14, borderRadius:10, background: netBalance >= 0 ? '#EAF3DE' : '#FEF2F2' }}>
                    <div style={{ fontSize:12, color: netBalance >= 0 ? '#27500A' : '#791F1F', fontWeight:600, marginBottom:4 }}>{netBalance >= 0 ? 'SURPLUS' : 'DEFICIT'}</div>
                    <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, color: netBalance >= 0 ? '#27500A' : '#791F1F' }}>₹{Math.abs(netBalance).toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="card">
                  <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Merchandise Profit</h3>
                  {[['T-Shirt cost', tshirtCost, setTshirtCost], ['T-Shirt price', tshirtSell, setTshirtSell], ['Snack bag cost', snackCost, setSnackCost], ['Snack bag price', snackSell, setSnackSell]].map(([l, v, s]) => (
                    <div key={l} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:13, flex:1, color:'var(--text-secondary)' }}>{l}</span>
                      <input className="input" type="number" value={v} onChange={e => s(parseInt(e.target.value)||0)} style={{ width:80 }} />
                    </div>
                  ))}
                  <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                    {[['T-Shirt Profit', `₹${tshirtProfit.toLocaleString('en-IN')}`], ['Snack Profit', `₹${snackProfit.toLocaleString('en-IN')}`], ['Total Merch', `₹${(tshirtProfit+snackProfit).toLocaleString('en-IN')}`]].map(([l,v]) => (
                      <div key={l} style={{ background:'var(--surface)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                        <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:16, color:'var(--brand)' }}>{v}</div>
                        <div style={{ fontSize:11, color:'var(--text-secondary)', marginTop:2 }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV UPLOAD TAB */}
        {tab === 'upload' && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:14 }}>Upload Student Data</h2>
            <div className="card" style={{ marginBottom:16 }}>
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:8 }}>CSV / Excel Upload</h3>
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:14 }}>Upload your student master data. Required columns: <code>register_number</code>, <code>full_name</code>, <code>section</code>, <code>date_of_birth</code></p>
              <label style={{ display:'block', cursor:'pointer' }}>
                <div style={{ border:'2px dashed var(--border)', borderRadius:12, padding:32, textAlign:'center', background:'var(--surface)', transition:'border-color .2s' }}>
                  <i className="ti ti-file-upload" style={{ fontSize:32, color:'var(--text-muted)', display:'block', marginBottom:10 }} />
                  <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:4 }}>Click to upload CSV / Excel</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Supports .csv, .xlsx, .xls files</div>
                </div>
                <input type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={handleCSVUpload} />
              </label>
              {csvUploading && <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--brand)' }}><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Uploading and processing...</div>}
              {csvMsg && <div style={{ marginTop:12, padding:'10px 14px', borderRadius:8, background: csvMsg.startsWith('✅') ? '#EAF3DE' : '#FEF2F2', fontSize:13, color: csvMsg.startsWith('✅') ? '#27500A' : '#DC2626' }}>{csvMsg}</div>}
            </div>
            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:8 }}>Required CSV Format</h3>
              <table style={{ width:'100%', fontSize:13, borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'var(--surface)' }}>
                    {['Column', 'Example', 'Required'].map(h => <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600, color:'var(--text-secondary)', borderBottom:'1px solid var(--border)', fontSize:12 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[['register_number','21CSE001','Yes'],['enrollment_number','EN21CS001','Optional'],['full_name','Arun Kumar','Yes'],['section','A','Yes (A/B/C/D/E)'],['date_of_birth','2003-03-15','Yes (YYYY-MM-DD)']].map(([c,e,r]) => (
                    <tr key={c} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'8px 10px', fontWeight:500, color:'var(--brand)' }}>{c}</td>
                      <td style={{ padding:'8px 10px', color:'var(--text-secondary)' }}>{e}</td>
                      <td style={{ padding:'8px 10px' }}><span style={{ fontSize:11, background: r === 'Yes' ? '#EAF3DE' : '#f3f4f6', color: r === 'Yes' ? '#27500A' : 'var(--text-muted)', padding:'2px 7px', borderRadius:99, fontWeight:600 }}>{r}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STAFF TAB */}
        {tab === 'staff' && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:14 }}>Staff Account Management</h2>
            <StaffManagement />
          </div>
        )}

      </div>
    </div>
  )
}

function StaffManagement() {
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState({ name:'', email:'', password_hash:'', role:'adviser', assigned_section:'', assigned_bus:'' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('staff_accounts').select('*').then(({ data }) => { if (data) setStaff(data) })
  }, [])

  async function addStaff() {
    if (!form.name || !form.email || !form.password_hash) return
    setLoading(true)
    const { error } = await supabase.from('staff_accounts').insert({ ...form, assigned_bus: form.assigned_bus ? parseInt(form.assigned_bus) : null })
    if (!error) {
      const { data } = await supabase.from('staff_accounts').select('*')
      if (data) setStaff(data)
      setForm({ name:'', email:'', password_hash:'', role:'adviser', assigned_section:'', assigned_bus:'' })
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="card" style={{ marginBottom:16 }}>
        <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Add Staff Account</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
          <input className="input" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="input" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <input className="input" placeholder="Password" type="password" value={form.password_hash} onChange={e => setForm(f => ({ ...f, password_hash: e.target.value }))} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
          <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="hod">HOD (All sections)</option>
            <option value="adviser">Class Adviser</option>
            <option value="bus_coordinator">Bus Coordinator</option>
          </select>
          {form.role === 'adviser' && (
            <select className="input" value={form.assigned_section} onChange={e => setForm(f => ({ ...f, assigned_section: e.target.value }))}>
              <option value="">Select Section</option>
              {['A','B','C','D','E'].map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          )}
          {form.role === 'bus_coordinator' && (
            <select className="input" value={form.assigned_bus} onChange={e => setForm(f => ({ ...f, assigned_bus: e.target.value }))}>
              <option value="">Select Bus</option>
              {[1,2,3,4,5].map(b => <option key={b} value={b}>Bus {b}</option>)}
            </select>
          )}
        </div>
        <button className="btn btn-primary" onClick={addStaff} disabled={loading}><i className="ti ti-plus" /> Add Staff</button>
      </div>

      <div className="card">
        <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Staff Accounts ({staff.length})</h3>
        {staff.map(s => (
          <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--brand-light)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className="ti ti-user" style={{ color:'var(--brand)', fontSize:16 }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:14 }}>{s.name}</div>
              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.email}</div>
            </div>
            <span style={{ fontSize:12, padding:'3px 10px', borderRadius:99, fontWeight:600, background: s.role === 'hod' ? '#FCEBEB' : s.role === 'adviser' ? '#E6F1FB' : '#E1F5EE', color: s.role === 'hod' ? '#791F1F' : s.role === 'adviser' ? '#0C447C' : '#085041' }}>
              {s.role === 'hod' ? 'HOD' : s.role === 'adviser' ? `Adviser · Sec ${s.assigned_section}` : `Bus ${s.assigned_bus} Coordinator`}
            </span>
          </div>
        ))}
        {staff.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:20 }}>No staff accounts yet</p>}
      </div>
    </div>
  )
}
