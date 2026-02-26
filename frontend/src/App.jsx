import { useState, useEffect } from 'react'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { logout } from './api/client'

// Reset CSS mínimo
const globalStyle = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; }
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
`

export default function App() {
  const [usuario, setUsuario] = useState(null)
  const [iniciando, setIniciando] = useState(true)

  // Restaura sessão se já havia access token salvo
  useEffect(() => {
    const salvo = sessionStorage.getItem('usuario')
    const access = sessionStorage.getItem('access')
    if (salvo && access) {
      try {
        setUsuario(JSON.parse(salvo))
      } catch {
        // sessão corrompida
      }
    }
    setIniciando(false)
  }, [])

  function handleLogin(dadosUsuario) {
    setUsuario(dadosUsuario)
  }

  function handleLogout() {
    logout() // invalida refresh na blacklist + limpa sessionStorage
    setUsuario(null)
  }

  if (iniciando) return null

  return (
    <>
      <style>{globalStyle}</style>
      {usuario ? (
        <Dashboard usuario={usuario} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  )
}