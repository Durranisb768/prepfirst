# Educational Management System

## Overview

An educational management web application with hierarchical content organization (Subjects → Topics → Materials) featuring role-based authentication (student vs admin), complete CRUD operations for content management, and an admin control panel with activity monitoring. Uses PostgreSQL database via Replit Database and Replit Auth for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 19 with TypeScript, using Wouter for client-side routing.

**UI Component System**: Shadcn UI (New York style variant) built on Radix UI primitives, providing accessible components including forms, dialogs, cards, and navigation elements.

**Styling Approach**: Tailwind CSS with custom design tokens defined in CSS variables (HSL color space), supporting light/dark themes.

**State Management**: TanStack Query (React Query) v5 for server state management with automatic caching and synchronization.

**Form Handling**: React Hook Form with Zod schema validation via @hookform/resolvers.

**Build System**: Vite for development server and production builds.

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript, structured as a REST API.

**Authentication**: Replit Auth integration with session-based authentication and role-based access control (student/admin roles).

**API Design**: RESTful endpoints organized by domain:
- `/api/auth/*` - Authentication endpoints (login, logout, user info)
- `/api/catalog/*` - Public catalog endpoints for browsing subjects, topics, materials
- `/api/admin/*` - Admin-only CRUD endpoints for content management
- `/api/admin/activity-logs` - Activity monitoring for admin panel

**Database**: PostgreSQL via Replit Database with Drizzle ORM.

**Storage Layer**: DatabaseStorage implementation in server/storage.ts with CRUD operations for all entities.

### Data Model

**Hierarchical Content Structure**:
- **Subjects**: Top-level categories (e.g., "History", "Economics")
- **Topics**: Sub-categories within subjects
- **Materials**: Individual content items with types (Book, PastPaper, Essay, MCQ, Theory)

**User System**:
- Users with roles (student/admin)
- Activity logging for admin actions

## Key Files

- `shared/schema.ts` - Database schema and Zod types for all entities
- `server/routes.ts` - API route definitions with auth middleware
- `server/storage.ts` - DatabaseStorage class with all CRUD operations
- `server/db.ts` - Database connection setup
- `server/replit_integrations/auth/index.ts` - Replit Auth integration
- `client/src/App.tsx` - Main app with routing and auth context
- `client/src/pages/dashboard.tsx` - Main dashboard for browsing content
- `client/src/pages/admin-panel.tsx` - Admin control panel
- `client/src/pages/landing-page.tsx` - Public landing page

## External Dependencies

### Core Services
- **Replit Auth**: Primary authentication via OpenID Connect
- **PostgreSQL Database**: Replit-managed database for data persistence

### UI Component Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Framer Motion**: Animations

### Development Tools
- **Vite**: Development server with HMR
- **Drizzle ORM**: Type-safe database queries
- **Drizzle Kit**: Database migrations

## Recent Changes

- Migrated from in-memory storage to PostgreSQL database
- Integrated Replit Auth for user authentication
- Built complete hierarchical content management (Subjects → Topics → Materials)
- Implemented admin panel with activity monitoring
- Added role-based access control (student/admin)
