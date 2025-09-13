export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  isOnline: boolean;
  lastSeen?: string;
  createdAt: string;
}

export interface RoomMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  user: User;
}

export interface Room {
  id: string;
  name?: string;
  description?: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  avatar?: string;
  isPrivate: boolean;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members?: RoomMember[];
  lastMessage?: Message;
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  receiverId?: string;
  content?: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'SYSTEM';
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  replyToId?: string;
  threadId?: string;
  createdAt: string;
  updatedAt: string;
  sender: User;
  replyTo?: Message;
  files?: File[];
  reactions?: Reaction[];
  readReceipts?: ReadReceipt[];
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: User;
}

export interface ReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
  user: User;
}

export interface File {
  id: string;
  messageId?: string;
  roomId?: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  isDeleted: boolean;
  createdAt: string;
  user: User;
}

export interface TypingUser {
  user: User;
  isTyping: boolean;
}

export interface SocketEvents {
  // Client to Server
  join_room: (roomId: string) => void;
  leave_room: (roomId: string) => void;
  send_message: (data: {
    roomId: string;
    content?: string;
    type?: string;
    replyToId?: string;
    files?: any[];
  }) => void;
  typing_start: (data: { roomId: string }) => void;
  typing_stop: (data: { roomId: string }) => void;
  add_reaction: (data: { messageId: string; emoji: string }) => void;
  mark_read: (data: { messageId: string }) => void;
  update_status: (data: { status: string }) => void;

  // Server to Client
  joined_room: (data: { roomId: string }) => void;
  left_room: (data: { roomId: string }) => void;
  new_message: (message: Message) => void;
  message_updated: (message: Message) => void;
  message_read: (data: { messageId: string; userId: string; readAt: string }) => void;
  user_typing: (data: { roomId: string; user: User; isTyping: boolean }) => void;
  user_joined: (data: { roomId: string; user: User }) => void;
  user_left: (data: { roomId: string; user: User }) => void;
  user_status_updated: (data: { userId: string; status: string; user: User }) => void;
  room_updated: (room: Room) => void;
  error: (data: { message: string }) => void;
}
