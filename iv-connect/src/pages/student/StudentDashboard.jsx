import { useApp } from '../../context/AppContext'
import Stage1Brainstorm from './stages/Stage1Brainstorm'
import Stage2Registration from './stages/Stage2Registration'
import Stage3TripPlan from './stages/Stage3TripPlan'
import Stage4LiveHub from './stages/Stage4LiveHub'
import Stage5Feedback from './stages/Stage5Feedback'

const STAGE_LABELS = {
  1: { label: 'Brainstorm', icon: 'ti-bulb', color: '#185FA5', bg: '#E6F1FB' },
  2: { label: 'Registration', icon: 'ti-clipboard-list', color: '#0F6E56', bg: '#E1F5EE' },
  3: { label: 'Trip Plan', icon: 'ti-map', color: '#854F0B', bg: '#FAEEDA' },
  4: { label: 'Live Hub', icon: 'ti-radio', color: '#791F1F', bg: '#FCEBEB' },
  5: { label: 'Feedback', icon: 'ti-star', color: '#3C3489', bg: '#EEEDFE' },
}

export default function StudentDashboard() {
  const { activeStage, student, studentLogout } = useApp()
  const stage = STAGE_LABELS[activeStage]

  return (
    <div className="min-h-screen" style={{ background:'var(--surface)' }}>
      {/* Top nav */}
      <nav style={{ background:'white', borderBottom:'1px solid var(--border)', padding:'0 1rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className="ti ti-map-pin" style={{ color:'white', fontSize:16 }} />
          </div>
          <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, color:'var(--brand)' }}>IV Connect</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Stage pill */}
          <span className="stage-pill" style={{ background: stage.bg, color: stage.color }}>
            <i className={`ti ${stage.icon}`} style={{ fontSize:12 }} />
            Stage {activeStage} — {stage.label}
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{student?.full_name}</div>
            <div style={{ fontSize:11, color:'var(--text-secondary)' }}>{student?.register_number} · Sec {student?.section}</div>
          </div>
          <button onClick={studentLogout} style={{ width:32, height:32, borderRadius:8, background:'#FEF2F2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <i className="ti ti-logout" style={{ color:'#EF4444', fontSize:15 }} />
          </button>
        </div>
      </nav>

      {/* Stage content */}
      <main style={{ maxWidth:720, margin:'0 auto', padding:'1.5rem 1rem' }}>
        {activeStage === 1 && <Stage1Brainstorm />}
        {activeStage === 2 && <Stage2Registration />}
        {activeStage === 3 && <Stage3TripPlan />}
        {activeStage === 4 && <Stage4LiveHub />}
        {activeStage === 5 && <Stage5Feedback />}
      </main>
    </div>
  )
}
