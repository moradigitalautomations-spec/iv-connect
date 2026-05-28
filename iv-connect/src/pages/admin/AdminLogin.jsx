import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function AdminLogin() {
  const { adminLogin } = useApp()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const result = await adminLogin(form.username, form.password)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'linear-gradient(135deg, #0a132b 0%, #1a3263 100%)' }}>
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <div style={{ display:'inline-flex', width:56, height:56, borderRadius:14, background:'rgba(255,255,255,0.1)', alignItems:'center', justifyContent:'center', marginBottom:16, border:'1px solid rgba(255,255,255,0.15)' }}>
            <i className="ti ti-shield-lock" style={{ fontSize:26, color:'white' }} />
          </div>
          <h1 style={{ fontFamily:'Syne', fontSize:24, fontWeight:800, color:'white', margin:0 }}>Admin Portal</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, marginTop:4 }}>IV Connect — Organizer Access</p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.95)', borderRadius:18, padding:'1.75rem', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Username</label>
              <input className="input" placeholder="Admin username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            {error && <div style={{ background:'#FEF2F2', border:'1px solid #fecaca', borderRadius:8, padding:'9px 12px', marginBottom:14, fontSize:13, color:'#DC2626', display:'flex', alignItems:'center', gap:8 }}><i className="ti ti-alert-circle" />{error}</div>}
            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:12 }} type="submit" disabled={loading}>
              {loading ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Logging in...</> : <><i className="ti ti-login" /> Login as Admin</>}
            </button>
          </form>
        </div>
        <div style={{ textAlign:'center', marginTop:16 }}>
          <a href="/staff/login" style={{ fontSize:12, color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>Staff Login →</a>
        </div>
      </div>
    </div>
  )
}
