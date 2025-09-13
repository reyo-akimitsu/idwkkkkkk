'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Users, Lock, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Room } from '@/types/chat';

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: Room) => void;
}

export function CreateRoomDialog({ isOpen, onClose, onRoomCreated }: CreateRoomDialogProps) {
  const [loading, setLoading] = useState(false);
  const [roomType, setRoomType] = useState<'GROUP' | 'CHANNEL'>('GROUP');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/rooms', {
        name: formData.name,
        description: formData.description,
        type: roomType,
        isPrivate: formData.isPrivate,
        memberIds: [user?.id] // Add current user as member
      });

      if (response.data.success) {
        onRoomCreated(response.data.data.room);
        toast({
          title: "Room created!",
          description: `${formData.name} has been created successfully.`,
        });
        onClose();
        setFormData({ name: '', description: '', isPrivate: false });
      }
    } catch (error: any) {
      toast({
        title: "Failed to create room",
        description: error.response?.data?.error?.message || 'Something went wrong',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Create New Room</CardTitle>
              <CardDescription>
                Start a new conversation with your team
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Room Type Selection */}
              <div className="space-y-2">
                <Label>Room Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={roomType === 'GROUP' ? 'default' : 'outline'}
                    onClick={() => setRoomType('GROUP')}
                    className="flex items-center space-x-2"
                  >
                    <Users className="h-4 w-4" />
                    <span>Group</span>
                  </Button>
                  <Button
                    type="button"
                    variant={roomType === 'CHANNEL' ? 'default' : 'outline'}
                    onClick={() => setRoomType('CHANNEL')}
                    className="flex items-center space-x-2"
                  >
                    <Hash className="h-4 w-4" />
                    <span>Channel</span>
                  </Button>
                </div>
              </div>

              {/* Room Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Room Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter room name"
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What's this room about?"
                  disabled={loading}
                />
              </div>

              {/* Privacy Setting */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="rounded border-input"
                  disabled={loading}
                />
                <Label htmlFor="isPrivate" className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Private room</span>
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
