import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useApp } from '../../../context/AppContext'

const TSHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const ADDONS = [
  { id: 'photo_album', label: 'Trip Photo Album', desc: 'Digital photo + video reel of the entire trip', price: 60, icon: '📸', optional: true },
  { id: 'id_lanyard', label: 'Custom ID Lanyard', desc: 'Printed with your name + college logo', price: 40, icon: '🪪', optional: true },
  { id: 'kerala_souvenir', label: 'Kerala Souvenir Pack', desc: 'Banana chips, spices & local snacks combo', price: 120, icon: '🎁', optional: true },
]

export default function Stage2Registration() {
  const { student } = useApp()
  const [form, setForm] = useState({
    attendance: '', food_preference: '', emergency_contact: '',
    tshirt_size: '', snack_bag: true,
    photo_album: false, id_lanyard: false, kerala_souvenir: false,
    payment_mode: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [upiQR, setUpiQR] = useState('')
  const [tripFee, setTripFee] = useState(1200)
  const [paymentProof, setPaymentProof] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { checkExisting(); fetchConfig() }, [])

  async function fetchConfig() {
    const { data } = await supabase.from('app_config').select('key,value').in('key', ['upi_qr_url', 'trip_fee'])
    if (data) {
      const qr = data.find(d => d.key === 'upi_qr_url')
      const fee = data.find(d => d.key === 'trip_fee')
      if (qr) setUpiQR(qr.value)
      if (fee) setTripFee(parseInt(fee.value))
    }
  }

  async function checkExisting() {
    const { data } = await supabase.from('stage2_registrations').select('*').eq('register_number', student.register_number).single()
    if (data) { setSubmitted(true); setForm(data) }
    setChecking(false)
  }

  function calcTotal() {
    if (form.attendance !== 'coming') return 0
    let total = tripFee
    if (form.photo_album) total += 60
    if (form.id_lanyard) total += 40
    if (form.kerala_souvenir) total += 120
    return total
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.attendance) { setError('Please confirm your attendance.'); return }
    if (form.attendance === 'coming' && !form.tshirt_size) { setError('Please select your T-shirt size.'); return }
    if (form.attendance === 'coming' && !form.food_preference) { setError('Please select your food preference.'); return }
    if (!form.emergency_contact) { setError('Please provide an emergency contact number.'); return }
    if (form.attendance === 'coming' && !form.payment_mode) { setError('Please select a payment method.'); return }

    setLoading(true); setError('')

    let payment_proof_url = null
    if (form.payment_mode === 'upi' && paymentProof) {
      setUploading(true)
      const ext = paymentProof.name.split('.').pop()
      const path = `payment_proofs/${student.register_number}_${Date.now()}.${ext}`
      const { data: upData } = await supabase.storage.from('iv-connect').upload(path, paymentProof)
      if (upData) {
        const { data: urlData } = supabase.storage.from('iv-connect').getPublicUrl(path)
        payment_proof_url = urlData.publicUrl
      }
      setUploading(false)
    }

    const { error: err } = await supabase.from('stage2_registrations').upsert({
      register_number: student.register_number,
      section: student.section,
      attendance: form.attendance,
      food_preference: form.food_preference || 'veg',
      emergency_contact: form.emergency_contact,
      tshirt_size: form.tshirt_size || 'M',
      snack_bag: form.snack_bag,
      photo_album: form.photo_album,
      id_lanyard: form.id_lanyard,
      kerala_souvenir: form.kerala_souvenir,
      payment_mode: form.payment_mode,
      payment_status: 'pending',
      payment_proof_url,
      total_amount: calcTotal(),
    })

    if (err) { setError('Submission failed. Please try again.'); setLoading(false); return }
    setSubmitted(true); setLoading(false)
  }

  if (checking) return <div style={{ textAlign:'center', padding:40, color:'var(--text-secondary)' }}><i className="ti ti-loader-2" style={{ fontSize:24, animation:'spin 1s linear infinite' }} /></div>

  if (submitted) return (
    <div className="animate-fade-up">
      <div className="card" style={{ textAlign:'center', padding:'2rem', marginBottom:16 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
        <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, marginBottom:8 }}>Registration Complete!</h2>
        <p style={{ color:'var(--text-secondary)', fontSize:14 }}>Your registration has been submitted successfully.</p>
      </div>
      <div className="card">
        <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:14 }}>Your Summary</h3>
        {[
          ['Name', student.full_name],
          ['Register No.', student.register_number],
          ['Section', `Section ${student.section}`],
          ['Attendance', form.attendance === 'coming' ? '✅ Coming' : form.attendance === 'not_coming' ? '❌ Not Coming' : '🤔 Maybe'],
          ['T-Shirt Size', form.tshirt_size || '—'],
          ['Food', form.food_preference === 'veg' ? '🥗 Veg' : '🍗 Non-Veg'],
          ['Payment', form.payment_mode === 'upi' ? '📱 UPI' : '💵 Cash'],
          ['Total Amount', `₹${calcTotal()}`],
          ['Payment Status', form.payment_status === 'verified' ? '✅ Verified' : '⏳ Pending verification'],
        ].map(([k, v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
            <span style={{ color:'var(--text-secondary)' }}>{k}</span>
            <span style={{ fontWeight:500 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'#E1F5EE', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-clipboard-list" style={{ color:'#0F6E56', fontSize:20 }} />
          </div>
          <div>
            <h1 style={{ fontFamily:'Syne', fontSize:22, fontWeight:800, color:'var(--text-primary)', margin:0 }}>Registration</h1>
            <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>Confirm your details and pre-order add-ons</p>
          </div>
        </div>
      </div>

      {/* Auto-filled info */}
      <div className="card animate-fade-up-2" style={{ marginBottom:16, background:'var(--brand)', color:'white' }}>
        <div style={{ fontSize:12, opacity:0.7, marginBottom:8, fontWeight:500 }}>YOUR DETAILS (AUTO-FILLED)</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {[['Name', student.full_name], ['Register No.', student.register_number], ['Section', `Section ${student.section}`], ['Enrollment No.', student.enrollment_number || '—']].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize:11, opacity:0.6 }}>{k}</div>
              <div style={{ fontSize:14, fontWeight:600 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Attendance */}
        <div className="card animate-fade-up-2" style={{ marginBottom:16 }}>
          <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:14 }}>Are you coming? *</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[{ id:'coming', label:'Yes, Coming!', icon:'✅' }, { id:'not_coming', label:'Not Coming', icon:'❌' }, { id:'maybe', label:'Maybe', icon:'🤔' }].map(o => (
              <button type="button" key={o.id} onClick={() => setForm(f => ({ ...f, attendance: o.id }))}
                style={{ padding:'12px 8px', borderRadius:10, border:`2px solid ${form.attendance === o.id ? 'var(--brand)' : 'var(--border)'}`, background: form.attendance === o.id ? 'var(--brand-light)' : 'white', cursor:'pointer', textAlign:'center', transition:'all .18s' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{o.icon}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)' }}>{o.label}</div>
              </button>
            ))}
          </div>
        </div>

        {form.attendance === 'coming' && (<>
          {/* T-shirt size */}
          <div className="card animate-fade-up-3" style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:4 }}>T-Shirt Size *</h3>
            <p style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:14 }}>Included in your trip package</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {TSHIRT_SIZES.map(s => (
                <button type="button" key={s} onClick={() => setForm(f => ({ ...f, tshirt_size: s }))}
                  style={{ width:52, height:52, borderRadius:10, border:`2px solid ${form.tshirt_size === s ? 'var(--brand)' : 'var(--border)'}`, background: form.tshirt_size === s ? 'var(--brand)' : 'white', cursor:'pointer', fontFamily:'Syne', fontWeight:700, fontSize:14, color: form.tshirt_size === s ? 'white' : 'var(--text-primary)', transition:'all .18s' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Food preference */}
          <div className="card animate-fade-up-3" style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:14 }}>Food Preference *</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[{ id:'veg', label:'Vegetarian', icon:'🥗', color:'#0F6E56', bg:'#E1F5EE' }, { id:'non_veg', label:'Non-Vegetarian', icon:'🍗', color:'#854F0B', bg:'#FAEEDA' }].map(o => (
                <button type="button" key={o.id} onClick={() => setForm(f => ({ ...f, food_preference: o.id }))}
                  style={{ padding:'14px', borderRadius:12, border:`2px solid ${form.food_preference === o.id ? o.color : 'var(--border)'}`, background: form.food_preference === o.id ? o.bg : 'white', cursor:'pointer', display:'flex', alignItems:'center', gap:10, transition:'all .18s' }}>
                  <span style={{ fontSize:24 }}>{o.icon}</span>
                  <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:14 }}>{o.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="card animate-fade-up-3" style={{ marginBottom:16 }}>
            <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:4 }}>Add-ons (Optional)</h3>
            <p style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:14 }}>Add to your trip package — pay along with trip fee</p>

            {/* Mandatory items */}
            <div style={{ background:'var(--surface)', borderRadius:10, padding:'10px 14px', marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>Included in package</div>
              {[{ icon:'🎽', label:'Group T-Shirt', note:'Size selected above' }, { icon:'🍿', label:'Snack & Drinks Combo Bag', note:'Veg/non-veg variant' }].map(i => (
                <div key={i.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', fontSize:13 }}>
                  <span style={{ fontSize:18 }}>{i.icon}</span>
                  <span style={{ fontWeight:500 }}>{i.label}</span>
                  <span style={{ fontSize:11, color:'var(--text-secondary)', marginLeft:'auto' }}>{i.note}</span>
                  <span style={{ fontSize:11, background:'#EAF3DE', color:'#27500A', padding:'2px 7px', borderRadius:99, fontWeight:600 }}>Included</span>
                </div>
              ))}
            </div>

            {ADDONS.map(a => (
              <div key={a.id} onClick={() => setForm(f => ({ ...f, [a.id]: !f[a.id] }))}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:10, border:`1.5px solid ${form[a.id] ? 'var(--brand)' : 'var(--border)'}`, background: form[a.id] ? 'var(--brand-light)' : 'white', cursor:'pointer', marginBottom:8, transition:'all .18s' }}>
                <span style={{ fontSize:22 }}>{a.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{a.label}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{a.desc}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, color:'var(--brand)' }}>+₹{a.price}</div>
                  <div style={{ width:20, height:20, borderRadius:6, border:`2px solid ${form[a.id] ? 'var(--brand)' : 'var(--border)'}`, background: form[a.id] ? 'var(--brand)' : 'white', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:'auto', marginTop:4 }}>
                    {form[a.id] && <i className="ti ti-check" style={{ color:'white', fontSize:12 }} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment */}
          <div className="card animate-fade-up-4" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, margin:0 }}>Payment *</h3>
              <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, color:'var(--brand)' }}>₹{calcTotal()}</div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[{ id:'upi', label:'Pay via UPI', icon:'📱', sub:'Scan QR & upload proof' }, { id:'cash', label:'Pay Cash', icon:'💵', sub:'Pay coordinator in person' }].map(o => (
                <button type="button" key={o.id} onClick={() => setForm(f => ({ ...f, payment_mode: o.id }))}
                  style={{ padding:'14px 12px', borderRadius:12, border:`2px solid ${form.payment_mode === o.id ? 'var(--brand)' : 'var(--border)'}`, background: form.payment_mode === o.id ? 'var(--brand-light)' : 'white', cursor:'pointer', textAlign:'left', transition:'all .18s' }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{o.icon}</div>
                  <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:13 }}>{o.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{o.sub}</div>
                </button>
              ))}
            </div>

            {form.payment_mode === 'upi' && (
              <div style={{ textAlign:'center', padding:'1rem', background:'var(--surface)', borderRadius:10 }}>
                {upiQR ? <img src={upiQR} alt="UPI QR Code" style={{ width:160, height:160, borderRadius:8 }} /> : <div style={{ width:160, height:160, background:'var(--border)', borderRadius:8, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:13 }}>QR Code<br/>will appear here</div>}
                <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:10 }}>Scan & pay ₹{calcTotal()}, then upload screenshot below</p>
                <label style={{ display:'block', marginTop:8 }}>
                  <div className="btn btn-secondary" style={{ justifyContent:'center', width:'100%', cursor:'pointer' }}>
                    <i className="ti ti-upload" />{paymentProof ? paymentProof.name : 'Upload Payment Screenshot'}
                  </div>
                  <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => setPaymentProof(e.target.files[0])} />
                </label>
              </div>
            )}

            {form.payment_mode === 'cash' && (
              <div style={{ background:'#FAEEDA', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#633806' }}>
                <i className="ti ti-info-circle" /> Pay ₹{calcTotal()} in cash to your class coordinator. Your status will be updated once collected.
              </div>
            )}
          </div>
        </>)}

        {/* Emergency contact */}
        <div className="card animate-fade-up-4" style={{ marginBottom:16 }}>
          <h3 style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, marginBottom:8 }}>Emergency Contact *</h3>
          <p style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:10 }}>Parent or guardian phone number</p>
          <input className="input" type="tel" placeholder="e.g. 9876543210" value={form.emergency_contact} onChange={e => setForm(f => ({ ...f, emergency_contact: e.target.value }))} />
        </div>

        {error && <div style={{ background:'#FEF2F2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:13, color:'#DC2626', display:'flex', alignItems:'center', gap:8 }}><i className="ti ti-alert-circle" />{error}</div>}

        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:14 }} type="submit" disabled={loading || uploading}>
          {loading || uploading ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} />{uploading ? 'Uploading proof...' : 'Submitting...'}</> : <><i className="ti ti-check" /> Complete Registration</>}
        </button>
      </form>
    </div>
  )
}
