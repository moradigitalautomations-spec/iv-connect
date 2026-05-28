import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'

// Student pages
import StudentLogin from './pages/student/StudentLogin'
import StudentDashboard from './pages/student/StudentDashboard'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'

// Staff pages
import StaffLogin from './pages/staff/StaffLogin'
import StaffDashboard from './pages/staff/StaffDashboard'

// ── Route guards ───────────────────────────────────────────────
function StudentRoute({ children }) {
  const { student, loading } = useApp()
  if (loading) return <Loader />
  return student ? children : <Navigate to="/" replace />
}

function AdminRoute({ children }) {
  const { admin, loading } = useApp()
  if (loading) return <Loader />
  return admin ? children : <Navigate to="/admin/login" replace />
}

function StaffRoute({ children }) {
  const { staff, loading } = useApp()
  if (loading) return <Loader />
  return staff ? children : <Navigate to="/staff/login" replace />
}

function Loader() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, background:'var(--surface)' }}>
      <div style={{ width:48, height:48, borderRadius:12, background:'var(--brand)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <i className="ti ti-map-pin" style={{ color:'white', fontSize:22 }} />
      </div>
      <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:18, color:'var(--brand)' }}>IV Connect</div>
      <i className="ti ti-loader-2" style={{ fontSize:20, color:'var(--text-muted)', animation:'spin 1s linear infinite' }} />
    </div>
  )
}

// ── App shell ──────────────────────────────────────────────────
function AppRoutes() {
  const { student, admin, staff } = useApp()

  return (
    <Routes>
      {/* Student */}
      <Route path="/" element={student ? <Navigate to="/student" replace /> : <StudentLogin />} />
      <Route path="/student" element={<StudentRoute><StudentDashboard /></StudentRoute>} />

      {/* Admin */}
      <Route path="/admin/login" element={admin ? <Navigate to="/admin" replace /> : <AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Staff */}
      <Route path="/staff/login" element={staff ? <Navigate to="/staff" replace /> : <StaffLogin />} />
      <Route path="/staff" element={<StaffRoute><StaffDashboard /></StaffRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
