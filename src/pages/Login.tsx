import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await signIn(email.trim(), password)
    setBusy(false)
    if (err) setError(err === 'Invalid login credentials' ? 'Email 或密碼不對' : err)
  }

  return (
    <form className="login" onSubmit={onSubmit}>
      <h1>資源與費用規劃</h1>
      <p className="hint">這是內部頁面,請先登入。</p>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="username" />
      </label>
      <label>
        密碼
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? '登入中…' : '登入'}</button>
      <p className="hint">沒有帳號?請找管理者建立。</p>
    </form>
  )
}
