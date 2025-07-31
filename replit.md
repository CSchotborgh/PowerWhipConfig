# Power Whip Configuration Tool

## Overview

This is a full-stack web application for designing and configuring electrical power whip assemblies. The system provides a visual interface for electrical engineers and technicians to design custom power connections, validate configurations against electrical codes, and generate documentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom technical color palette
- **State Management**: React Context API for configuration state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **Validation**: Zod schemas shared between client and server
- **Session Management**: Express sessions with PostgreSQL store

### Design Patterns
- **Monorepo Structure**: Shared schema and types between client/server
- **Component-Based UI**: Modular React components with clear separation of concerns
- **Repository Pattern**: Storage abstraction layer with in-memory fallback
- **Factory Pattern**: Component library system for electrical parts

## Key Components

### Database Schema (`shared/schema.ts`)
- **powerWhipConfigurations**: Main configuration entities with validation status
- **electricalComponents**: Component library with specifications and compatibility data
- Uses JSONB for flexible component specifications and wire connection data

### Frontend Components
- **ConfigurationTab**: Basic electrical parameter input (voltage, current, wire gauge)
- **VisualDesignTab**: Canvas tools for layout design
- **DocumentationTab**: Export and documentation generation
- **DesignCanvas**: Drag-and-drop interface for component placement
- **ComponentLibrary**: Categorized electrical component catalog
- **SpecificationPanel**: Real-time configuration analysis and validation

### Backend Services
- **Storage Layer**: Abstracted data access with memory and database implementations
- **Validation Engine**: Electrical code compliance checking
- **Component Management**: CRUD operations for electrical components

## Data Flow

1. **Configuration Creation**: User inputs basic electrical parameters
2. **Component Selection**: Components dragged from library to canvas
3. **Visual Design**: Components positioned and connected on canvas
4. **Real-time Validation**: Electrical calculations performed as changes are made
5. **Documentation Generation**: Export to PDF/XLSX with technical specifications

### State Management Flow
- Configuration state managed by React Context
- Server state cached with TanStack Query
- Form state handled by React Hook Form
- UI state local to components

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form state management
- **zod**: Runtime type validation

### Development Tools
- **Vite**: Build tool with HMR
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Server-side bundling

### Export Utilities
- **xlsx**: Excel file generation
- **jspdf**: PDF document creation
- **date-fns**: Date manipulation

## Deployment Strategy

### Development
- Vite dev server with Express API proxy
- Hot module replacement for fast iteration
- In-memory storage for development testing

### Production Build
- Client: Vite production build to `dist/public`
- Server: ESBuild bundle to `dist/index.js`
- Static file serving from Express

### Database Strategy
- Drizzle Kit for schema migrations
- PostgreSQL with Neon serverless hosting
- Connection pooling for production scalability

### Environment Configuration
- Database URL required for production
- Development mode detection for dev-only features
- Replit-specific integration for cloud development

## Technical Features

### Electrical Calculations
- Voltage drop calculations based on wire resistance
- Thermal analysis for current-carrying capacity
- Code compliance validation (NEC standards)
- Component compatibility checking

### Visual Design System
- Custom technical color palette for electrical interfaces
- Dark/light theme support with system preference detection
- Responsive design with mobile considerations
- Professional electrical schematic styling

### Data Validation
- Shared Zod schemas ensure type safety across stack
- Real-time form validation with user feedback
- Server-side validation for security
- Component specification validation