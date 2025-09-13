'use client';

import { motion } from 'framer-motion';
import { Room } from '@/types/chat';

interface TypingIndicatorProps {
  typingUsers: Set<string>;
  room: Room | null;
}

export function TypingIndicator({ typingUsers, room }: TypingIndicatorProps) {
  if (typingUsers.size === 0 || !room) return null;

  const getTypingText = () => {
    const userNames = Array.from(typingUsers).map(userId => {
      const member = room.members?.find(m => m.user.id === userId);
      return member?.user.displayName || member?.user.username || 'Someone';
    });

    if (userNames.length === 1) {
      return `${userNames[0]} is typing...`;
    } else if (userNames.length === 2) {
      return `${userNames[0]} and ${userNames[1]} are typing...`;
    } else {
      return `${userNames[0]} and ${userNames.length - 1} others are typing...`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-2 text-muted-foreground text-sm"
    >
      <div className="flex space-x-1">
        <motion.div
          className="w-2 h-2 bg-muted-foreground rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-muted-foreground rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-muted-foreground rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span>{getTypingText()}</span>
    </motion.div>
  );
}
