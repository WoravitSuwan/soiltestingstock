import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import SealLogo from '../components/SealLogo'
import { useAuthStore } from '../store/useAuthStore'
import { inputClass } from '../components/FormField'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'login') {
      const result = login(username, password)
      if (!result.success) {
        setError(result.message)
        return
      }
      navigate('/', { replace: true })
    } else {
      if (password !== confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน')
        return
      }
      if (password.length < 6) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        return
      }
      const result = register(username, password)
      if (!result.success) {
        setError(result.message)
        return
      }
      navigate('/', { replace: true })
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <SealLogo size={64} />
          <div>
            <div className="text-2xl font-extrabold tracking-wide text-[var(--text-primary)]">STS</div>
            <div className="-mt-1 text-xs font-medium tracking-[0.2em] text-[var(--text-accent)]">
              SOIL TESTING SIAM
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-7 shadow-card">
          <div className="mb-6 flex rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                mode === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              สมัครสมาชิก
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--text-secondary)]">ชื่อผู้ใช้งาน</span>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className={inputClass('pl-9')}
                  required
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--text-secondary)]">รหัสผ่าน</span>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass('pl-9 pr-9')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-secondary)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {mode === 'register' && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[var(--text-secondary)]">ยืนยันรหัสผ่าน</span>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass('pl-9')}
                    required
                  />
                </div>
              </label>
            )}

            {error && (
              <div className="rounded-lg bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">{error}</div>
            )}

            <button
              type="submit"
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>


        </div>
      </div>
    </div>
  )
}
