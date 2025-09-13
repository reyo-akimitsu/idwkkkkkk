'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MessageSquare, Users, Zap, Shield } from 'lucide-react';

export function AuthPage() {
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      await login(email, password);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const username = formData.get('username') as string;
      const password = formData.get('password') as string;
      const displayName = formData.get('displayName') as string;

      await register({ email, username, password, displayName });
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Features */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gradient">
              Premium Chat Experience
            </h1>
            <p className="text-xl text-muted-foreground">
              Connect, collaborate, and communicate with style. Built for the modern world.
            </p>
          </div>

          <div className="grid gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-start space-x-4"
            >
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Messaging</h3>
                <p className="text-sm text-muted-foreground">
                  Instant communication with typing indicators and read receipts
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start space-x-4"
            >
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Group Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Create rooms, manage members, and organize conversations
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start space-x-4"
            >
              <div className="p-3 rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">
                  Optimized for speed with WebSocket connections and smart caching
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start space-x-4"
            >
              <div className="p-3 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Secure & Private</h3>
                <p className="text-sm text-muted-foreground">
                  End-to-end encryption and enterprise-grade security
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right side - Auth Forms */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass border-0 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        placeholder="Choose a username"
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        type="text"
                        placeholder="Your display name"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        required
                        disabled={loading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
