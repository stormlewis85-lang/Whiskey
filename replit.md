# replit.md

## Overview

This is a full-stack whiskey collection management application built with React, TypeScript, Express, and PostgreSQL. The app allows users to create accounts, manage their whiskey collections, write detailed reviews, and share their experiences with the community.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom whiskey-themed color palette
- **State Management**: TanStack Query for server state, React Context for auth
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based auth with PostgreSQL session store + token fallback
- **File Upload**: Multer for handling Excel imports and image uploads
- **API Design**: RESTful API with proper error handling

### Database Schema
- **Users**: Authentication and profile management
- **Whiskeys**: Core whiskey information with extended bourbon-specific fields
- **Reviews**: Detailed tasting notes with structured flavor profiles
- **Comments**: Community interaction on reviews
- **Likes**: Social features for reviews
- **Price Tracking**: Historical price data
- **Market Values**: Market valuation tracking

## Key Components

### Authentication System
- Dual authentication approach: sessions (primary) + tokens (fallback)
- Password hashing using Node.js scrypt
- Protected routes with authentication middleware
- User registration and login flows

### Whiskey Management
- CRUD operations for whiskey collection
- Advanced filtering and search capabilities
- Bourbon-specific categorization (mash bill, bottle type, cask strength)
- Image upload and management
- Excel import functionality for bulk data

### Review System
- Multi-page review form with structured inputs
- Visual assessment (color, clarity, viscosity)
- Aroma and flavor profiling with categorized options
- Radar chart visualization for flavor profiles
- Public/private review sharing
- Review commenting and liking system

### Data Visualization
- Collection statistics and analytics
- Price tracking charts
- Market value trends
- Review distribution analysis

## Data Flow

1. **User Authentication**: Login/register → session creation → token generation (if needed)
2. **Collection Management**: Add whiskey → store in database → update UI via React Query
3. **Review Process**: Multi-step form → validation → database storage → immediate UI update
4. **Community Features**: Public reviews → comments/likes → real-time updates
5. **Data Export**: Collection data → Excel/PDF generation → file download

## External Dependencies

### Core Libraries
- React ecosystem (React, React DOM, React Router alternative)
- TanStack Query for data fetching and caching
- Radix UI for accessible component primitives
- Tailwind CSS for styling
- Zod for schema validation
- React Hook Form for form management

### Backend Dependencies
- Express.js for server framework
- Drizzle ORM for database operations
- Neon serverless PostgreSQL client
- Multer for file uploads
- Express session for authentication
- Nanoid for unique ID generation

### Development Tools
- Vite for build tooling
- TypeScript for type safety
- ESBuild for server bundling
- Replit plugins for development environment

## Deployment Strategy

### Build Process
1. Frontend: Vite builds React app to `dist/public`
2. Backend: ESBuild bundles server code to `dist/index.js`
3. Database: Drizzle migrations handle schema changes

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment setting (development/production)

### File Structure
```
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types and schemas
├── uploads/          # File upload storage
├── migrations/       # Database migrations
└── dist/            # Build output
```

## Changelog

Changelog:
- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.