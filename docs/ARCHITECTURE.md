# System Architecture Documentation

## Overview
The Power Whip Configuration Tool is built with a modern full-stack architecture designed for electrical engineering applications, with specialized focus on DCN file transformation and order processing.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│ (PostgreSQL)    │
│                 │    │                 │    │                 │
│ • UI Components │    │ • API Routes    │    │ • Configurations│
│ • State Mgmt    │    │ • File Processing│    │ • Components    │  
│ • Excel Upload  │    │ • Pattern Engine│    │ • Formulas      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Component Hierarchy
```
App
├── Router (Wouter)
├── ThemeProvider
├── QueryClient Provider
│
├── Pages/
│   ├── Dashboard
│   ├── ConfiguratorPage
│   ├── ExtremeTransformerInterface
│   └── ExcelViewerEditor
│
├── Components/
│   ├── UI (shadcn/ui)
│   │   ├── Button, Input, Dialog
│   │   ├── Table, Card, Accordion  
│   │   └── Form, Select, Toast
│   │
│   ├── Domain Specific
│   │   ├── DraggablePanel
│   │   ├── ComponentLibrary
│   │   ├── DesignCanvas
│   │   └── ExcelFileViewerEditor
│   │
│   └── Feature Modules
│       ├── ObjectUploader
│       ├── PatternParser
│       └── ExtremeTransformer
```

### State Management
- **TanStack Query**: Server state management and caching
- **React Context**: Global UI state (theme, panels)
- **React Hook Form**: Form state with Zod validation
- **Local Storage**: User preferences and session data

### Data Flow
```
User Action → Component → Hook/Query → API Request → Backend Processing → Database → Response → Update UI
```

## Backend Architecture

### API Structure
```
/api/
├── /components          # Component CRUD operations
├── /configurations      # Power whip configurations  
├── /excel/
│   ├── /analyze-patterns    # Pattern recognition
│   ├── /transform          # Standard transformation
│   ├── /extreme-transform  # DCN transformation
│   └── /natural-language   # NL pattern parsing
└── /storage            # File management
```

### Core Modules

#### 1. ExtremeExcelTransformer
```javascript
class ExtremeExcelTransformer {
  // Primary transformation engine
  async transformToSALConfiguratorFromBuffer(buffer, filename)
  
  // Multi-sheet analysis  
  private analyzeSourceFileFromBuffer(buffer, filename)
  
  // Pattern extraction
  private extractDCNPatterns(analysis)
  private extractMultipleWhipLengths(analysis)
  
  // Rule application
  private applyExpressionRules(pattern, rules, lineNumber)
  
  // Output generation
  private generateOutputFile(data, structure)
}
```

#### 2. MultiSheetProcessor  
```javascript
class MultiSheetProcessor {
  // Excel file analysis across multiple sheets
  processAllSheets(workbook)
  
  // Pattern identification
  identifyPatterns(sheetData)
  
  // Data standardization  
  standardizeNomenclature(rawData)
}
```

#### 3. ReceptaclePatternParser
```javascript
class ReceptaclePatternParser {
  // Natural language processing
  parseNaturalLanguageInput(text)
  
  // Pattern matching
  matchReceptaclePatterns(input)
  
  // Specification extraction
  extractElectricalSpecs(pattern)
}
```

### File Processing Pipeline

```
Input File Buffer
       ↓
[XLSX.read(buffer)] 
       ↓
Sheet Analysis
       ↓  
Pattern Recognition
       ↓
Expression Rules Engine  
       ↓
Data Transformation
       ↓
Output Generation
       ↓
File Download Stream
```

## Database Schema

### Core Tables
```sql
-- Power whip configurations
powerWhipConfigurations
├── id (uuid)
├── name (text)
├── specifications (jsonb)
├── components (jsonb[])
├── validationResults (jsonb)
└── timestamps

-- Electrical components  
electricalComponents
├── id (uuid) 
├── name (text)
├── type (enum)
├── category (text)
├── specifications (jsonb)
├── pricing (jsonb)
└── metadata (jsonb)

-- Excel analysis data
excelFormulaLibrary
├── id (uuid)
├── formula (text) 
├── category (text)
├── complexity (integer)
├── dependencies (text[])
└── metadata (jsonb)

excelPatternLibrary  
├── id (uuid)
├── pattern (text)
├── type (enum)
├── frequency (integer)
├── examples (jsonb)
└── transformationRules (jsonb)
```

