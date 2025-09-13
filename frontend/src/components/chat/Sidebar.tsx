'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Settings, LogOut, Users, MessageSquare } from 'lucide-react';
import { CreateRoomDialog } from './CreateRoomDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { api } from '@/lib/api';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import { Room } from '@/types/chat';

interface SidebarProps {
  selectedRoom: string | null;
  onRoomSelect: (roomId: string) => void;
  onRightPanelToggle: () => void;
}

export function Sidebar({ selectedRoom, onRoomSelect, onRightPanelToggle }: SidebarProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const { user, logout } = useAuth();
  const { socket, on, off } = useSocket();

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = (message: any) => {
        // Update room's last message and timestamp
        setRooms(prev => prev.map(room => 
          room.id === message.roomId 
            ? { ...room, lastMessage: message, updatedAt: message.createdAt }
            : room
        ));
      };

      const handleRoomUpdate = (updatedRoom: Room) => {
        setRooms(prev => prev.map(room => 
          room.id === updatedRoom.id ? updatedRoom : room
        ));
      };

      on('new_message', handleNewMessage);
      on('room_updated', handleRoomUpdate);

      return () => {
        off('new_message', handleNewMessage);
        off('room_updated', handleRoomUpdate);
      };
    }
  }, [socket, on, off]);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      if (response.data.success) {
        setRooms(response.data.data.rooms);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.members?.some(member => 
      member.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleLogout = async () => {
    await logout();
  };

  const handleRoomCreated = (newRoom: Room) => {
    setRooms(prev => [newRoom, ...prev]);
    onRoomSelect(newRoom.id);
  };

  return (
    <div className="h-full flex flex-col bg-card/30 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gradient">Chat</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateRoom(true)}
              className="hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRightPanelToggle}
              className="hover:bg-accent"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RoomItem
                  room={room}
                  isSelected={selectedRoom === room.id}
                  onClick={() => onRoomSelect(room.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{getInitials(user?.displayName || user?.username || '')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName || user?.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.status?.toLowerCase()}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create Room Dialog */}
      <CreateRoomDialog
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  );
}

interface RoomItemProps {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}

function RoomItem({ room, isSelected, onClick }: RoomItemProps) {
  const getRoomName = () => {
    if (room.name) return room.name;
    if (room.type === 'DIRECT' && room.members) {
      const otherMember = room.members.find(member => member.user.id !== room.createdBy);
      return otherMember?.user.displayName || otherMember?.user.username || 'Direct Message';
    }
    return 'Unnamed Room';
  };

  const getRoomAvatar = () => {
    if (room.avatar) return room.avatar;
    if (room.type === 'DIRECT' && room.members) {
      const otherMember = room.members.find(member => member.user.id !== room.createdBy);
      return otherMember?.user.avatar;
    }
    return null;
  };

  const getRoomInitials = () => {
    if (room.type === 'DIRECT' && room.members) {
      const otherMember = room.members.find(member => member.user.id !== room.createdBy);
      return getInitials(otherMember?.user.displayName || otherMember?.user.username || '');
    }
    return getInitials(room.name || '');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        onClick={onClick}
        className={`w-full p-3 rounded-lg text-left transition-all duration-200 hover:bg-accent/50 ${
          isSelected ? 'bg-primary/10 border border-primary/20' : ''
        }`}
      >
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={getRoomAvatar() || undefined} />
            <AvatarFallback>{getRoomInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{getRoomName()}</p>
              {room.lastMessage && (
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(room.lastMessage.createdAt)}
                </p>
              )}
            </div>
            {room.lastMessage && (
              <p className="text-xs text-muted-foreground truncate">
                {room.lastMessage.content || 'Sent a file'}
              </p>
            )}
            {room.type === 'GROUP' && room.members && (
              <p className="text-xs text-muted-foreground">
                {room.members.length} members
              </p>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  );
}
