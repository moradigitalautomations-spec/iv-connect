// Stage3TripPlan.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useApp } from '../../../context/AppContext'

export default function Stage3TripPlan() {
  const { student } = useApp()
  const [itinerary, setItinerary] = useState([])
  const [studentInfo, setStudentInfo] = useState(null)

  useEffect(() => {
    supabase.from('trip_itinerary').select('*').order('day_number').then(({ data }) => { if (data) setItinerary(data) })
    supabase.from('students_master').select('bus_number,room_number').eq('register_number', student.register_number).single().then(({ data }) => { if (data) setStudentInfo(data) })
  }, [])

  const days = [...new Set(itinerary.map(i => i.day_number))].sort()

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom:24, display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:'#FAEEDA', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <i className="ti ti-map" style={{ color:'#854F0B', fontSize:20 }} />
        </div>
        <div>
          <h1 style={{ fontFamily:'Syne', fontSize:22, fontWeight:800, margin:0 }}>Trip Plan</h1>
          <p style={{ fontSize:13, color:'var(--text-secondary)', margin:0 }}>Your 3-day itinerary & allocation details</p>
        </div>
      </div>

      {/* Student allocation card */}
      <div className="card" style={{ marginBottom:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ background:'var(--brand)', borderRadius:10, padding:'12px 14px', color:'white' }}>
          <div style={{ fontSize:11, opacity:.7, marginBottom:4 }}>YOUR BUS</div>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:28 }}>Bus {studentInfo?.bus_number || '—'}</div>
        </div>
        <div style={{ background:'#E1F5EE', borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:11, color:'#085041', fontWeight:600, marginBottom:4 }}>YOUR ROOM</div>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:28, color:'#085041' }}>{studentInfo?.room_number || '—'}</div>
        </div>
      </div>

      {/* Day-wise itinerary */}
      {days.map(day => (
        <div key={day} className="card" style={{ marginBottom:12 }}>
          <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:16, marginBottom:12, color:'var(--brand)', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ background:'var(--brand)', color:'white', borderRadius:8, padding:'2px 10px', fontSize:13 }}>Day {day}</span>
          </div>
          {itinerary.filter(i => i.day_number === day).map(item => (
            <div key={item.id} style={{ display:'flex', gap:12, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--brand)', minWidth:60, flexShrink:0 }}>{item.time_slot}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:500 }}>{item.activity}</div>
                {item.location && <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}><i className="ti ti-map-pin" style={{ fontSize:11 }} /> {item.location}</div>}
                {item.notes && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{item.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}

      {itinerary.length === 0 && (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
          <i className="ti ti-calendar-off" style={{ fontSize:32, marginBottom:8, display:'block' }} />
          Itinerary will be published soon by the organizer.
        </div>
      )}
    </div>
  )
}
