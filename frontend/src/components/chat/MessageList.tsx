'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Message, Room } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  typingUsers: Set<string>;
  room: Room | null;
}

export function MessageList({ messages, loading, typingUsers, room }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <MessageBubble
              message={message}
              showAvatar={index === 0 || messages[index - 1]?.senderId !== message.senderId}
              showTimestamp={index === messages.length - 1 || 
                new Date(messages[index + 1]?.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <TypingIndicator typingUsers={typingUsers} room={room} />
        </motion.div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
