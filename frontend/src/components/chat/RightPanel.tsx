'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Pin, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { Room, Message, File } from '@/types/chat';

interface RightPanelProps {
  roomId: string;
  onClose: () => void;
}

export function RightPanel({ roomId, onClose }: RightPanelProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
      fetchPinnedMessages();
      fetchFiles();
    }
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const response = await api.get(`/rooms/${roomId}`);
      if (response.data.success) {
        setRoom(response.data.data.room);
      }
    } catch (error) {
      console.error('Failed to fetch room details:', error);
    }
  };

  const fetchPinnedMessages = async () => {
    try {
      const response = await api.get(`/rooms/${roomId}/pinned`);
      if (response.data.success) {
        setPinnedMessages(response.data.data.pinnedMessages.map((pm: any) => pm.message));
      }
    } catch (error) {
      console.error('Failed to fetch pinned messages:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await api.get(`/files/room/${roomId}`);
      if (response.data.success) {
        setFiles(response.data.data.files);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };

  const getRoomName = () => {
    if (!room) return '';
    if (room.name) return room.name;
    if (room.type === 'DIRECT' && room.members) {
      const otherMember = room.members.find(member => member.user.id !== user?.id);
      return otherMember?.user.displayName || otherMember?.user.username || 'Direct Message';
    }
    return 'Unnamed Room';
  };

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-card/30 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{getRoomName()}</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="members" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 m-4 mb-0">
            <TabsTrigger value="members" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Members</span>
            </TabsTrigger>
            <TabsTrigger value="pinned" className="flex items-center space-x-2">
              <Pin className="h-4 w-4" />
              <span>Pinned</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Files</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {room?.members?.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user.avatar} />
                      <AvatarFallback>
                        {getInitials(member.user.displayName || member.user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                      member.user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user.displayName || member.user.username}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.user.status?.toLowerCase()}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {member.role}
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pinned" className="flex-1 overflow-y-auto p-4">
            {pinnedMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Pin className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No pinned messages</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pinnedMessages.map((message) => (
                  <div key={message.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">
                      {message.sender.displayName || message.sender.username}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {message.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="flex-1 overflow-y-auto p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No files shared</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      📎
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
