// Stage4LiveHub.jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useApp } from '../../../context/AppContext'

export function Stage4LiveHub() {
  const { student } = useApp()
  const [announcements, setAnnouncements] = useState([])
  const [isSharing, setIsSharing] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const [photos, setPhotos] = useState([])
  const watchRef = useRef(null)

  useEffect(() => {
    fetchAnnouncements()
    fetchPhotos()

    const channel = supabase.channel('announcements_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, (payload) => {
        setAnnouncements(prev => [payload.new, ...prev])
      }).subscribe()

    return () => { supabase.removeChannel(channel); stopLocation() }
  }, [])

  async function fetchAnnouncements() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(20)
    if (data) setAnnouncements(data)
  }

  async function fetchPhotos() {
    const { data } = await supabase.from('trip_photos').select('*').order('uploaded_at', { ascending: false }).limit(20)
    if (data) setPhotos(data)
  }

  function startLocation() {
    if (!navigator.geolocation) return
    setIsSharing(true)
    watchRef.current = navigator.geolocation.watchPosition(async (pos) => {
      await supabase.from('live_locations').upsert({
        register_number: student.register_number,
        section: student.section,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        is_sharing: true,
        sos_active: false,
        updated_at: new Date().toISOString(),
      })
    }, null, { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 })
  }

  function stopLocation() {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    setIsSharing(false)
    supabase.from('live_locations').upsert({ register_number: student.register_number, section: student.section, is_sharing: false })
  }

  async function triggerSOS() {
    if (!window.confirm('Send SOS alert to coordinators?')) return
    setSosActive(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await supabase.from('live_locations').upsert({
        register_number: student.register_number, section: student.section,
        latitude: pos.coords.latitude, longitude: pos.coords.longitude,
        is_sharing: true, sos_active: true, updated_at: new Date().toISOString(),
      })
      await supabase.from('announcements').insert({
        message: `🆘 SOS from ${student.full_name} (${student.register_number}, Sec ${student.section})`,
        priority: 'sos', created_by: student.register_number,
      })
    })
  }

  async function uploadPhoto(file) {
    const path = `trip_photos/${student.register_number}_${Date.now()}.jpg`
    const { data } = await supabase.storage.from('iv-connect').upload(path, file)
    if (data) {
      const { data: url } = supabase.storage.from('iv-connect').getPublicUrl(path)
      await supabase.from('trip_photos').insert({ register_number: student.register_number, section: student.section, photo_url: url.publicUrl })
      fetchPhotos()
    }
  }

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'#FCEBEB', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <i className="ti ti-radio" style={{ color:'#791F1F', fontSize:20 }} />
        </div>
        <div>
          <h1 style={{ fontFamily:'Syne', fontSize:22, fontWeight:800, margin:0 }}>Live Trip Hub</h1>
          <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>Stay connected during the trip</p>
        </div>
      </div>

      {/* SOS Button */}
      <button onClick={triggerSOS} disabled={sosActive}
        style={{ width:'100%', padding:'14px', borderRadius:12, background: sosActive ? '#FEF2F2' : '#EF4444', color: sosActive ? '#EF4444' : 'white', border: sosActive ? '2px solid #EF4444' : 'none', fontSize:16, fontFamily:'Syne', fontWeight:800, cursor: sosActive ? 'not-allowed' : 'pointer', marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <i className="ti ti-alert-triangle" />
        {sosActive ? 'SOS Alert Sent — Help is on the way' : '🆘 EMERGENCY — Send SOS'}
      </button>

      {/* Location sharing */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:14 }}>Share My Location</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>Lets coordinators see where you are</div>
          </div>
          <button onClick={isSharing ? stopLocation : startLocation}
            className={isSharing ? 'btn btn-danger' : 'btn btn-success'} style={{ flexShrink:0 }}>
            <i className={`ti ${isSharing ? 'ti-map-pin-off' : 'ti-map-pin'}`} />
            {isSharing ? 'Stop Sharing' : 'Share Location'}
          </button>
        </div>
        {isSharing && <div style={{ marginTop:10, padding:'8px 12px', background:'#EAF3DE', borderRadius:8, fontSize:12, color:'#27500A', display:'flex', alignItems:'center', gap:6 }}><span style={{ width:8, height:8, borderRadius:'50%', background:'#22C55E', display:'inline-block', animation:'pulse-dot 1.5s ease infinite' }} /> Location is being shared with coordinators</div>}
      </div>

      {/* Announcements */}
      <div className="card" style={{ marginBottom:16 }}>
        <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:12 }}>📢 Announcements</h3>
        {announcements.length === 0 ? <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:20 }}>No announcements yet</p> :
          announcements.map(a => (
            <div key={a.id} style={{ padding:'10px 12px', borderRadius:10, background: a.priority === 'sos' ? '#FEF2F2' : a.priority === 'urgent' ? '#FAEEDA' : 'var(--surface)', marginBottom:8, borderLeft:`3px solid ${a.priority === 'sos' ? '#EF4444' : a.priority === 'urgent' ? '#F59E0B' : 'var(--brand)'}` }}>
              <p style={{ margin:0, fontSize:14 }}>{a.message}</p>
              <span style={{ fontSize:11, color:'var(--text-muted)', marginTop:4, display:'block' }}>{new Date(a.created_at).toLocaleTimeString()}</span>
            </div>
          ))
        }
      </div>

      {/* Photo drop */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, margin:0 }}>📸 Photo Drop</h3>
          <label style={{ cursor:'pointer' }}>
            <span className="btn btn-secondary" style={{ padding:'6px 12px', fontSize:12 }}><i className="ti ti-upload" /> Upload</span>
            <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0])} />
          </label>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
          {photos.map(p => <img key={p.id} src={p.photo_url} alt="" style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:8 }} />)}
        </div>
        {photos.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:20 }}>No photos yet — be the first to upload!</p>}
      </div>
    </div>
  )
}

