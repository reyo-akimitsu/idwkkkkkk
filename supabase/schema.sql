-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE room_type AS ENUM ('direct', 'group');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  status VARCHAR(20) DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  type room_type NOT NULL DEFAULT 'group',
  avatar_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room members table
CREATE TABLE public.room_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type message_type DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions table
CREATE TABLE public.reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Pinned messages table
CREATE TABLE public.pinned_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  pinned_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, message_id)
);

-- User sessions table
CREATE TABLE public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_info TEXT,
  ip_address INET,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_messages_room_id ON public.messages(room_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX idx_room_members_user_id ON public.room_members(user_id);
CREATE INDEX idx_reactions_message_id ON public.reactions(message_id);
CREATE INDEX idx_pinned_messages_room_id ON public.pinned_messages(room_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Rooms policies
CREATE POLICY "Users can view rooms they're members of" ON public.rooms FOR SELECT 
  USING (id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create rooms" ON public.rooms FOR INSERT 
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Room creators can update rooms" ON public.rooms FOR UPDATE 
  USING (auth.uid() = created_by);

-- Room members policies
CREATE POLICY "Users can view room members" ON public.room_members FOR SELECT 
  USING (room_id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can join rooms" ON public.room_members FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave rooms" ON public.room_members FOR DELETE 
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their rooms" ON public.messages FOR SELECT 
  USING (room_id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can send messages to their rooms" ON public.messages FOR INSERT 
  WITH CHECK (room_id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid()) 
              AND auth.uid() = sender_id);
CREATE POLICY "Users can edit own messages" ON public.messages FOR UPDATE 
  USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE 
  USING (auth.uid() = sender_id);

-- Reactions policies
CREATE POLICY "Users can view reactions" ON public.reactions FOR SELECT 
  USING (message_id IN (SELECT id FROM public.messages WHERE room_id IN 
    (SELECT room_id FROM public.room_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can add reactions" ON public.reactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND message_id IN 
    (SELECT id FROM public.messages WHERE room_id IN 
      (SELECT room_id FROM public.room_members WHERE user_id = auth.uid())));
CREATE POLICY "Users can remove own reactions" ON public.reactions FOR DELETE 
  USING (auth.uid() = user_id);

-- Pinned messages policies
CREATE POLICY "Users can view pinned messages" ON public.pinned_messages FOR SELECT 
  USING (room_id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid()));
CREATE POLICY "Room members can pin messages" ON public.pinned_messages FOR INSERT 
  WITH CHECK (room_id IN (SELECT room_id FROM public.room_members WHERE user_id = auth.uid()) 
              AND auth.uid() = pinned_by);

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.user_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Functions for real-time updates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
