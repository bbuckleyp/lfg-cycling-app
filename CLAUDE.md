# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend Development
```bash
cd backend

# Development
npm run dev                 # Start development server with hot reload
npm run build              # Build TypeScript to JavaScript
npm run start              # Start production server

# Database Operations
npm run migrate            # Run Prisma migrations in development
npm run migrate:deploy     # Deploy migrations in production
npm run generate           # Generate Prisma client
npm run db:seed            # Seed database with sample data
npm run db:reset           # Reset database (development only)
npm run db:studio          # Open Prisma Studio

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues automatically
npm run format             # Format code with Prettier

# Testing
npm test                   # Run Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report

# Background Services
npm run notifications      # Run notification processor manually
```

### Frontend Development
```bash
cd frontend

# Development
npm run dev                # Start Vite development server
npm run build              # Build for production
npm run preview            # Preview production build
npm run lint               # Run ESLint
```

### Docker Operations
```bash
# Development
./deploy.sh start          # Start all services
./deploy.sh stop           # Stop all services
./deploy.sh restart        # Restart all services
./deploy.sh logs           # View logs
./deploy.sh status         # Check service status

# Production
./deploy.sh -e production start    # Start production deployment
./deploy.sh -e production pull     # Pull updates and redeploy
./deploy.sh -e production backup   # Create database backup

# Maintenance
./deploy.sh build          # Build Docker images
./deploy.sh migrate        # Run database migrations
./deploy.sh backup         # Create database backup
```

## Architecture Overview

### High-Level Structure
This is a full-stack cycling application with the following components:

1. **Frontend (React + TypeScript)**: Single-page application built with Vite
2. **Backend (Node.js + Express + TypeScript)**: RESTful API with authentication
3. **Database (PostgreSQL + Prisma ORM)**: Relational database with type-safe queries
4. **External Integrations**: Strava API for route import and management
5. **Background Services**: Notification processor for ride reminders
6. **Containerization**: Docker-based deployment with orchestration

### Key Architectural Patterns

#### Backend Service Layer Architecture
The backend follows a layered architecture:
- **Routes** (`/src/routes/`): Express route handlers and middleware
- **Services** (`/src/services/`): Business logic and external API integrations
- **Types** (`/src/types/`): TypeScript type definitions
- **Utils** (`/src/utils/`): Shared utilities (JWT, validation, password hashing)
- **Middleware** (`/src/middleware/`): Authentication and validation middleware

#### Database Schema (Prisma)
Core entities and relationships:
- **Users**: Authentication, Strava integration, profile data
- **Rides**: Group cycling events with organizers and participants
- **Routes**: Imported Strava routes with polylines and elevation data
- **RSVPs**: Three-status system (going/maybe/not going) for ride participation
- **Notifications**: System notifications with scheduled delivery

#### Frontend Component Architecture
- **Pages** (`/src/pages/`): Route-level components
- **Components** (`/src/components/`): Reusable UI components
- **Services** (`/src/services/`): API communication layer
- **Context** (`/src/context/`): React context for global state (auth)
- **Types** (`/src/types/`): TypeScript interfaces matching backend

#### Authentication Flow
- JWT-based authentication with refresh token support
- Strava OAuth integration for route access
- Protected routes with role-based access control
- Token storage in localStorage with automatic refresh

#### Notification System
- Background processor runs as separate Docker container
- Scheduled notifications for ride reminders (24h before rides)
- Real-time notifications for ride updates, new participants, cancellations
- Persistent storage with read/unread status tracking

### Key Integrations

#### Strava API Integration
- OAuth 2.0 flow for user authorization
- Route import with elevation profiles and polylines
- Automatic route synchronization
- Map visualization using Leaflet.js

#### Database Operations
- Prisma ORM with type-safe queries
- Migration-based schema management
- Connection pooling and performance optimization
- Automated backups in production

### Development Workflow

#### Environment Configuration
- Development: `.env` file with local database
- Production: `.env.production` with secure secrets
- Docker Compose handles service orchestration
- Environment-specific database URLs and API endpoints

#### Code Quality Standards
- TypeScript for type safety across frontend and backend
- ESLint and Prettier for code formatting
- Zod schemas for runtime validation
- Comprehensive error handling and logging

#### Testing Strategy
- Jest configured for backend testing
- Test files should follow `*.test.ts` or `*.spec.ts` convention
- No existing test files - tests need to be implemented

#### Deployment Architecture
- Multi-container Docker setup with health checks
- Traefik reverse proxy with automatic SSL (production)
- Redis for caching and session storage
- Automated database migrations and backups
- Notification processor as background service

### Important Implementation Details

#### API Structure
All backend routes are prefixed with `/api` and organized by feature:
- `/api/auth/*` - Authentication and user management
- `/api/rides/*` - Ride CRUD operations and search
- `/api/routes/*` - Route management and search
- `/api/strava/*` - Strava integration endpoints
- `/api/notifications/*` - Notification management

#### Frontend State Management
- React Context for authentication state
- Local component state for UI interactions
- API layer abstracts HTTP communication
- Automatic token refresh and error handling

#### Data Validation
- Zod schemas for request validation on backend
- React Hook Form with Zod resolvers on frontend
- Type-safe communication between frontend and backend

#### Security Considerations
- Helmet.js for security headers
- CORS configured for specific origins
- Rate limiting on API endpoints
- bcrypt for password hashing
- Environment-based configuration management

### Troubleshooting Common Issues

1. **Database Connection**: Check `DATABASE_URL` and ensure PostgreSQL is running
2. **Strava Integration**: Verify `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` in environment
3. **Port Conflicts**: Default ports are 3000 (frontend), 5000 (backend), 5432 (database)
4. **Docker Issues**: Use `docker-compose ps` to check service health
5. **Migration Issues**: Run `npm run migrate` in backend directory

### Performance Considerations
- Database indexes on frequently queried fields
- Prisma query optimization with selective field loading
- Frontend lazy loading for route components
- Docker health checks and restart policies
- Redis caching for session management\

### Additional Context
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo .md file with a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
