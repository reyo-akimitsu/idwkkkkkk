'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <SocketProvider>
          {children}
          <Toaster />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
