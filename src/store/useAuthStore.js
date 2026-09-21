import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { genId } from '../utils/id'

const seedUsers = [
  {
    id: 'admin-seed',
    username: 'Jansogood1436',
    password: 'adminpassword123',
    role: 'Admin',
    createdAt: new Date('2026-01-01').toISOString(),
  },
]

export const useAuthStore = create(
  persist(
    (set, get) => ({
      users: seedUsers,
      currentUserId: null,

      login: (username, password) => {
        const uname = username.trim().toLowerCase()
        const user = get().users.find(
          (u) => u.username.toLowerCase() === uname && u.password === password,
        )
        if (!user) return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' }
        set({ currentUserId: user.id })
        return { success: true }
      },

      register: (username, password) => {
        const uname = username.trim()
        if (!uname || !password) return { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
        const exists = get().users.some((u) => u.username.toLowerCase() === uname.toLowerCase())
        if (exists) return { success: false, message: 'ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว' }
        const newUser = {
          id: genId('user'),
          username: uname,
          password,
          role: 'User',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ users: [...state.users, newUser], currentUserId: newUser.id }))
        return { success: true }
      },

      logout: () => set({ currentUserId: null }),

      addUser: (user) =>
        set((state) => ({
          users: [
            ...state.users,
            { ...user, id: genId('user'), createdAt: new Date().toISOString() },
          ],
        })),

      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),

      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
          currentUserId: state.currentUserId === id ? null : state.currentUserId,
        })),
    }),
    {
      name: 'sts-auth-storage',
    },
  ),
)

export function useCurrentUser() {
  return useAuthStore((s) => s.users.find((u) => u.id === s.currentUserId) || null)
}

export default useAuthStore
