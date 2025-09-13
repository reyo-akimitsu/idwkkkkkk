import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database types
export interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url?: string
  status: 'online' | 'offline' | 'away' | 'busy'
  last_seen: string
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name?: string
  description?: string
  type: 'direct' | 'group'
  avatar_url?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  role: 'admin' | 'moderator' | 'member'
  joined_at: string
  profile?: Profile
}

export interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  file_url?: string
  file_name?: string
  file_size?: number
  reply_to_id?: string
  edited_at?: string
  created_at: string
  updated_at: string
  sender?: Profile
  reply_to?: Message
  reactions?: Reaction[]
}

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  user?: Profile
}

export interface PinnedMessage {
  id: string
  room_id: string
  message_id: string
  pinned_by: string
  pinned_at: string
  message?: Message
  pinned_by_user?: Profile
}
