import React, { useEffect, useState } from 'react'
import { BookOpen, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { authService } from './services/authService.js'
import Dashboard from './pages/Dashboard.jsx'

function Login({ onLogin }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState('')
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { await onLogin(username, password) } catch (err) { setError(err.message) } finally { setBusy(false) } }
  return <main className="login-layout"><div className="login-art"><div className="brand-mark"><BookOpen size={24}/></div><div className="art-copy"><span className="eyebrow">SISTEM INFORMASI SEKOLAH</span><h1>Data tertata,<br/>masa depan terjaga.</h1><p>Platform Buku Induk Digital untuk mendampingi setiap perjalanan belajar siswa.</p><div className="school-pill"><span className="school-dot"/> SD Negeri Batu Ampar 12 Pagi</div></div><div className="art-footer">Melayani dengan sepenuh hati sejak 1982</div></div><section className="login-panel"><div className="login-card"><div className="mobile-brand"><div className="brand-mark"><BookOpen size={23}/></div><span>BUKU INDUK</span></div><span className="eyebrow muted">SELAMAT DATANG KEMBALI</span><h2>Masuk ke akun Anda</h2><p className="subtle">Gunakan akun sekolah yang telah diberikan oleh operator.</p><form onSubmit={submit} className="login-form"><label htmlFor="username">Username</label><div className="field-wrap"><UserRound size={18}/><input id="username" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Masukkan username" required/></div><label htmlFor="password">Kata sandi</label><div className="field-wrap"><LockKeyhole size={18}/><input id="password" type={show?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan kata sandi" required/><button className="icon-button" type="button" aria-label={show?'Sembunyikan kata sandi':'Tampilkan kata sandi'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{error&&<div className="alert" role="alert">{error}</div>}<button className="primary-button login-submit" disabled={busy}>{busy?'Memeriksa akun…':'Masuk ke dashboard'}<span>→</span></button></form><p className="login-help">Mengalami kendala? Hubungi operator sekolah.</p><p className="login-copyright">© 2025 SDN Batu Ampar 12 Pagi · Sistem Buku Induk</p></div></section></main>
}

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem('sd-induk.user')) } catch { return null } })
  const [checking, setChecking] = useState(Boolean(sessionStorage.getItem('sd-induk.token')))
  function logout() { Object.keys(sessionStorage).filter(key=>key.startsWith('sd-induk.')).forEach(key=>sessionStorage.removeItem(key)); setUser(null) }
  useEffect(() => { const handler = () => logout(); window.addEventListener('sd-induk:unauthorized', handler); return () => window.removeEventListener('sd-induk:unauthorized', handler) }, [])
  useEffect(() => { if (!sessionStorage.getItem('sd-induk.token')) { setChecking(false); return } authService.me().then(profile=>{ setUser(profile); sessionStorage.setItem('sd-induk.user',JSON.stringify(profile)) }).catch(logout).finally(()=>setChecking(false)) }, [])
  async function login(username,password) { const result=await authService.login({username,password}); sessionStorage.setItem('sd-induk.token',result.token); sessionStorage.setItem('sd-induk.user',JSON.stringify(result.user)); setUser(result.user) }
  if (checking) return <div className="boot-screen"><span className="loader"/>Memuat sesi…</div>
  return user ? <Dashboard user={user} onLogout={logout}/> : <Login onLogin={login}/>
}
