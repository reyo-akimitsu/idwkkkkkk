'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { ChatApp } from '@/components/chat/ChatApp';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <ChatApp />;
}
