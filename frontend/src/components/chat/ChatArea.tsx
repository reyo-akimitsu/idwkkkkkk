'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Room, Message } from '@/types/chat';

interface ChatAreaProps {
  roomId: string | null;
  onRightPanelToggle: () => void;
}

export function ChatArea({ roomId, onRightPanelToggle }: ChatAreaProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { socket, on, off, emit } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (roomId) {
      fetchRoom();
      fetchMessages();
      joinRoom();
    } else {
      setRoom(null);
      setMessages([]);
    }

    return () => {
      if (roomId) {
        leaveRoom();
      }
    };
  }, [roomId]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: Message) => {
        if (message.roomId === roomId) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      };

      const handleMessageUpdated = (message: Message) => {
        setMessages(prev => prev.map(msg => 
          msg.id === message.id ? message : msg
        ));
      };

      const handleUserTyping = (data: { roomId: string; user: any; isTyping: boolean }) => {
        if (data.roomId === roomId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.user.id);
            } else {
              newSet.delete(data.user.id);
            }
            return newSet;
          });
        }
      };

      const handleUserJoined = (data: { roomId: string; user: any }) => {
        if (data.roomId === roomId) {
          // Add system message
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            roomId: data.roomId,
            senderId: 'system',
            content: `${data.user.displayName || data.user.username} joined the room`,
            type: 'SYSTEM',
            isEdited: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sender: data.user
          };
          setMessages(prev => [...prev, systemMessage]);
        }
      };

      const handleUserLeft = (data: { roomId: string; user: any }) => {
        if (data.roomId === roomId) {
          // Add system message
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            roomId: data.roomId,
            senderId: 'system',
            content: `${data.user.displayName || data.user.username} left the room`,
            type: 'SYSTEM',
            isEdited: false,
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sender: data.user
          };
          setMessages(prev => [...prev, systemMessage]);
        }
      };

      on('new_message', handleNewMessage);
      on('message_updated', handleMessageUpdated);
      on('user_typing', handleUserTyping);
      on('user_joined', handleUserJoined);
      on('user_left', handleUserLeft);

      return () => {
        off('new_message', handleNewMessage);
        off('message_updated', handleMessageUpdated);
        off('user_typing', handleUserTyping);
        off('user_joined', handleUserJoined);
        off('user_left', handleUserLeft);
      };
    }
  }, [socket, roomId, on, off]);

  const fetchRoom = async () => {
    if (!roomId) return;
    
    try {
      const response = await api.get(`/rooms/${roomId}`);
      if (response.data.success) {
        setRoom(response.data.data.room);
      }
    } catch (error) {
      console.error('Failed to fetch room:', error);
    }
  };

  const fetchMessages = async () => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/messages/room/${roomId}`);
      if (response.data.success) {
        setMessages(response.data.data.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = () => {
    if (roomId) {
      emit('join_room', roomId);
    }
  };

  const leaveRoom = () => {
    if (roomId) {
      emit('leave_room', roomId);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getRoomName = () => {
    if (!room) return 'Select a conversation';
    if (room.name) return room.name;
    if (room.type === 'DIRECT' && room.members) {
      const otherMember = room.members.find(member => member.user.id !== user?.id);
      return otherMember?.user.displayName || otherMember?.user.username || 'Direct Message';
    }
    return 'Unnamed Room';
  };

  const getRoomDescription = () => {
    if (!room) return 'Choose a conversation to start messaging';
    if (room.description) return room.description;
    if (room.type === 'DIRECT' && room.members) {
      const otherMember = room.members.find(member => member.user.id !== user?.id);
      return otherMember?.user.bio || 'Direct message';
    }
    return `${room.members?.length || 0} members`;
  };

  if (!roomId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Send className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Welcome to Chat</h2>
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-lg font-semibold">{getRoomName()}</h2>
              <p className="text-sm text-muted-foreground">{getRoomDescription()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRightPanelToggle}
              className="hover:bg-accent"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          loading={loading}
          typingUsers={typingUsers}
          room={room}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <MessageInput
          roomId={roomId}
          onMessageSent={() => scrollToBottom()}
        />
      </div>
    </div>
  );
}
