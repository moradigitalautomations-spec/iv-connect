import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import * as XLSX from 'xlsx'

const ROLE_LABEL = { hod: 'Head of Department', adviser: 'Class Adviser', bus_coordinator: 'Bus Coordinator' }
const STAGE_LABELS = { 1:'Brainstorm', 2:'Registration', 3:'Trip Plan', 4:'Live Hub', 5:'Feedback' }

export default function StaffDashboard() {
  const { staff, staffLogout, activeStage } = useApp()
  const [tab, setTab] = useState('overview')
  const [students, setStudents] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [feedback, setFeedback] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  const isHOD = staff?.role === 'hod'
  const isAdviser = staff?.role === 'adviser'
  const isBusCoord = staff?.role === 'bus_coordinator'

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchStudents(), fetchRegistrations(), fetchFeedback(), fetchAnnouncements(), fetchLocations()])
    setLoading(false)
  }

  async function fetchStudents() {
    let q = supabase.from('students_master').select('*')
    if (isAdviser) q = q.eq('section', staff.assigned_section)
    if (isBusCoord) q = q.eq('bus_number', staff.assigned_bus)
    const { data } = await q
    if (data) setStudents(data)
  }

  async function fetchRegistrations() {
    let q = supabase.from('stage2_registrations').select('*')
    if (isAdviser) q = q.eq('section', staff.assigned_section)
    if (isBusCoord) q = q.eq('section', staff.assigned_section) // bus coord sees their bus students
    const { data } = await q
    if (data) setRegistrations(data)
  }

  async function fetchFeedback() {
    if (isBusCoord) return // bus coordinators don't see feedback
    let q = supabase.from('stage5_feedback').select('*')
    if (isAdviser) q = q.eq('section', staff.assigned_section)
    const { data } = await q
    if (data) setFeedback(data)
  }

  async function fetchAnnouncements() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10)
    if (data) setAnnouncements(data)
  }

  async function fetchLocations() {
    let q = supabase.from('live_locations').select('*').eq('is_sharing', true)
    if (isAdviser) q = q.eq('section', staff.assigned_section)
    if (isBusCoord) q = q.eq('bus_number', staff.assigned_bus)
    const { data } = await q
    if (data) setLocations(data)
  }

  function exportMyStudents() {
    const rows = registrations.map(r => ({
      'Register No': r.register_number,
      'Section': r.section,
      'Attendance': r.attendance,
      'Food': r.food_preference,
      'Emergency Contact': r.emergency_contact,
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    const label = isAdviser ? `Section_${staff.assigned_section}` : `Bus_${staff.assigned_bus}`
    XLSX.utils.book_append_sheet(wb, ws, label)
    XLSX.writeFile(wb, `IV_${label}_Students.xlsx`)
  }

  // Stats
  const confirmed = registrations.filter(r => r.attendance === 'coming')
  const veg = confirmed.filter(r => r.food_preference === 'veg').length
  const nonVeg = confirmed.filter(r => r.food_preference === 'non_veg').length
  const sosStudents = locations.filter(l => l.sos_active)

  // For HOD — section-wise breakdown
  const sectionBreakdown = ['A','B','C','D','E'].map(s => ({
    section: `Sec ${s}`,
    confirmed: registrations.filter(r => r.section === s && r.attendance === 'coming').length,
  }))

  // Average feedback ratings
  const avgRating = (key) => feedback.length
    ? (feedback.reduce((sum, f) => sum + (f[key] || 0), 0) / feedback.length).toFixed(1)
    : '—'

  // Payment stats (hidden from bus coord)
  const paidCount = confirmed.filter(r => r.payment_status === 'verified').length
  const pendingCount = confirmed.filter(r => r.payment_status === 'pending').length

  const TABS = [
    { id:'overview', icon:'ti-chart-pie', label:'Overview' },
    { id:'students', icon:'ti-users', label:'My Students' },
    ...(activeStage >= 4 ? [{ id:'live', icon:'ti-map-pin', label:'Live Location' }] : []),
    ...(activeStage >= 5 && !isBusCoord ? [{ id:'feedback', icon:'ti-star', label:'Feedback' }] : []),
    { id:'announcements', icon:'ti-speakerphone', label:'Announcements' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <i className="ti ti-loader-2" style={{ fontSize:32, color:'var(--brand)', animation:'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background:'var(--surface)' }}>
      {/* Navbar */}
      <nav style={{ background:'#1D9E75', padding:'0 1.25rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <i className="ti ti-school" style={{ color:'white', fontSize:20 }} />
          <div>
            <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:14, color:'white' }}>IV Connect</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginLeft:8 }}>{ROLE_LABEL[staff?.role]}</span>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.8)' }}>{staff?.name}</span>
          <button onClick={staffLogout} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8, padding:'5px 10px', color:'white', fontSize:12, cursor:'pointer' }}>Logout</button>
        </div>
      </nav>

      {/* Role badge */}
      <div style={{ background:'white', borderBottom:'1px solid var(--border)', padding:'10px 1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
            {isHOD && '👨‍💼 HOD Dashboard — All Sections'}
            {isAdviser && `👨‍🏫 Section ${staff.assigned_section} Dashboard`}
            {isBusCoord && `🚌 Bus ${staff.assigned_bus} Dashboard`}
          </div>
          {isAdviser && <span className={`stage-pill sec-${staff.assigned_section?.toLowerCase()}`}>Section {staff.assigned_section}</span>}
          {isBusCoord && <span className="stage-pill bus-1" style={{ background:'#FAECE7', color:'#712B13' }}>Bus {staff.assigned_bus}</span>}
        </div>
        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
          Stage {activeStage} — {STAGE_LABELS[activeStage]} · {students.length} students
        </div>
      </div>

      {/* SOS Alert banner */}
      {sosStudents.length > 0 && (
        <div style={{ background:'#EF4444', padding:'10px 1.25rem', display:'flex', alignItems:'center', gap:10 }}>
          <i className="ti ti-alert-triangle" style={{ color:'white', fontSize:18 }} />
          <span style={{ color:'white', fontWeight:700, fontFamily:'Syne' }}>
            🆘 {sosStudents.length} SOS ALERT{sosStudents.length > 1 ? 'S' : ''} ACTIVE —
            {sosStudents.map(s => ` ${s.register_number}`).join(',')}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background:'white', borderBottom:'1px solid var(--border)', padding:'0 1.25rem', display:'flex', gap:4, overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'10px 14px', border:'none', background:'none', fontSize:13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#1D9E75' : 'var(--text-secondary)', borderBottom: tab === t.id ? '2px solid #1D9E75' : '2px solid transparent', cursor:'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
            <i className={`ti ${t.icon}`} style={{ fontSize:14 }} />{t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'1.5rem 1rem' }}>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="animate-fade-up">
            {/* Stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
              {[
                { label:'Total Students', val:students.length, icon:'ti-users', color:'#1D9E75', bg:'#E1F5EE' },
                { label:'Confirmed Coming', val:confirmed.length, icon:'ti-check', color:'#185FA5', bg:'#E6F1FB' },
                ...(isBusCoord ? [] : [{ label:'Payments Verified', val:paidCount, icon:'ti-receipt', color:'#854F0B', bg:'#FAEEDA' }]),
              ].map(s => (
                <div key={s.label} className="card" style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={`ti ${s.icon}`} style={{ color:s.color, fontSize:20 }} />
                  </div>
                  <div>
                    <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:26 }}>{s.val}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* HOD sees section breakdown */}
            {isHOD && (
              <div className="card" style={{ marginBottom:12 }}>
                <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Section-wise Confirmed Students</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={sectionBreakdown}>
                    <XAxis dataKey="section" tick={{ fontSize:12 }} />
                    <YAxis tick={{ fontSize:12 }} />
                    <Tooltip />
                    <Bar dataKey="confirmed" fill="#1D9E75" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Food breakdown */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
              <div className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:4 }}>🥗</div>
                <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, color:'#0F6E56' }}>{veg}</div>
                <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Vegetarian</div>
              </div>
              <div className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:4 }}>🍗</div>
                <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, color:'#854F0B' }}>{nonVeg}</div>
                <div style={{ fontSize:12, color:'var(--text-secondary)' }}>Non-Vegetarian</div>
              </div>
            </div>

            {/* Payment status — hidden from bus coord */}
            {!isBusCoord && (
              <div className="card" style={{ marginBottom:12 }}>
                <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:10 }}>Payment Status</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div style={{ background:'#EAF3DE', borderRadius:10, padding:'12px', textAlign:'center' }}>
                    <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:24, color:'#27500A' }}>{paidCount}</div>
                    <div style={{ fontSize:12, color:'#27500A' }}>✅ Verified</div>
                  </div>
                  <div style={{ background:'#FAEEDA', borderRadius:10, padding:'12px', textAlign:'center' }}>
                    <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:24, color:'#854F0B' }}>{pendingCount}</div>
                    <div style={{ fontSize:12, color:'#854F0B' }}>⏳ Pending</div>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback summary — only for adviser & HOD after stage 5 */}
            {!isBusCoord && feedback.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>⭐ Feedback Summary</h3>
                {[
                  ['Overall Trip', 'overall_rating'],
                  ['Industry Visit', 'industry_rating'],
                  ['Food & Travel', 'food_rating'],
                  ['Travel', 'travel_rating'],
                ].map(([label, key]) => (
                  <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                    <span style={{ color:'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:16 }}>{'⭐'.repeat(Math.round(parseFloat(avgRating(key)) || 0))} {avgRating(key)} / 5</span>
                  </div>
                ))}
                <div style={{ marginTop:10, fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>Based on {feedback.length} responses</div>
              </div>
            )}
          </div>
        )}

        {/* STUDENTS TAB */}
        {tab === 'students' && (
          <div className="animate-fade-up">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, margin:0 }}>
                {isAdviser ? `Section ${staff.assigned_section} Students` : `Bus ${staff.assigned_bus} Students`}
              </h2>
              <button className="btn btn-success" onClick={exportMyStudents}><i className="ti ti-download" /> Export</button>
            </div>
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'var(--surface)' }}>
                      {['Reg No.','Section','Attendance','Food','Emergency Contact',...(!isBusCoord ? ['Payment'] : [])].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:600, color:'var(--text-secondary)', fontSize:12, borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r, i) => (
                      <tr key={r.id} style={{ background: i%2===0 ? 'white' : 'var(--surface)' }}>
                        <td style={{ padding:'9px 12px', fontWeight:500 }}>{r.register_number}</td>
                        <td style={{ padding:'9px 12px' }}><span className={`stage-pill sec-${r.section?.toLowerCase()}`} style={{ fontSize:11 }}>{r.section}</span></td>
                        <td style={{ padding:'9px 12px' }}>{r.attendance === 'coming' ? '✅ Coming' : r.attendance === 'not_coming' ? '❌ Not coming' : '🤔 Maybe'}</td>
                        <td style={{ padding:'9px 12px' }}>{r.food_preference === 'veg' ? '🥗 Veg' : '🍗 Non-veg'}</td>
                        <td style={{ padding:'9px 12px', color:'var(--text-secondary)' }}>{r.emergency_contact}</td>
                        {!isBusCoord && (
                          <td style={{ padding:'9px 12px' }}>
                            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99, fontWeight:600, background: r.payment_status==='verified' ? '#EAF3DE' : '#FAEEDA', color: r.payment_status==='verified' ? '#27500A' : '#854F0B' }}>
                              {r.payment_status === 'verified' ? '✅ Paid' : '⏳ Pending'}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {registrations.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:24 }}>No registrations yet for your {isAdviser ? 'section' : 'bus'}.</p>}
              </div>
            </div>
          </div>
        )}

        {/* LIVE LOCATION TAB */}
        {tab === 'live' && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:14 }}>
              📍 Live Locations — {isAdviser ? `Section ${staff.assigned_section}` : `Bus ${staff.assigned_bus}`}
            </h2>

            {/* Summary counts */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
              {[
                { label:'Sharing Location', val:locations.filter(l => l.is_sharing && !l.sos_active).length, color:'#27500A', bg:'#EAF3DE' },
                { label:'Location Off', val:confirmed.length - locations.length, color:'#854F0B', bg:'#FAEEDA' },
                { label:'SOS Active', val:sosStudents.length, color:'#791F1F', bg:'#FCEBEB' },
              ].map(s => (
                <div key={s.label} className="card" style={{ textAlign:'center', borderTop:`3px solid ${s.color}` }}>
                  <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="card" style={{ marginBottom:14 }}>
              <div style={{ background:'#f0f4f8', borderRadius:10, height:300, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10, border:'2px dashed var(--border)' }}>
                <i className="ti ti-map" style={{ fontSize:40, color:'var(--text-muted)' }} />
                <div style={{ fontSize:14, fontWeight:500, color:'var(--text-secondary)' }}>Live Map</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{locations.length} student{locations.length !== 1 ? 's' : ''} sharing location</div>
              </div>
            </div>

            {/* SOS students list */}
            {sosStudents.length > 0 && (
              <div className="card" style={{ marginBottom:14, border:'2px solid #EF4444' }}>
                <h3 style={{ fontFamily:'Syne', fontWeight:800, fontSize:14, color:'#EF4444', marginBottom:10 }}>🆘 SOS Alerts</h3>
                {sosStudents.map(s => (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px', background:'#FEF2F2', borderRadius:8, marginBottom:6 }}>
                    <i className="ti ti-alert-triangle" style={{ color:'#EF4444', fontSize:18 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:14 }}>{s.register_number}</div>
                      <div style={{ fontSize:12, color:'#DC2626' }}>Section {s.section} · Last seen {new Date(s.updated_at).toLocaleTimeString()}</div>
                      {s.latitude && <div style={{ fontSize:12, color:'#DC2626' }}>📍 {s.latitude.toFixed(5)}, {s.longitude.toFixed(5)}</div>}
                    </div>
                    <a href={`https://maps.google.com/?q=${s.latitude},${s.longitude}`} target="_blank" rel="noreferrer"
                      style={{ background:'#EF4444', color:'white', padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600, textDecoration:'none' }}>
                      Open Maps
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* Location list */}
            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:10 }}>Students Sharing Location</h3>
              {locations.filter(l => !l.sos_active).map(l => (
                <div key={l.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', display:'inline-block', flexShrink:0, animation:'pulse-dot 1.5s ease infinite' }} />
                  <span style={{ fontWeight:500 }}>{l.register_number}</span>
                  <span className={`stage-pill sec-${l.section?.toLowerCase()}`} style={{ fontSize:10 }}>Sec {l.section}</span>
                  <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:'auto' }}>Updated {new Date(l.updated_at).toLocaleTimeString()}</span>
                </div>
              ))}
              {locations.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:16 }}>No students sharing location yet</p>}
            </div>
          </div>
        )}

        {/* FEEDBACK TAB */}
        {tab === 'feedback' && !isBusCoord && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:14 }}>Trip Feedback</h2>
            <div className="card" style={{ marginBottom:12 }}>
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:12 }}>Average Ratings</h3>
              {[
                ['Overall Trip Experience', 'overall_rating', '🌟'],
                ['Industry Visit Quality', 'industry_rating', '🏭'],
                ['Food & Snacks', 'food_rating', '🍽️'],
                ['Travel Arrangements', 'travel_rating', '🚌'],
              ].map(([label, key, icon]) => (
                <div key={key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:20 }}>{icon}</span>
                  <span style={{ flex:1, fontSize:14, fontWeight:500 }}>{label}</span>
                  <div style={{ display:'flex', gap:2 }}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} style={{ fontSize:16, opacity: n <= Math.round(parseFloat(avgRating(key)) || 0) ? 1 : 0.2 }}>⭐</span>
                    ))}
                  </div>
                  <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:16, minWidth:30 }}>{avgRating(key)}</span>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:10 }}>Student Suggestions</h3>
              {feedback.filter(f => f.suggestions).slice(0,10).map((f, i) => (
                <div key={i} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <div style={{ color:'var(--text-secondary)', marginBottom:2 }}>{f.register_number} · Sec {f.section}</div>
                  <div>{f.suggestions}</div>
                </div>
              ))}
              {feedback.filter(f => f.suggestions).length === 0 && <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:16 }}>No suggestions yet</p>}
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {tab === 'announcements' && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:18, marginBottom:14 }}>Announcements</h2>
            <div className="card">
              {announcements.map(a => (
                <div key={a.id} style={{ padding:'12px', borderRadius:10, marginBottom:10, background: a.priority==='sos' ? '#FEF2F2' : a.priority==='urgent' ? '#FAEEDA' : 'var(--surface)', borderLeft:`3px solid ${a.priority==='sos' ? '#EF4444' : a.priority==='urgent' ? '#F59E0B' : 'var(--brand)'}` }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:11, fontWeight:600, color: a.priority==='sos' ? '#EF4444' : a.priority==='urgent' ? '#F59E0B' : 'var(--brand)', textTransform:'uppercase' }}>{a.priority}</span>
                    <span style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin:0, fontSize:14 }}>{a.message}</p>
                </div>
              ))}
              {announcements.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:20 }}>No announcements yet</p>}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