### Relationships
```
powerWhipConfigurations 1→N electricalComponents
electricalComponents 1→N specifications  
excelPatterns 1→N transformationRules
```

## Processing Engines

### 1. Pattern Recognition Engine
```
Input: Excel sheet data
Process:
  1. Scan for known patterns (receptacles, conduits)
  2. Extract numerical values (lengths, ratings)
  3. Identify relationships between data points
  4. Generate pattern confidence scores
Output: Structured pattern objects
```

### 2. Expression Rules Engine  
```
Input: Pattern objects + Requirements rules
Process:
  1. Load expression rules (Yes/No logic)
  2. Apply field inclusion/exclusion rules
  3. Generate calculated fields 
  4. Validate electrical specifications
Output: Transformed data rows
```

### 3. Part Number Generator
```
Input: Electrical specifications
Process:
  1. Parse component type (receptacle, conduit)
  2. Extract key parameters (voltage, length)
  3. Apply naming conventions
  4. Generate sequential numbering
Output: Standardized part numbers
```

## Security Architecture

### File Upload Security
- **Buffer-only processing**: No files written to disk
- **MIME type validation**: Strict Excel format checking
- **Size limits**: 200MB maximum file size
- **Memory management**: Automatic cleanup after processing

### API Security
- **Input validation**: Zod schemas for all requests
- **Error handling**: Sanitized error messages
- **Rate limiting**: Upload frequency controls
- **CORS configuration**: Restricted origin access

## Performance Optimizations

### Frontend
- **Code splitting**: Route-based lazy loading
- **Virtual scrolling**: Large dataset handling (react-window)
- **Memoization**: Expensive calculations cached
- **Query caching**: TanStack Query with 5-minute cache

### Backend  
- **Buffer processing**: In-memory file handling
- **Pattern caching**: Pre-compiled regex patterns
- **Stream processing**: Large file handling
- **Connection pooling**: Database optimization

### Database
- **JSONB indexing**: Fast specification queries
- **Partial indexes**: Filtered performance
- **Connection pooling**: Neon serverless scaling
- **Query optimization**: Drizzle ORM efficiency

## Deployment Architecture

### Development
```
Local Environment
├── Vite Dev Server (Frontend)
├── Node.js Express (Backend)  
├── PostgreSQL (Local/Neon)
└── File System (Temp storage)
```

### Production (Replit)
```
Replit Container
├── Vite Build (Static assets)
├── Express Server (API)
├── Neon PostgreSQL (Cloud)
└── Memory-only processing
```

## Monitoring & Observability

### Logging
- **Structured logging**: JSON format with timestamps
- **Processing metrics**: File size, processing time
- **Error tracking**: Detailed error context
- **Performance monitoring**: Response times

### Health Checks
- **Database connectivity**: Connection status
- **Memory usage**: Buffer processing limits
- **API responsiveness**: Endpoint health
- **File processing**: Transformation success rates

## Scalability Considerations

### Horizontal Scaling
- **Stateless design**: No server-side sessions
- **Database pooling**: Connection management
- **File processing**: Memory-only (no shared storage)
- **API design**: RESTful, cacheable responses

### Vertical Scaling  
- **Memory optimization**: Efficient buffer handling
- **CPU optimization**: Pattern matching algorithms
- **I/O optimization**: Database query efficiency
- **Network optimization**: Response compression

## Technology Stack Details

### Frontend Dependencies
```json
{
  "react": "^18.x",
  "typescript": "^5.x", 
  "vite": "^4.x",
  "@tanstack/react-query": "^4.x",
  "@radix-ui/react-*": "^1.x",
  "tailwindcss": "^3.x",
  "wouter": "^2.x"
}
```

### Backend Dependencies  
```json
{
  "express": "^4.x",
  "drizzle-orm": "^0.28.x",
  "@neondatabase/serverless": "^0.6.x",
  "xlsx": "^0.18.x",
  "zod": "^3.x",
  "multer": "^1.x"
}
```

### Build Tools
- **Vite**: Frontend bundling and dev server
- **TypeScript**: Type safety across stack  
- **ESBuild**: Fast compilation
- **Tailwind**: Utility-first CSS
- **Drizzle Kit**: Database migrations