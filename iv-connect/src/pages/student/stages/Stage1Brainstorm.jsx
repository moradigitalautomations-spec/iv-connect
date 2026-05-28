import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useApp } from '../../../context/AppContext'

const DESTINATIONS = [
  { id: 'kochi', label: 'Kochi, Kerala', icon: '🌴', desc: 'Infopark, CDAC, Cochin Shipyard · ~560 km · 3 days' },
  { id: 'bangalore', label: 'Bangalore, Karnataka', icon: '🏙️', desc: 'ISRO, Infosys HQ, HAL Museum · ~310 km · 3 days' },
]
const TRIP_TYPES = [
  { id: 'it_company', label: 'IT Company', icon: '💻' },
  { id: 'research_lab', label: 'Research Lab', icon: '🔬' },
  { id: 'manufacturing', label: 'Manufacturing Plant', icon: '🏭' },
  { id: 'government', label: 'Government Facility', icon: '🏛️' },
]
const BUDGETS = ['Below ₹1,000', '₹1,000 – ₹1,500', '₹1,500 – ₹2,000', 'Above ₹2,000']

export default function Stage1Brainstorm() {
  const { student } = useApp()
  const [form, setForm] = useState({ destination_vote: '', trip_type: '', duration: '3', budget_range: '', suggestion: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [votes, setVotes] = useState({ kochi: 0, bangalore: 0 })

  useEffect(() => {
    checkExisting()
    fetchVotes()
  }, [])

  async function checkExisting() {
    const { data } = await supabase.from('stage1_responses').select('*').eq('register_number', student.register_number).single()
    if (data) { setSubmitted(true); setForm(data) }
    setChecking(false)
  }

  async function fetchVotes() {
    const { data } = await supabase.from('stage1_responses').select('destination_vote')
    if (data) {
      setVotes({
        kochi: data.filter(r => r.destination_vote === 'kochi').length,
        bangalore: data.filter(r => r.destination_vote === 'bangalore').length,
      })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.destination_vote) { setError('Please vote for a destination.'); return }
    if (!form.budget_range) { setError('Please select your budget range.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.from('stage1_responses').upsert({
      register_number: student.register_number,
      section: student.section,
      ...form,
    })
    if (err) { setError('Submission failed. Please try again.'); setLoading(false); return }
    setSubmitted(true)
    fetchVotes()
    setLoading(false)
  }

  const totalVotes = votes.kochi + votes.bangalore
  const kochiPct = totalVotes ? Math.round(votes.kochi / totalVotes * 100) : 50
  const bangalorePct = totalVotes ? Math.round(votes.bangalore / totalVotes * 100) : 50

  if (checking) return <div style={{ textAlign:'center', padding:40, color:'var(--text-secondary)' }}><i className="ti ti-loader-2" style={{ fontSize:24, animation:'spin 1s linear infinite' }} /></div>

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'#E6F1FB', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-bulb" style={{ color:'#185FA5', fontSize:20 }} />
          </div>
          <div>
            <h1 style={{ fontFamily:'Syne', fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0 }}>Share Your Ideas</h1>
            <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>Help us plan the perfect Industrial Visit!</p>
          </div>
        </div>
        <div style={{ background:'#E6F1FB', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#0C447C', display:'flex', alignItems:'center', gap:8 }}>
          <i className="ti ti-info-circle" style={{ flexShrink:0 }} />
          Your responses will be shared with HOD and coordinators to make the final decision.
        </div>
      </div>

      {/* Live vote results */}
      <div className="card animate-fade-up-2" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:14 }}>Live Votes</span>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>{totalVotes} responses so far</span>
        </div>
        <div style={{ marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
            <span>🌴 Kochi, Kerala</span><span style={{ fontWeight:600 }}>{kochiPct}%</span>
          </div>
          <div style={{ height:8, background:'#f3f4f6', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${kochiPct}%`, background:'#1D9E75', borderRadius:99, transition:'width .5s' }} />
          </div>
        </div>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
            <span>🏙️ Bangalore, Karnataka</span><span style={{ fontWeight:600 }}>{bangalorePct}%</span>
          </div>
          <div style={{ height:8, background:'#f3f4f6', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${bangalorePct}%`, background:'#2E5496', borderRadius:99, transition:'width .5s' }} />
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="card animate-fade-up-3" style={{ textAlign:'center', padding:'2rem' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, marginBottom:8 }}>Response Submitted!</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom:16 }}>You voted for <strong>{form.destination_vote === 'kochi' ? '🌴 Kochi, Kerala' : '🏙️ Bangalore, Karnataka'}</strong></p>
          <div style={{ background:'var(--surface)', borderRadius:10, padding:'12px 16px', fontSize:13, color:'var(--text-secondary)' }}>
            The admin will announce the final destination once votes are collected.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Destination vote */}
          <div className="card animate-fade-up-2" style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:4 }}>Where should we go? *</h3>
            <p style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:14 }}>Vote for your preferred destination</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {DESTINATIONS.map(d => (
                <button type="button" key={d.id} onClick={() => setForm(f => ({ ...f, destination_vote: d.id }))}
                  style={{ padding:'14px 12px', borderRadius:12, border:`2px solid ${form.destination_vote === d.id ? '#2E5496' : 'var(--border)'}`, background: form.destination_vote === d.id ? '#E6F1FB' : 'white', cursor:'pointer', textAlign:'left', transition:'all .18s' }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{d.icon}</div>
                  <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:13, color:'var(--text-primary)', marginBottom:4 }}>{d.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.4 }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Trip type */}
          <div className="card animate-fade-up-3" style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:14 }}>What type of industry? (optional)</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {TRIP_TYPES.map(t => (
                <button type="button" key={t.id} onClick={() => setForm(f => ({ ...f, trip_type: f.trip_type === t.id ? '' : t.id }))}
                  style={{ padding:'10px 12px', borderRadius:10, border:`1.5px solid ${form.trip_type === t.id ? '#2E5496' : 'var(--border)'}`, background: form.trip_type === t.id ? '#E6F1FB' : 'white', cursor:'pointer', display:'flex', alignItems:'center', gap:8, transition:'all .18s' }}>
                  <span style={{ fontSize:18 }}>{t.icon}</span>
                  <span style={{ fontSize:13, fontWeight:500 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="card animate-fade-up-4" style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:14 }}>Your budget range? *</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {BUDGETS.map(b => (
                <button type="button" key={b} onClick={() => setForm(f => ({ ...f, budget_range: b }))}
                  style={{ padding:'10px 12px', borderRadius:10, border:`1.5px solid ${form.budget_range === b ? '#2E5496' : 'var(--border)'}`, background: form.budget_range === b ? '#E6F1FB' : 'white', cursor:'pointer', fontSize:13, fontWeight:500, transition:'all .18s' }}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestion */}
          <div className="card animate-fade-up-4" style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:8 }}>Any ideas or suggestions? (optional)</h3>
            <textarea className="input" rows={3} placeholder="Share any specific companies to visit, activities, or ideas for the trip..."
              value={form.suggestion} onChange={e => setForm(f => ({ ...f, suggestion: e.target.value }))}
              style={{ resize:'vertical', minHeight:80 }} />
          </div>

          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:13, color:'#DC2626', display:'flex', alignItems:'center', gap:8 }}>
              <i className="ti ti-alert-circle" />{error}
            </div>
          )}

          <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:14 }} type="submit" disabled={loading}>
            {loading ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Submitting...</> : <><i className="ti ti-send" /> Submit My Vote & Ideas</>}
          </button>
        </form>
      )}
    </div>
  )
}
