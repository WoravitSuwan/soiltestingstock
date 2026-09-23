import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import Stock from './pages/Stock'
import Reports from './pages/Reports'
import ProductList from './pages/ProductList'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { useThemeStore } from './store/useThemeStore'

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock-in"
        element={
          <ProtectedRoute>
            <StockIn />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock-out"
        element={
          <ProtectedRoute>
            <StockOut />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <Stock />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductList />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
