import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function StudentLogin() {
  const { studentLogin } = useApp()
  const [form, setForm] = useState({ register_number: '', date_of_birth: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.register_number || !form.date_of_birth) {
      setError('Please fill in both fields.')
      return
    }
    setLoading(true)
    const result = await studentLogin(form.register_number, form.date_of_birth)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a132b 0%, #1a3263 50%, #2E5496 100%)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{ position:'absolute', top:'-10%', right:'-5%', width:400, height:400, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />
        <div style={{ position:'absolute', bottom:'-15%', left:'-8%', width:500, height:500, borderRadius:'50%', background:'rgba(255,255,255,0.02)' }} />
      </div>

      <div className="w-full max-w-md animate-fade-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:64, height:64, borderRadius:16, background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', marginBottom:20, border:'1px solid rgba(255,255,255,0.15)' }}>
            <i className="ti ti-map-pin" style={{ fontSize:28, color:'white' }} />
          </div>
          <h1 style={{ fontFamily:'Syne', fontSize:28, fontWeight:800, color:'white', margin:'0 0 6px' }}>IV Connect</h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:14 }}>CCSR Manakula Vinayagar Engineering College</p>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:4 }}>Department of Computer Science & Engineering</p>
        </div>

        {/* Login card */}
        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:20, padding:'2rem', backdropFilter:'blur(20px)', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontFamily:'Syne', fontSize:20, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Student Login</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:24 }}>Enter your register number and date of birth to continue.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-secondary)', marginBottom:6 }}>Register Number</label>
              <input
                className="input"
                placeholder="e.g. 21CSE001"
                value={form.register_number}
                onChange={e => setForm(f => ({ ...f, register_number: e.target.value.toUpperCase() }))}
                style={{ textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}
              />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-secondary)', marginBottom:6 }}>Date of Birth</label>
              <input
                className="input"
                type="date"
                value={form.date_of_birth}
                onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))}
              />
            </div>

            {error && (
              <div style={{ background:'#FEF2F2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <i className="ti ti-alert-circle" style={{ color:'#EF4444', fontSize:16, flexShrink:0 }} />
                <span style={{ fontSize:13, color:'#DC2626' }}>{error}</span>
              </div>
            )}

            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'12px' }} type="submit" disabled={loading}>
              {loading ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Verifying...</> : <><i className="ti ti-login" /> Continue</>}
            </button>
          </form>

          <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)', textAlign:'center' }}>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>
              Problems logging in? Contact your class coordinator.
            </p>
          </div>
        </div>

        {/* Role switcher */}
        <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:20 }}>
          <a href="/admin/login" style={{ fontSize:12, color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>Admin Login</a>
          <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
          <a href="/staff/login" style={{ fontSize:12, color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>Staff Login</a>
        </div>
      </div>
    </div>
  )
}
