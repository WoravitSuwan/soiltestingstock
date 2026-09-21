import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function ProtectedRoute({ children }) {
  const currentUserId = useAuthStore((s) => s.currentUserId)
  if (!currentUserId) return <Navigate to="/login" replace />
  return children
}
