import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import Login from '../pages/Login'

export default function Layout() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { loading, error, reload } = useData()

  if (authLoading) return <main><p className="empty">載入中…</p></main>

  if (!user) {
    return (
      <main className="gate">
        <Login />
      </main>
    )
  }

  return (
    <>
      <header>
        <nav>
          <NavLink to="/" end>總覽</NavLink>
          <NavLink to="/cloud">雲端與訂閱</NavLink>
          <NavLink to="/equipment">設備採購</NavLink>
          <NavLink to="/budgets">核定預算</NavLink>
          <NavLink to="/actuals">實際動用</NavLink>
        </nav>
        <div className="auth">
          <span className="email">{user.email}</span>
          <button type="button" className="quiet" onClick={() => void signOut()}>登出</button>
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
