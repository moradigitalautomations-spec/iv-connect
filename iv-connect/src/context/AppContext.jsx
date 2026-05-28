import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [activeStage, setActiveStage] = useState(1)
  const [student, setStudent] = useState(null)       // logged-in student
  const [admin, setAdmin] = useState(null)           // logged-in admin
  const [staff, setStaff] = useState(null)           // logged-in staff
  const [loading, setLoading] = useState(true)
  const [stageLoading, setStageLoading] = useState(false)

  // Load active stage from Supabase on mount + subscribe to changes
  useEffect(() => {
    fetchActiveStage()

    const channel = supabase
      .channel('app_config_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_config',
        filter: "key=eq.active_stage"
      }, (payload) => {
        setActiveStage(parseInt(payload.new.value))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // Restore sessions from localStorage on mount
  useEffect(() => {
    const savedStudent = localStorage.getItem('iv_student')
    const savedAdmin   = localStorage.getItem('iv_admin')
    const savedStaff   = localStorage.getItem('iv_staff')
    if (savedStudent) setStudent(JSON.parse(savedStudent))
    if (savedAdmin)   setAdmin(JSON.parse(savedAdmin))
    if (savedStaff)   setStaff(JSON.parse(savedStaff))
    setLoading(false)
  }, [])

  async function fetchActiveStage() {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'active_stage')
      .single()
    if (data) setActiveStage(parseInt(data.value))
  }

  // ── STUDENT AUTH ──────────────────────────────
  async function studentLogin(registerNumber, dateOfBirth) {
    const { data, error } = await supabase
      .from('students_master')
      .select('*')
      .eq('register_number', registerNumber.toUpperCase().trim())
      .eq('date_of_birth', dateOfBirth)
      .single()

    if (error || !data) {
      return { success: false, error: 'Invalid Register Number or Date of Birth. Please check and try again.' }
    }

    const studentData = {
      register_number: data.register_number,
      full_name: data.full_name,
      section: data.section,
      enrollment_number: data.enrollment_number,
      bus_number: data.bus_number,
      room_number: data.room_number,
    }

    setStudent(studentData)
    localStorage.setItem('iv_student', JSON.stringify(studentData))
    return { success: true, data: studentData }
  }

  function studentLogout() {
    setStudent(null)
    localStorage.removeItem('iv_student')
  }

  // ── ADMIN AUTH ────────────────────────────────
  async function adminLogin(username, password) {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', `admin_${username}`)
      .single()

    if (error || !data || data.value !== password) {
      return { success: false, error: 'Invalid admin credentials.' }
    }

    const adminData = { username, role: 'admin' }
    setAdmin(adminData)
    localStorage.setItem('iv_admin', JSON.stringify(adminData))
    return { success: true }
  }

  function adminLogout() {
    setAdmin(null)
    localStorage.removeItem('iv_admin')
  }

  // ── STAFF AUTH ────────────────────────────────
  async function staffLogin(email, password) {
    const { data, error } = await supabase
      .from('staff_accounts')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !data) {
      return { success: false, error: 'Staff account not found.' }
    }

    // Simple password check (in production use proper hashing)
    if (data.password_hash !== password) {
      return { success: false, error: 'Incorrect password.' }
    }

    const staffData = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      assigned_section: data.assigned_section,
      assigned_bus: data.assigned_bus,
    }

    setStaff(staffData)
    localStorage.setItem('iv_staff', JSON.stringify(staffData))
    return { success: true, data: staffData }
  }

  function staffLogout() {
    setStaff(null)
    localStorage.removeItem('iv_staff')
  }

  // ── ADMIN: SWITCH STAGE ───────────────────────
  async function switchStage(newStage) {
    setStageLoading(true)
    const { error } = await supabase
      .from('app_config')
      .update({ value: String(newStage), updated_at: new Date().toISOString() })
      .eq('key', 'active_stage')

    setStageLoading(false)
    if (!error) setActiveStage(newStage)
    return !error
  }

  return (
    <AppContext.Provider value={{
      activeStage, setActiveStage,
      student, studentLogin, studentLogout,
      admin, adminLogin, adminLogout,
      staff, staffLogin, staffLogout,
      switchStage, stageLoading,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
