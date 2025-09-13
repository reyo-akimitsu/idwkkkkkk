# 🚀 Premium Chat App by Reyo ;p

A modern, real-time chat application built with cutting-edge technologies. Features a sleek Discord/Slack-inspired UI with glassmorphism effects, real-time messaging, file sharing, and enterprise-grade security.

![Chat App Preview](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Premium+Chat+App)

## ✨ Features

### 💬 Core Messaging
- **Real-time messaging** with WebSocket connections
- **Typing indicators** and read receipts
- **Message reactions** with emoji support
- **Message editing** and deletion
- **Reply to messages** with context
- **File sharing** with drag & drop support
- **Image previews** and thumbnails

### 👥 User Management
- **JWT authentication** with refresh tokens
- **User profiles** with avatars and status
- **Online/offline presence** indicators
- **Contact management** and user search
- **Session management** across devices

### 🏠 Room Management
- **Direct messages** and group chats
- **Room creation** with custom names and descriptions
- **Member management** with roles (Owner, Admin, Moderator, Member)
- **Pinned messages** for important content
- **Room search** and filtering

### 🎨 Modern UI/UX
- **Dark theme** by default with light mode support
- **Glassmorphism effects** and smooth animations
- **Responsive design** for desktop and mobile
- **Keyboard shortcuts** and accessibility features
- **Custom scrollbars** and hover effects

### 🔒 Security & Performance
- **End-to-end encryption** ready (architecture in place)
- **Rate limiting** and input validation
- **File type restrictions** and size limits
- **SQL injection protection** with Prisma ORM
- **CORS configuration** and security headers

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Express.js    │    │ • Prisma ORM    │
│ • TypeScript    │    │ • Socket.IO     │    │ • Redis Cache   │
│ • TailwindCSS   │    │ • JWT Auth      │    │ • File Storage  │
│ • shadcn/ui     │    │ • File Upload   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### One-Command Setup

#### Windows (PowerShell)
```powershell
# Clone and setup
git clone <repository-url>
cd premium-chat-app
.\scripts\setup.ps1
```

#### macOS/Linux
```bash
# Clone and setup
git clone <repository-url>
cd premium-chat-app
chmod +x scripts/setup.sh
./scripts/setup.sh
```

#### Manual Setup
```bash
# Clone the repository
git clone <repository-url>
cd premium-chat-app

# Start all services with Docker Compose
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
# Then open http://localhost:3000
```

### 🎯 What You Get
- **Automatic JWT secret generation** for security
- **Sample data** with test accounts
- **Health monitoring** at `/health` endpoint
- **Development helpers** with `scripts/dev.ps1`

That's it! The application will be running with:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **MinIO**: http://localhost:9001

### Manual Setup (Development)

If you prefer to run services individually:

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp env.example .env
# Edit .env with your configuration

# 3. Start database services
docker-compose up -d postgres redis minio

# 4. Set up the database
cd backend
npm run db:push
npm run db:seed

# 5. Start the backend
npm run dev:backend

# 6. Start the frontend (in a new terminal)
npm run dev:frontend
```

## 📁 Project Structure

```
premium-chat-app/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── app/             # Next.js 14 App Router
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Socket)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and configurations
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Node.js Express server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── socket/          # Socket.IO handlers
│   │   └── utils/           # Utility functions
│   ├── prisma/              # Database schema and migrations
│   └── package.json
├── infra/                   # Infrastructure and deployment
│   ├── docker/              # Docker configurations
│   ├── nginx/               # Nginx configuration
│   └── scripts/             # Deployment scripts
├── docker-compose.yml       # Local development setup
├── env.example              # Environment variables template
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chat_app"
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# File Storage
STORAGE_TYPE="local"  # or "s3"
STORAGE_PATH="./uploads"

# Server Configuration
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## 🎯 API Documentation

### Authentication Endpoints

```bash
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
POST /api/auth/refresh     # Refresh access token
POST /api/auth/logout      # Logout user
GET  /api/auth/verify      # Verify token
```

### User Endpoints

```bash
GET    /api/users/me              # Get current user
PATCH  /api/users/me              # Update profile
GET    /api/users/search          # Search users
GET    /api/users/:userId         # Get user by ID
GET    /api/users/me/contacts     # Get user contacts
POST   /api/users/me/contacts     # Add contact
DELETE /api/users/me/contacts/:id # Remove contact
```