export default Stage4LiveHub

// ─── Stage 5 Feedback ─────────────────────────────────────────────────────────
export function Stage5Feedback() {
  const { student } = useApp()
  const [ratings, setRatings] = useState({ overall_rating:0, industry_rating:0, food_rating:0, travel_rating:0, organizer_rating:0 })
  const [form, setForm] = useState({ best_moment:'', suggestions:'', would_recommend: null })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.from('stage5_feedback').select('*').eq('register_number', student.register_number).single()
      .then(({ data }) => { if (data) setSubmitted(true); setChecking(false) })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (Object.values(ratings).some(r => r === 0)) return
    setLoading(true)
    await supabase.from('stage5_feedback').upsert({ register_number: student.register_number, section: student.section, ...ratings, ...form })
    setSubmitted(true); setLoading(false)
  }

  const FIELDS = [
    { key:'overall_rating', label:'Overall Trip Experience', icon:'🌟' },
    { key:'industry_rating', label:'Industry Visit Quality', icon:'🏭' },
    { key:'food_rating', label:'Food & Snacks', icon:'🍽️' },
    { key:'travel_rating', label:'Travel & Arrangements', icon:'🚌' },
    { key:'organizer_rating', label:'Organizer Performance', icon:'👨‍💼' },
  ]

  if (checking) return <div style={{ textAlign:'center', padding:40 }}><i className="ti ti-loader-2" style={{ fontSize:24, animation:'spin 1s linear infinite' }} /></div>
  if (submitted) return (
    <div className="card animate-fade-up" style={{ textAlign:'center', padding:'2rem' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>🙏</div>
      <h2 style={{ fontFamily:'Syne', fontWeight:800 }}>Thank you for your feedback!</h2>
      <p style={{ color:'var(--text-secondary)', fontSize:14 }}>Your responses help us plan better trips in the future.</p>
    </div>
  )

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom:24, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <i className="ti ti-star" style={{ color:'#3C3489', fontSize:20 }} />
        </div>
        <div>
          <h1 style={{ fontFamily:'Syne', fontSize:22, fontWeight:800, margin:0 }}>Trip Feedback</h1>
          <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>Share your experience of the IV</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom:16 }}>
          {FIELDS.map(f => (
            <div key={f.key} style={{ padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span>{f.icon}</span>
                <span style={{ fontSize:14, fontWeight:500 }}>{f.label}</span>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {[1,2,3,4,5].map(n => (
                  <button type="button" key={n} onClick={() => setRatings(r => ({ ...r, [f.key]: n }))}
                    style={{ fontSize:24, background:'none', border:'none', cursor:'pointer', opacity: ratings[f.key] >= n ? 1 : 0.3, transition:'opacity .15s' }}>⭐</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom:16 }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:6 }}>Best moment of the trip?</label>
            <textarea className="input" rows={3} placeholder="Tell us your favourite memory..." value={form.best_moment} onChange={e => setForm(f => ({ ...f, best_moment: e.target.value }))} style={{ resize:'vertical' }} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:6 }}>Suggestions for the next IV?</label>
            <textarea className="input" rows={3} placeholder="What could be improved?" value={form.suggestions} onChange={e => setForm(f => ({ ...f, suggestions: e.target.value }))} style={{ resize:'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:500, display:'block', marginBottom:8 }}>Would you recommend this IV to juniors?</label>
            <div style={{ display:'flex', gap:10 }}>
              {[{v:true, label:'Yes! Definitely', icon:'👍'}, {v:false, label:'Needs improvement', icon:'👎'}].map(o => (
                <button type="button" key={String(o.v)} onClick={() => setForm(f => ({ ...f, would_recommend: o.v }))}
                  style={{ flex:1, padding:'10px', borderRadius:10, border:`2px solid ${form.would_recommend === o.v ? 'var(--brand)' : 'var(--border)'}`, background: form.would_recommend === o.v ? 'var(--brand-light)' : 'white', cursor:'pointer', fontSize:13, fontWeight:500 }}>
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:14 }} type="submit" disabled={loading}>
          {loading ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Submitting...</> : <><i className="ti ti-send" /> Submit Feedback</>}
        </button>
      </form>
    </div>
  )
}
