import { supabase } from './supabase'
import type { Room, Message, RoomMember, Reaction, PinnedMessage, Profile } from './supabase'

export class ChatService {
  // Room management
  static async createRoom(name: string, type: 'direct' | 'group', memberIds: string[]) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Create room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name,
        type,
        created_by: user.id
      })
      .select()
      .single()

    if (roomError) throw roomError

    // Add members
    const members = [
      { room_id: room.id, user_id: user.id, role: 'admin' },
      ...memberIds.map(id => ({ room_id: room.id, user_id: id, role: 'member' }))
    ]

    const { error: membersError } = await supabase
      .from('room_members')
      .insert(members)

    if (membersError) throw membersError

    return room
  }

  static async getRooms() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('room_members')
      .select(`
        room_id,
        role,
        joined_at,
        rooms (
          id,
          name,
          description,
          type,
          avatar_url,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (error) throw error
    return data?.map(item => item.rooms).filter(Boolean) as Room[]
  }

  static async getRoomMembers(roomId: string) {
    const { data, error } = await supabase
      .from('room_members')
      .select(`
        id,
        role,
        joined_at,
        profiles (
          id,
          username,
          display_name,
          avatar_url,
          status,
          last_seen
        )
      `)
      .eq('room_id', roomId)

    if (error) throw error
    return data as (RoomMember & { profiles: Profile })[]
  }

  // Message management
  static async sendMessage(roomId: string, content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string, fileName?: string, fileSize?: number, replyToId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        content,
        type,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        reply_to_id: replyToId
      })
      .select(`
        *,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) throw error
    return data
  }

  static async getMessages(roomId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          id,
          username,
          display_name,
          avatar_url
        ),
        reply_to:reply_to_id (
          id,
          content,
          profiles (
            id,
            username,
            display_name
          )
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data?.reverse() || []
  }

  static async editMessage(messageId: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('messages')
      .update({
        content,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteMessage(messageId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id)

    if (error) throw error
  }

  // Reactions
  static async addReaction(messageId: string, emoji: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async removeReaction(messageId: string, emoji: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)

    if (error) throw error
  }

  // Pinned messages
  static async pinMessage(roomId: string, messageId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('pinned_messages')
      .insert({
        room_id: roomId,
        message_id: messageId,
        pinned_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getPinnedMessages(roomId: string) {
    const { data, error } = await supabase
      .from('pinned_messages')
      .select(`
        *,
        messages (
          *,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        ),
        profiles (
          id,
          username,
          display_name
        )
      `)
      .eq('room_id', roomId)
      .order('pinned_at', { ascending: false })

    if (error) throw error
    return data as (PinnedMessage & { messages: Message, profiles: Profile })[]
  }

  // Real-time subscriptions
  static subscribeToMessages(roomId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, async (payload) => {
        const { data: message } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single()

        if (message) callback(message)
      })
      .subscribe()
  }

  static subscribeToRoomUpdates(callback: (room: Room) => void) {
    const { data: { user } } = supabase.auth.getUser()
    if (!user) return

    return supabase
      .channel('room_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms'
      }, (payload) => {
        callback(payload.new as Room)
      })
      .subscribe()
  }

  static subscribeToUserStatus(callback: (profile: Profile) => void) {
    return supabase
      .channel('user_status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        callback(payload.new as Profile)
      })
      .subscribe()
  }
}
