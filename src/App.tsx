import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider } from './lib/auth'
import { DataProvider } from './lib/data'
import ItemsPage from './pages/ItemsPage'
import Login from './pages/Login'
import Summary from './pages/Summary'

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Summary />} />
              <Route path="/cloud" element={<ItemsPage kind="cloud" />} />
              <Route path="/equipment" element={<ItemsPage kind="equipment" />} />
              <Route path="/login" element={<Login />} />
            </Route>
          </Routes>
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  )
}
