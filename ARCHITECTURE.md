# 🏗️ Chat App Architecture

## High-Level Architecture

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

## Repository Structure

```
chat-app/
├── frontend/                 # Next.js React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Next.js pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and configurations
│   │   ├── store/          # State management (Zustand)
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   ├── package.json
│   └── tailwind.config.js
├── backend/                 # Node.js Express server
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── socket/         # Socket.IO handlers
│   │   └── utils/          # Utility functions
│   ├── prisma/             # Database schema and migrations
│   ├── package.json
│   └── Dockerfile
├── shared/                  # Shared types and utilities
│   ├── types/              # Common TypeScript types
│   └── utils/              # Shared utility functions
├── infra/                   # Infrastructure and deployment
│   ├── docker/             # Docker configurations
│   ├── k8s/                # Kubernetes manifests
│   └── scripts/            # Deployment scripts
├── docs/                    # Documentation
│   ├── api/                # API documentation
│   ├── deployment/         # Deployment guides
│   └── development/        # Development guides
├── docker-compose.yml       # Local development setup
├── .env.example            # Environment variables template
└── README.md               # Main documentation
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Real-time**: Socket.IO client
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Authentication**: JWT with refresh tokens
- **File Storage**: Local/S3 compatible
- **Validation**: Zod

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL
- **Cache**: Redis
- **File Storage**: MinIO (S3 compatible)
- **Reverse Proxy**: Nginx
- **Monitoring**: Prometheus + Grafana

## Key Features Architecture

### Real-time Messaging
```
Client ──WebSocket──► Socket.IO Server ──► Redis Pub/Sub ──► Other Clients
```

### Authentication Flow
```
1. Login ──► JWT Access Token (15min) + Refresh Token (7days)
2. API Calls ──► Access Token in Authorization header
3. Token Expiry ──► Refresh Token ──► New Access Token
4. Logout ──► Blacklist tokens
```

### File Upload Flow
```
1. Client ──► Upload Request ──► Backend
2. Backend ──► Generate Signed URL ──► MinIO/S3
3. Client ──► Direct Upload ──► Storage
4. Backend ──► Save File Metadata ──► Database
```

## Security Considerations

- **Transport Security**: HTTPS/WSS only
- **Authentication**: JWT with short-lived access tokens
- **Authorization**: Role-based access control
- **Input Validation**: Zod schema validation
- **File Upload**: Type and size restrictions
- **Rate Limiting**: API and WebSocket rate limits
- **CORS**: Configured for production domains

## Scalability Considerations

- **Horizontal Scaling**: Stateless backend services
- **Database**: Connection pooling and read replicas
- **Caching**: Redis for session and message caching
- **File Storage**: CDN integration for media files
- **Load Balancing**: Nginx reverse proxy
- **Monitoring**: Health checks and metrics collection
