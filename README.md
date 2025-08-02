# LFG Cycling App 🚴‍♀️

**Looking for Group (LFG) Cycling** - A modern web application that connects cyclists to organize and discover group rides. Built with React, Node.js, and integrated with Strava for route management.

![LFG Cycling App](https://img.shields.io/badge/Status-Production%20Ready-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.2-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## ✨ Features

### 🚴‍♂️ Core Functionality
- **Create & Organize Rides**: Plan group rides with date, time, location, pace, and participant limits
- **Discover Rides**: Browse public rides with advanced filtering and search capabilities
- **RSVP System**: Three-status RSVP system (Going/Maybe/Not Going) with real-time updates
- **Strava Integration**: Import routes directly from Strava with elevation profiles and map visualization

### 👥 User Experience
- **User Dashboard**: Comprehensive view of organized and joined rides with statistics
- **Real-time Notifications**: Get notified about ride updates, new participants, and reminders
- **Mobile Responsive**: Fully optimized for mobile devices with intuitive navigation
- **Interactive Maps**: Leaflet.js integration for route visualization with start/end markers

### 🔐 Security & Performance
- **JWT Authentication**: Secure user authentication with bcrypt password hashing
- **Protected Routes**: Role-based access control for sensitive operations
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation with Zod schemas

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **React Router** for client-side navigation
- **Date-fns** for date manipulation
- **Leaflet.js** for interactive maps

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL database
- **JWT** for authentication
- **Zod** for validation
- **Axios** for HTTP requests

### DevOps & Deployment
- **Docker & Docker Compose** for containerization
- **Traefik** for reverse proxy and SSL certificates
- **PostgreSQL 15** for data persistence
- **Redis** for caching and sessions
- **Automated backups** and health checks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- [Strava API Application](https://developers.strava.com/)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd lfg-cycling-app
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

Required environment variables:
```env
DB_PASSWORD=your_secure_database_password
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
```

### 3. Start the Application
```bash
# Start all services
./deploy.sh start

# Or manually with Docker Compose
docker-compose up -d
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Database**: PostgreSQL on port 5432

## 📖 Documentation

### Development
- [API Documentation](./backend/README.md) - Backend API endpoints and development guide
- [Frontend Guide](./frontend/README.md) - React app structure and component documentation
- [Database Schema](./database-schema.sql) - Complete database structure

### Deployment
- [Deployment Guide](./DEPLOYMENT.md) - Complete production deployment instructions
- [Docker Setup](./docker-compose.yml) - Container orchestration configuration
- [Environment Configuration](./.env.example) - Environment variables reference

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │────│   Load Balancer │────│     Backend     │
│   (React SPA)   │    │    (Traefik)    │    │   (Node.js)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────────────────────┼─────────────────┐
                       │                                 │                 │
              ┌─────────────────┐              ┌─────────────────┐ ┌─────────────────┐
              │                 │              │                 │ │                 │
              │   PostgreSQL    │              │     Redis       │ │   Notification  │
              │   (Database)    │              │   (Caching)     │ │   Processor     │
              │                 │              │                 │ │                 │
              └─────────────────┘              └─────────────────┘ └─────────────────┘
```

### Key Components

1. **Frontend (React)**: Single-page application with responsive design
2. **Backend (Node.js)**: RESTful API with authentication and business logic
3. **Database (PostgreSQL)**: Relational database for persistent data storage
4. **Cache (Redis)**: Session storage and performance optimization
5. **Reverse Proxy (Traefik)**: Load balancing, SSL termination, and routing
6. **Notification Processor**: Background service for ride reminders and updates

## 🔧 Development

### Local Development Setup

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

2. **Database Setup**
   ```bash
   # Start PostgreSQL
   docker-compose up postgres -d
   
   # Run migrations
   cd backend && npm run migrate
   ```

3. **Start Development Servers**
   ```bash
   # Backend (Terminal 1)
   cd backend && npm run dev
   
   # Frontend (Terminal 2)
   cd frontend && npm run dev
   ```

### Available Scripts

**Backend:**
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run migrate      # Run database migrations
npm run test         # Run test suite
npm run lint         # Run ESLint
```

**Frontend:**
```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing

```bash
# Backend tests
cd backend && npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 🗃️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts with Strava integration
- **Rides**: Group ride events with organizers
- **Routes**: Imported Strava routes with polylines
- **RSVPs**: User responses to ride invitations
- **Notifications**: System notifications and reminders

See [database-schema.sql](./database-schema.sql) for the complete schema.

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Rides
- `GET /api/rides` - List public rides
- `POST /api/rides` - Create new ride
- `GET /api/rides/:id` - Get ride details
- `PUT /api/rides/:id` - Update ride
- `DELETE /api/rides/:id` - Delete ride

### RSVPs
- `POST /api/rides/:id/rsvp` - RSVP to ride
- `GET /api/rides/:id/rsvps` - Get ride participants

### Strava Integration
- `GET /api/strava/auth` - Initiate Strava OAuth
- `GET /api/strava/callback` - Handle OAuth callback
- `GET /api/strava/routes` - Get user's Strava routes

See the [API Documentation](./backend/README.md) for complete endpoint details.

## 🚀 Deployment

### Production Deployment

1. **Server Requirements**
   - Ubuntu 20.04+ or similar
   - Docker and Docker Compose
   - Domain name with DNS configured
   - 2GB+ RAM, 20GB+ storage

2. **Quick Production Deploy**
   ```bash
   # Clone and configure
   git clone <repository-url>
   cd lfg-cycling-app
   cp .env.production.example .env.production
   
   # Edit production environment
   nano .env.production
   
   # Deploy
   ./deploy.sh -e production start
   ```

3. **SSL and Domain Setup**
   - Configure DNS A records for your domain
   - Traefik automatically handles Let's Encrypt SSL certificates
   - Access your app at https://yourdomain.com

See the complete [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DB_PASSWORD` | PostgreSQL password | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `STRAVA_CLIENT_ID` | Strava API client ID | ✅ |
| `STRAVA_CLIENT_SECRET` | Strava API client secret | ✅ |
| `DOMAIN` | Production domain name | Production only |
| `FRONTEND_URL` | Frontend URL | ✅ |
| `REDIS_PASSWORD` | Redis password | Production only |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run the test suite**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure all tests pass before submitting
- Update documentation for API changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Strava** for providing the excellent API for route data
- **Leaflet** community for the mapping library
- **Tailwind CSS** for the utility-first CSS framework
- **Prisma** team for the excellent ORM
- The open-source community for the amazing tools and libraries

## 📞 Support

- **Documentation**: Check our [guides](./DEPLOYMENT.md) and [API docs](./backend/README.md)
- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🗺️ Roadmap

### Planned Features
- [ ] Mobile app (React Native)
- [ ] Real-time chat during rides
- [ ] Ride statistics and analytics
- [ ] Social features (follow riders)
- [ ] Integration with other fitness platforms
- [ ] Advanced route planning tools
- [ ] Weather integration
- [ ] Group challenges and leaderboards

### Recent Updates
- ✅ Notification system with ride reminders
- ✅ Mobile-responsive design
- ✅ Docker-based deployment
- ✅ Strava route import with map visualization
- ✅ Comprehensive RSVP system
- ✅ User dashboard with statistics

---

**Happy Cycling! 🚴‍♀️🚴‍♂️**

Made with ❤️ by the LFG Cycling team