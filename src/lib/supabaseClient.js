import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(url && anonKey)

// null when env vars are missing (e.g. a fork without its own Supabase project yet) —
// callers check isSupabaseConfigured before using this.
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
