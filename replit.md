# Power Whip Configuration Tool

## Overview
This project is a full-stack web application designed for electrical engineers and technicians to configure and design custom electrical power whip assemblies. It offers a visual interface for design, validates configurations against electrical codes, and generates necessary documentation. The system aims to streamline the design process, ensure compliance, and provide robust documentation capabilities for power distribution systems. It integrates comprehensive component data and enables efficient order management and BOM generation.

## Recent Changes (August 2025)
- **Performance Optimization**: Parse Data processing optimized from sluggish performance to 2ms response time
- **Export Functionality Restored**: Fixed missing Export to Master Bubble Format button and API functionality
- **Quantity-Based Pattern Processing**: Implemented exclamation mark delimiter syntax for generating multiple identical rows (e.g., "CS8269A, LMZC, 20, 10, Red !43" generates exactly 43 rows)
- **File Processing Optimization**: Streamlined Excel file handling to prevent server timeouts and improve responsiveness
- **UI/UX Improvements**: Added proper export button in Processing Results section with loading states and toast notifications

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom technical color palette
- **State Management**: React Context API (configuration), TanStack Query (server state)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **UI/UX Decisions**: Reorganized layout with dedicated header for navigation and export, secondary navigation for modules, Accordion interface for collapsible sections, custom technical color palette, dark/light theme support, responsive design.
- **Visual Design System**: Drag-and-drop DesignCanvas, AG-Grid for order entry, Excel-like interface with VB Script and API capabilities, and a Configurator Model Dataset analyzer.

### Backend
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon serverless PostgreSQL
- **Validation**: Zod schemas (shared with frontend)
- **Session Management**: Express sessions with PostgreSQL store

### Design Patterns
- **Monorepo Structure**: Shared schema and types for client/server.
- **Component-Based UI**: Modular React components.
- **Repository Pattern**: Storage abstraction.
- **Factory Pattern**: Component library system.

### Core Features & Technical Implementations
- **Data Schema**: `powerWhipConfigurations`, `electricalComponents`, `excelFormulaLibrary`, `excelPatternLibrary`, and `excelFileArchive` using JSONB for flexibility.
- **Formula Extraction Engine**: Advanced Excel formula parsing with category classification and complexity analysis.
- **Pattern Recognition System**: Automated detection of repeating patterns and formula sequences in Excel files.
- **Validation Engine**: Electrical code compliance checking.
- **Excel Data Integration**: Parsing of `.xlsx` files for component data, order entry, and BOM generation.
- **Performance Optimization**: Virtualized rendering (react-window), intelligent caching, pre-processed text indexing, memoization.
- **Automated Row Expression System**: Generates expressions based on receptacle input patterns, auto-filling data from matched configurations.
- **Excel Formula Archive System**: Advanced formula extraction, pattern recognition, and reusable library building from uploaded Excel files.
- **Formula Library**: Categorized storage of Excel formulas with complexity analysis, dependency tracking, and searchable archive.
- **Pattern Recognition**: Automatic detection of formula sequences, calculation chains, and business logic patterns.
- **Electrical Calculations**: Voltage drop, thermal analysis, NEC compliance, component compatibility.
- **Mobile Responsiveness**: Touch-optimized AG-Grid interactions, responsive layouts, mobile-first design patterns, collapsible side panels.
- **Loading Experience**: Professional loading screen with progressive indicators and feature highlights.
- **Deployment Strategy**: Vite/ESBuild for production builds, Neon serverless for PostgreSQL, Drizzle Kit for migrations.

## External Dependencies

### Core
- `@neondatabase/serverless`: PostgreSQL connection.
- `drizzle-orm`: Type-safe database ORM.
- `@tanstack/react-query`: Server state management.
- `@radix-ui/*`: Accessible UI primitives.
- `react-hook-form`: Form state management.
- `zod`: Runtime type validation.

### Development Tools
- `Vite`: Build tool.
- `TypeScript`: Static type checking.
- `Tailwind CSS`: Utility-first styling.
- `ESBuild`: Server-side bundling.

### Export Utilities
- `xlsx`: Excel file generation.
- `jspdf`: PDF document creation.
- `date-fns`: Date manipulation.