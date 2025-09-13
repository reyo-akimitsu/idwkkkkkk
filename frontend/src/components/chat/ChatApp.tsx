'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { RightPanel } from './RightPanel';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function ChatApp() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const { connected } = useSocket();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Connection Status */}
      {!connected && (
        <div className="fixed top-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
            <span className="text-sm font-medium">Connecting...</span>
          </motion.div>
        </div>
      )}

      {/* Left Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-80 border-r border-border bg-card/50 backdrop-blur-sm"
      >
        <Sidebar
          selectedRoom={selectedRoom}
          onRoomSelect={setSelectedRoom}
          onRightPanelToggle={() => setRightPanelOpen(!rightPanelOpen)}
        />
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea
          roomId={selectedRoom}
          onRightPanelToggle={() => setRightPanelOpen(!rightPanelOpen)}
        />
      </div>

      {/* Right Panel */}
      {rightPanelOpen && selectedRoom && (
        <motion.div
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          exit={{ x: 300 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-80 border-l border-border bg-card/50 backdrop-blur-sm"
        >
          <RightPanel
            roomId={selectedRoom}
            onClose={() => setRightPanelOpen(false)}
          />
        </motion.div>
      )}
    </div>
  );
}
