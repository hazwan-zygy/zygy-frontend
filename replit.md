# PDF Search Tool

## Overview

This is a full-stack PDF search application built with React, Express, and TypeScript. The application allows users to upload PDF documents, search through their content, and view search results with highlighting and navigation features. It features a responsive design that works on both desktop and mobile devices.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Mobile Support**: Custom hooks for responsive design with mobile-first approach

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **File Upload**: Multer for handling multipart/form-data
- **Schema Validation**: Zod for type-safe data validation
- **Development**: Hot reload with Vite integration

### Build System
- **Development**: Vite dev server with Express backend
- **Production**: ESBuild for server bundling, Vite for client bundling
- **TypeScript**: Strict mode enabled with path mapping

## Key Components

### Database Schema
- **PDF Documents**: Stores metadata including filename, size, pages, and extracted text content
- **Search Results**: Caches search results with query and document relationships
- **Migrations**: Drizzle Kit for schema management

### PDF Processing
- File upload limited to 10MB PDF files only
- Text extraction and indexing for search functionality
- Metadata extraction (pages, file size, etc.)

### Search System
- Full-text search through PDF content
- Search options: case sensitivity, whole words matching
- Result highlighting with context preview
- Navigation between search results

### UI Components
- **PDF Viewer**: Drag-and-drop upload with file preview
- **Search Interface**: Desktop search panel with advanced options
- **Mobile Search Overlay**: Full-screen search interface for mobile
- **Responsive Design**: Automatic mobile/desktop detection

## Data Flow

1. **File Upload**: Users drag/drop or select PDF files
2. **Processing**: Server extracts text content and metadata
3. **Storage**: Document info stored in PostgreSQL, files in memory
4. **Search**: Client sends search queries to server
5. **Results**: Server performs text search and returns highlighted results
6. **Navigation**: Users can navigate through search results with page jumping

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database queries
- **multer**: File upload handling
- **@tanstack/react-query**: Server state management
- **wouter**: Client-side routing

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Type-safe CSS variants

### Development Dependencies
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment setting (development/production)

### Build Process
1. Client build: Vite bundles React app to `dist/public`
2. Server build: ESBuild bundles Express server to `dist/index.js`
3. Static files served from built client directory

### Database Setup
- Drizzle migrations in `./migrations` directory
- Schema defined in `shared/schema.ts`
- Push schema changes with `npm run db:push`

### Storage Strategy
- Currently using in-memory storage for development
- Database schema prepared for PostgreSQL deployment
- File storage can be extended to cloud storage services

## Changelog

```
Changelog:
- July 04, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```