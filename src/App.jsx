import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import Stock from './pages/Stock'
import Reports from './pages/Reports'
import ProductList from './pages/ProductList'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/stock-in" element={<StockIn />} />
      <Route path="/stock-out" element={<StockOut />} />
      <Route path="/stock" element={<Stock />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/products" element={<ProductList />} />
    </Routes>
  )
}
