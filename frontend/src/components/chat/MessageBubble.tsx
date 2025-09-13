'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Reply, Edit, Trash2, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate, getInitials } from '@/lib/utils';
import { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

interface MessageBubbleProps {
  message: Message;
  showAvatar: boolean;
  showTimestamp: boolean;
}

export function MessageBubble({ message, showAvatar, showTimestamp }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const { user } = useAuth();

  const isOwnMessage = message.senderId === user?.id;
  const isSystemMessage = message.type === 'SYSTEM';

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted/50 text-muted-foreground text-sm px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`flex items-end space-x-2 group ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender.avatar} />
          <AvatarFallback>{getInitials(message.sender.displayName || message.sender.username)}</AvatarFallback>
        </Avatar>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender Name */}
        {showAvatar && !isOwnMessage && (
          <p className="text-xs text-muted-foreground mb-1 px-1">
            {message.sender.displayName || message.sender.username}
          </p>
        )}

        {/* Message Bubble */}
        <div className="relative">
          <motion.div
            className={`message-bubble ${
              isOwnMessage 
                ? 'message-sent' 
                : 'message-received'
            }`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {/* Reply Context */}
            {message.replyTo && (
              <div className="border-l-2 border-primary/30 pl-2 mb-2 text-xs text-muted-foreground">
                <p className="font-medium">
                  {message.replyTo.sender.displayName || message.replyTo.sender.username}
                </p>
                <p className="truncate">
                  {message.replyTo.content || 'Sent a file'}
                </p>
              </div>
            )}

            {/* Message Content */}
            {message.content && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {/* Files */}
            {message.files && message.files.length > 0 && (
              <div className="space-y-2 mt-2">
                {message.files.map((file) => (
                  <div key={file.id} className="bg-background/50 rounded-lg p-2">
                    {file.mimeType.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.originalName}
                        className="max-w-full h-auto rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          📎
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {message.reactions.map((reaction) => (
                  <span
                    key={reaction.id}
                    className="bg-background/50 text-xs px-2 py-1 rounded-full"
                  >
                    {reaction.emoji} {reaction.user.displayName || reaction.user.username}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Message Actions */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute top-0 ${
                  isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
                } flex items-center space-x-1 bg-background border rounded-lg shadow-lg p-1`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-accent"
                >
                  <Reply className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-accent"
                >
                  <Smile className="h-3 w-3" />
                </Button>
                {isOwnMessage && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-accent"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <p className="text-xs text-muted-foreground mt-1 px-1">
            {formatDate(message.createdAt)}
            {message.isEdited && (
              <span className="ml-1 italic">(edited)</span>
            )}
          </p>
        )}
      </div>

      {/* Spacer for own messages */}
      {isOwnMessage && !showAvatar && <div className="w-8" />}
    </motion.div>
  );
}
