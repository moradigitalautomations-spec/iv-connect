import { useState } from 'react'
import { useApp } from '../../context/AppContext'

export default function StaffLogin() {
  const { staffLogin } = useApp()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const result = await staffLogin(form.email, form.password)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #085041 0%, #1D9E75 100%)' }}>
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-8">
          <div style={{ display:'inline-flex', width:56, height:56, borderRadius:14, background:'rgba(255,255,255,0.15)', alignItems:'center', justifyContent:'center', marginBottom:16, border:'1px solid rgba(255,255,255,0.2)' }}>
            <i className="ti ti-school" style={{ fontSize:26, color:'white' }} />
          </div>
          <h1 style={{ fontFamily:'Syne', fontSize:24, fontWeight:800, color:'white', margin:0 }}>Staff Portal</h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:13, marginTop:4 }}>HOD · Class Adviser · Bus Coordinator</p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.97)', borderRadius:18, padding:'1.75rem', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Email</label>
              <input className="input" type="email" placeholder="staff@college.edu" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            {error && (
              <div style={{ background:'#FEF2F2', border:'1px solid #fecaca', borderRadius:8, padding:'9px 12px', marginBottom:14, fontSize:13, color:'#DC2626', display:'flex', alignItems:'center', gap:8 }}>
                <i className="ti ti-alert-circle" />{error}
              </div>
            )}
            <button className="btn" style={{ width:'100%', justifyContent:'center', padding:12, background:'#1D9E75', color:'white' }} type="submit" disabled={loading}>
              {loading
                ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Logging in...</>
                : <><i className="ti ti-login" /> Login as Staff</>}
            </button>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:16, display:'flex', justifyContent:'center', gap:16 }}>
          <a href="/" style={{ fontSize:12, color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>Student Login</a>
          <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
          <a href="/admin/login" style={{ fontSize:12, color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>Admin Login</a>
        </div>
      </div>
    </div>
  )
}