### Room Endpoints

```bash
GET    /api/rooms                 # Get user's rooms
POST   /api/rooms                 # Create room
GET    /api/rooms/:roomId         # Get room details
PATCH  /api/rooms/:roomId         # Update room
POST   /api/rooms/:roomId/members # Add member
DELETE /api/rooms/:roomId/members/:userId # Remove member
```

### Message Endpoints

```bash
GET    /api/messages/room/:roomId # Get room messages
GET    /api/messages/:messageId   # Get message by ID
PATCH  /api/messages/:messageId   # Edit message
DELETE /api/messages/:messageId   # Delete message
POST   /api/messages/mark-read    # Mark messages as read
```

### File Endpoints

```bash
POST   /api/files/upload          # Upload single file
POST   /api/files/upload-multiple # Upload multiple files
GET    /api/files/:fileId         # Get file details
GET    /api/files/room/:roomId    # Get room files
DELETE /api/files/:fileId         # Delete file
```

## 🔌 WebSocket Events

### Client to Server

```javascript
// Join a room
socket.emit('join_room', roomId);

// Send message
socket.emit('send_message', {
  roomId: 'room-id',
  content: 'Hello world!',
  type: 'TEXT'
});

// Typing indicators
socket.emit('typing_start', { roomId: 'room-id' });
socket.emit('typing_stop', { roomId: 'room-id' });

// Add reaction
socket.emit('add_reaction', {
  messageId: 'message-id',
  emoji: '👍'
});

// Mark as read
socket.emit('mark_read', { messageId: 'message-id' });
```

### Server to Client

```javascript
// New message
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// User typing
socket.on('user_typing', (data) => {
  console.log(`${data.user.username} is typing`);
});

// User joined/left
socket.on('user_joined', (data) => {
  console.log(`${data.user.username} joined`);
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Deployment

1. **Set up production environment variables**
2. **Configure SSL certificates**
3. **Set up monitoring and logging**
4. **Deploy with Docker Compose**

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configurations

- **Development**: `docker-compose.yml`
- **Production**: `docker-compose.prod.yml`
- **Staging**: `docker-compose.staging.yml`

## 🔒 Security Considerations

- **JWT tokens** with short expiration times
- **Refresh token rotation** for enhanced security
- **Rate limiting** on API endpoints
- **Input validation** with Zod schemas
- **File upload restrictions** (type, size)
- **CORS configuration** for production
- **SQL injection protection** with Prisma
- **XSS protection** with proper sanitization

## 🎨 Customization

### Themes
The app supports light/dark themes with CSS custom properties. Modify `globals.css` to customize colors:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  /* ... other color variables */
}
```

### Components
All UI components are built with shadcn/ui and can be customized by modifying the component files in `src/components/ui/`.

## 📈 Performance

- **Code splitting** with Next.js
- **Image optimization** with Next.js Image component
- **Lazy loading** for messages and components
- **Virtual scrolling** for large message lists
- **Redis caching** for frequently accessed data
- **Database indexing** for optimal query performance

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed**
   ```bash
   # Check if PostgreSQL is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   ```

2. **Socket.IO connection issues**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Verify WebSocket URL in frontend
   ```

3. **File upload issues**
   ```bash
   # Check MinIO status
   docker-compose ps minio
   
   # Verify storage configuration
   ```

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🗺️ Roadmap

### Phase 1 (Current) - MVP ✅
- [x] Real-time messaging
- [x] User authentication
- [x] Room management
- [x] File sharing
- [x] Modern UI/UX

### Phase 2 - Enhanced Features
- [ ] Voice and video calls (WebRTC)
- [ ] Screen sharing
- [ ] Message encryption (E2EE)
- [ ] Push notifications
- [ ] Mobile app (React Native)

### Phase 3 - Advanced Features
- [ ] AI assistant integration
- [ ] Message translation
- [ ] Advanced search
- [ ] Bot framework
- [ ] Analytics dashboard

### Phase 4 - Enterprise
- [ ] SSO integration
- [ ] Advanced admin panel
- [ ] Compliance features
- [ ] Multi-tenant support
- [ ] Advanced security

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://prisma.io/) - Database ORM
- [Socket.IO](https://socket.io/) - Real-time communication
- [Framer Motion](https://framer.com/motion/) - Animations

---

**Built with ❤️ for the modern web**
