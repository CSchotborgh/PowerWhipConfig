# Power Whip Configuration Tool

## Overview
This project is a full-stack web application designed for electrical engineers and technicians to configure and design custom electrical power whip assemblies. It offers a visual interface for design, validates configurations against electrical codes, and generates necessary documentation. The system aims to streamline the design process, ensure compliance, and provide robust documentation capabilities for power distribution systems. It integrates comprehensive component data and enables efficient order management and BOM generation.

**Current Project Status**: Successfully implemented complete **Extreme Excel Transformer** with DCN file processing capabilities. The system converts CERTUSOFT/Hornetsecurity DCN files into standardized OrderEntryResult format using expression-based transformation rules. Features include buffer-based file processing, multi-sheet analysis (Master, Packing Slip, Breaker Data), intelligent pattern recognition for L21-30R receptacles and LFMC conduit, and automated generation of 36 order entries with varying whip lengths (66-120ft). The transformer produces complete electrical specifications with auto-generated part numbers (PW66S-L2130RT-001SAL????), comprehensive column structure (60+ fields), and professional formatting. Added comprehensive documentation including visual diagrams, API documentation, and processing workflow guides. The DCN transformation feature is fully operational with <2 second processing times and OrderEntryResult output matching exact template specifications.

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
- **UI/UX Decisions**: Reorganized layout with dedicated header for navigation and export, secondary navigation for modules, Accordion interface for collapsible sections, custom technical color palette, dark/light theme support, responsive design, movable panel system with drag-and-drop functionality replacing fixed sidebars.
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
- **Excel Master Bubble Format Transformer**: Enhanced Excel processing with optimized speed and accuracy for receptacle data transformation.
- **Natural Language Processing**: Converts human specifications like "860 power whips total" into structured comma-delimited patterns with equal distribution logic.
- **Ultra-Fast Processing**: Optimized Excel parsing with 5-minute caching system reducing 95+ second processing times to under 5 seconds.
- **Pre-compiled Pattern Matching**: Lightning-fast receptacle identification using optimized regex patterns and category mapping.
- **Enhanced Field Mapping**: Accurate data extraction with smart categorization and comprehensive specification preservation.
- **Comprehensive Component Library**: 50+ electrical components including NEMA straight blade, twist-lock (L-series), three-phase configurations, California Standard, IEC connectors, protection devices, wire/cable, and junction boxes with detailed specifications and pricing.
- **Professional Basic Configurations**: 12 pre-built power whip configurations covering standard office, industrial twist-lock, three-phase, data center, outdoor GFCI, and arc fault protected applications with complete component integration and compliance validation.
- **Fast Transform Endpoint**: High-speed pattern processing with performance timing (<100ms for natural language, <50ms for comma-delimited).
- **Automated Row Expression System**: Generates expressions based on receptacle input patterns, auto-filling data from matched configurations.
- **Comprehensive Pattern Scanner**: Advanced multi-sheet Excel file analysis that scans ALL sheets (any names: Row-3, Row-4, Sheet1, etc.) for Receptacle IDs, Cable/Conduit Type IDs, Whip Length IDs, Tail Length IDs, and General Identifiers with complete duplicate pattern capture and transformed output generation. Processes around 800+ patterns including duplicates in reverse order.
- **Excel File Viewer & Editor**: Sophisticated analysis system with multi-sheet processing, pattern recognition, formula evaluation, and intelligent transformation capabilities.
- **Advanced Pattern Recognition**: Automated nomenclature standardization (e.g., "Pig tail/Pigtail/Whip Tail" → "Tail Length (ft)", "Source 1/2 length/Cable Length" → "Length (ft)").
- **Expression Analysis**: Formula complexity assessment, dependency tracking, categorization (calculation/lookup/validation/transformation), and reusable rule generation.
- **Instructions Scope Detection**: Automatic configuration scope analysis from instruction sheets including voltage, current, component count, and requirement extraction.
- **PreSal Format Transformation**: Intelligent conversion of any Excel format to standardized PreSal output with 50+ column structure and comprehensive component mapping.
- **Formula Library**: Categorized storage of Excel formulas with complexity analysis, dependency tracking, and searchable archive.
- **Pattern Recognition**: Automatic detection of formula sequences, calculation chains, and business logic patterns.
- **Electrical Calculations**: Voltage drop, thermal analysis, NEC compliance, component compatibility.
- **Mobile Responsiveness**: Touch-optimized AG-Grid interactions, responsive layouts, mobile-first design patterns, collapsible side panels.
- **Movable Panel System**: DraggablePanel components with resize handles, minimize/maximize functionality, PanelManager context for global state, FloatingComponentLibrary, PanelControls in header for easy management, complete freedom to position panels anywhere on screen instead of fixed sidebars.
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