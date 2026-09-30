import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'

export default function Layout() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { loading, error, reload } = useData()

  return (
    <>
      <header>
        <nav>
          <NavLink to="/" end>總費用</NavLink>
          <NavLink to="/cloud">雲端服務</NavLink>
          <NavLink to="/equipment">設備採購</NavLink>
        </nav>
        <div className="auth">
          {authLoading ? null : user ? (
            <>
              <span className="email">{user.email}</span>
              <button type="button" onClick={() => void signOut()}>登出</button>
            </>
          ) : (
            <Link to="/login" className="button">登入</Link>
          )}
        </div>
      </header>
      <main>
        {error ? (
          <div className="error-box">
            <p>{error}</p>
            <button type="button" onClick={() => void reload()}>重試</button>
          </div>
        ) : loading ? (
          <p className="empty">載入中…</p>
        ) : (
          <Outlet />
        )}
      </main>
    </>
  )
}
