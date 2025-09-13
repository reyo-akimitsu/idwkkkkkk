'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { debounce } from '@/lib/utils';

interface MessageInputProps {
  roomId: string;
  onMessageSent: () => void;
}

export function MessageInput({ roomId, onMessageSent }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { emit } = useSocket();
  const { user } = useAuth();

  const handleSendMessage = () => {
    if (!message.trim() || !roomId) return;

    emit('send_message', {
      roomId,
      content: message.trim(),
      type: 'TEXT'
    });

    setMessage('');
    setIsTyping(false);
    emit('typing_stop', { roomId });
    onMessageSent();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      emit('typing_start', { roomId });
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      emit('typing_stop', { roomId });
    }
  };

  // Debounced typing stop
  const debouncedTypingStop = debounce(() => {
    if (isTyping) {
      setIsTyping(false);
      emit('typing_stop', { roomId });
    }
  }, 1000);

  useEffect(() => {
    if (isTyping) {
      debouncedTypingStop();
    }
  }, [message, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="flex items-end space-x-2">
      {/* Attachment Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 hover:bg-accent"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Message Input */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="w-full min-h-[40px] max-h-32 px-4 py-2 pr-12 bg-background border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 scrollbar-thin"
          rows={1}
        />
        
        {/* Emoji Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-accent"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </div>

      {/* Send Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim()}
          className="h-10 w-10 rounded-lg"
        >
          <Send className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
