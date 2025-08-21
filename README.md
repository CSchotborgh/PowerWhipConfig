# ⚡ Power Whip Configuration Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg)](https://vitejs.dev/)

> **A next-generation electrical engineering platform** designed for professionals to configure, design, validate, and document custom electrical power whip assemblies with AI-powered pattern recognition, real-time NEC compliance validation, and comprehensive Excel integration.

![Power Whip Configuration Tool](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=⚡+Power+Whip+Configuration+Tool+⚡)

---

## 🚀 Revolutionary Features

### 🎯 **Smart Movable Panel System**
- **Complete UI Freedom**: Drag panels anywhere on screen, resize to fit your workflow
- **Professional Layout**: Replace fixed sidebars with intelligent floating interfaces  
- **Context-Aware Panels**: Each panel remembers position and adapts to content
- **Multi-Monitor Support**: Spread panels across multiple displays

### 🧠 **AI-Powered Pattern Recognition**
- **Natural Language Processing**: Convert "860 power whips total" into structured patterns
- **Multi-Sheet Analysis**: Scan all Excel sheets regardless of naming conventions
- **Pattern Deduplication**: Intelligent handling of 800+ patterns with reverse-order processing
- **Smart Component Mapping**: Automatic NEMA, IEC, L-series connector identification

### ⚡ **Live NEC Compliance Validation**
- **Real-Time Calculations**: Voltage drop, thermal analysis, ampacity checking
- **Three Validation Modes**: Live, Static Display, or Hidden
- **Code Compliance**: Automatic NEC standard verification
- **Safety Margins**: Temperature and electrical safety analysis

### 🎨 **Visual Design Canvas** 
- **Intelligent Export**: 150px proximity grouping with connector/receptacle priority
- **Spatial Parsing**: Convert 2D layouts to structured order entry format
- **PreSal Compatibility**: Professional 50+ column export structure
- **Undo/Redo System**: Complete design history with keyboard shortcuts

### 🔧 **Dynamic Component Library**
- **Live Specification Editing**: Click any field to edit (voltage, current, wire gauge, price)
- **Contextual Permissions**: Different edit capabilities by component type
- **Automatic Variant Creation**: Each edit creates permanent new components
- **50+ Components**: NEMA, IEC, L-series, protection devices, wire/cable

### 📊 **Professional Order Entry**
- **Three Interface Options**: Standard, Performance (virtualized), AG-Grid
- **Excel-Like Experience**: Copy/paste, cell editing, filtering, sorting
- **Floating Panel Access**: No redundant interfaces, single optimized workflow
- **Export Integration**: Generate professional documentation packages

### 🚄 **Ultra-Fast Performance**
- **Excel Processing**: <5 seconds cached, <100ms natural language, <50ms patterns
- **Design Canvas Export**: Optimized from 11+ seconds to 31ms
- **Virtualized Rendering**: Handle 1000+ components smoothly
- **Intelligent Caching**: 5-minute Excel parsing cache system

---

## 🏗️ System Architecture

### Frontend Stack
```
React 18 + TypeScript
├── UI Framework: shadcn/ui (Radix UI)
├── Styling: Tailwind CSS
├── State Management: TanStack Query + React Context
├── Routing: Wouter
├── Forms: React Hook Form + Zod
└── Build Tool: Vite
```

### Backend Stack
```
Node.js + Express.js
├── Database: PostgreSQL (Neon Serverless)
├── ORM: Drizzle ORM
├── Validation: Zod Schemas
├── Session: Express Sessions
└── File Processing: xlsx, papaparse
```

### Database Schema
```sql
powerWhipConfigurations  -- Main configurations
├── electricalComponents -- Component library
├── excelFormulaLibrary  -- Reusable Excel formulas
├── excelPatternLibrary  -- Pattern recognition data
├── excelFileArchive     -- Uploaded file metadata
└── componentDataSources -- Multi-source data integration
```

---

## 📊 System Architecture Diagrams

### 🎯 **Movable Panel System Architecture**

```mermaid
graph TB
    subgraph "Header Controls"
        HC[Panel Controls] --> CL[Component Library]
        HC --> CD[Configuration Details]
        HC --> ET[Excel Transformer]
        HC --> SA[Specifications & Analysis]
        HC --> OE[Order Entry]
        HC --> VP[Validation Panel]
    end
    
    subgraph "Floating Panel Manager"
        PM[Panel Manager Context] --> DP[Draggable Panel]
        DP --> RS[Resize System]
        DP --> PS[Position State]
        DP --> MM[Minimize/Maximize]
    end
    
    subgraph "Panel Interactions"
        CL --> DC[Design Canvas]
        ET --> PR[Pattern Recognition]
        OE --> AG[AG-Grid Interface]
        VP --> NEC[NEC Validation]
    end
    
    HC --> PM
    PM --> DC
```

### 🧠 **AI Pattern Recognition Flow**

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Upload Interface
    participant MS as Multi-Sheet Scanner
    participant PR as Pattern Recognition
    participant NLP as Natural Language Processor
    participant DB as Component Database
    participant EX as Export Engine
    
    U->>UI: Upload Excel File / Enter Text
    UI->>MS: Scan All Sheets
    MS->>MS: Identify Sheet Types (Row-3, Sheet1, etc.)
    MS->>PR: Extract Patterns
    
    par Pattern Analysis
        PR->>PR: NEMA Recognition (460C9W, L6-30R)
        PR->>PR: IEC Detection (CS8269A series)
        PR->>PR: Cable/Conduit Mapping (MMC, FMC, SO)
        PR->>PR: Length Identification
    and Natural Language
        PR->>NLP: "860 power whips total"
        NLP->>NLP: Parse Quantities & Distribution
        NLP->>NLP: Generate Structured Patterns
    end
    
    PR->>DB: Query Component Specifications
    DB-->>PR: Return Matched Components
    PR->>EX: Generate Transformed Output
    EX-->>U: Structured Order Entry Format
```

### ⚡ **Live Validation Architecture**

```mermaid
graph LR
    subgraph "Validation Engine"
        VE[Validation Engine] --> VD[Voltage Drop Calculator]
        VE --> TA[Thermal Analysis]
        VE --> AC[Ampacity Calculator]
        VE --> NEC[NEC Compliance Checker]
    end
    
    subgraph "Data Sources"
        CL[Component Library] --> VE
        DC[Design Canvas] --> VE
        OE[Order Entry] --> VE
        CF[Configuration Form] --> VE
    end
    
    subgraph "Validation Modes"
        VE --> LV[Live Mode: Real-time calculations]
        VE --> SV[Static Mode: Cached results]
        VE --> HV[Hidden Mode: Background processing]
    end
    
    subgraph "Results Display"
        LV --> SUCCESS[✓ Green: Compliant]
        LV --> WARNING[⚠ Yellow: Marginal]
        LV --> ERROR[✗ Red: Code Violation]
    end
```

### 🎨 **Design Canvas Export Intelligence**

```mermaid
flowchart TD
    DC[Design Canvas] --> SA[Spatial Analysis]
    SA --> CD[Component Detection]
    SA --> PG[Proximity Grouping: 150px threshold]
    SA --> PR[Priority Rules: Connectors trigger rows]
    
    CD --> SM[Specification Mapping]
    PG --> GR[Group Relationships]  
    PR --> LO[Logical Ordering]
    
    SM --> PS[PreSal Structure]
    GR --> PS
    LO --> PS
    
    PS --> C1[Column 1-10: Basic Info]
    PS --> C2[Column 11-20: Specifications]
    PS --> C3[Column 21-30: Electrical Data]
    PS --> C4[Column 31-40: Physical Data]
    PS --> C5[Column 41-50: Compliance Data]
    
    C1 --> EX[XLSX Export: 31ms]
    C2 --> EX
    C3 --> EX
    C4 --> EX
    C5 --> EX
    
    EX --> S1[Sheet 1: Order Entry]
    EX --> S2[Sheet 2: Components]
    EX --> S3[Sheet 3: Specifications]
    EX --> S4[Sheet 4: Compliance]
    EX --> S5[Sheet 5: Summary]
```

---

## 🔄 Advanced Workflow Diagrams

### 🔧 **Live Component Editing Workflow**

```mermaid
sequenceDiagram
    participant U as User
    participant CL as Component Library
    participant ED as Edit Dialog
    participant VS as Validation System
    participant API as Backend API
    participant DB as Database
    
    U->>CL: Click Editable Field (Voltage Badge)
    CL->>ED: Show Inline Editor
    U->>ED: Change Value (125V → 240V)
    ED->>VS: Validate New Specification
    
    alt Validation Success
        VS-->>ED: ✓ Valid Configuration
        ED->>API: POST /api/components (Create Variant)
        API->>DB: Insert New Component
        DB-->>API: New Component ID
        API-->>ED: Success Response
        ED->>CL: Update Library Display
        CL->>CL: Show New Component Variant
        ED-->>U: ✓ Component Created
    else Validation Failed  
        VS-->>ED: ✗ Invalid Configuration
        ED-->>U: ⚠ Show Error Message
    end
```

**Contextual Editing Permissions:**
| Component Type | Name | Voltage | Current | Wire Gauge | Price | Special Rules |
|---|---|---|---|---|---|---|
| **NEMA Connectors** | ✓ | ✓ | ✓ | ✓ | ✓ | Full specification control |
| **IEC Pin & Sleeve** | ✓ | ✓ | ✓ | ✓ | ✓ | International standards |
| **Protection Devices** | ✗ | ✓ | ✓ | ✗ | ✓ | Electrical parameters only |
| **Wire & Cable** | ✗ | ✗ | ✗ | ✓ | ✓ | Gauge and pricing |
| **Junction Boxes** | ✗ | ✗ | ✗ | ✗ | ✓ | Price management only |

### 🎨 **Design Canvas Spatial Intelligence**

```mermaid
flowchart LR
    subgraph "Component Placement"
        CP[Component Placed] --> SC[Store Coordinates]
        SC --> PA[Proximity Analysis]
        PA --> RD[Relationship Detection]
    end
    
    subgraph "Grouping Algorithm"
        RD --> PG{Within 150px?}
        PG -->|Yes| CG[Create Group]
        PG -->|No| IG[Individual Component]
        CG --> PR{Contains Connector?}
        PR -->|Yes| NR[New Row Priority]
        PR -->|No| SR[Same Row Group]
    end
    
    subgraph "Export Structure"
        NR --> R1[Row 1: Primary Group]
        SR --> R1
        IG --> R2[Row 2: Secondary Items]
        R1 --> ES[Export Structure]
        R2 --> ES
        ES --> OE[Order Entry Format]
    end
    
    subgraph "Performance Optimization"
        ES --> CT[Component Tree]
        CT --> SM[Specification Mapping]
        SM --> 31MS[31ms Export Time]
    end
```

### 📊 **Professional Order Entry Interfaces**

```mermaid
graph TB
    subgraph "Floating Order Entry Panel"
        FP[Floating Panel] --> IO[Interface Options]
        IO --> ST[Standard Interface]
        IO --> PE[Performance Interface]
        IO --> AG[AG-Grid Professional]
    end
    
    subgraph "Standard Interface"
        ST --> SF[Simple Forms]
        ST --> BV[Basic Validation]
        ST --> QC[Quantity Controls]
    end
    
    subgraph "Performance Interface (Virtualized)"
        PE --> VR[Virtual Rendering]
        PE --> LS[Large Dataset Support]
        PE --> OS[Optimized Scrolling]
        PE --> 1K[1000+ Items]
    end
    
    subgraph "AG-Grid Professional"
        AG --> CE[Cell Editing]
        AG --> CP[Copy/Paste Excel]
        AG --> SF2[Sort/Filter]
        AG --> RS[Range Selection]
        AG --> KN[Keyboard Navigation]
    end
    
    subgraph "Shared Features"
        ST --> EX[Export Options]
        PE --> EX
        AG --> EX
        EX --> XLSX[XLSX Export]
        EX --> PDF[PDF Export]
        EX --> CSV[CSV Export]
    end
```

### 2. Design Canvas Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant DC as Design Canvas
    participant CL as Component Library
    participant EX as Export System
    
    U->>CL: Select Component
    CL->>DC: Add to Canvas
    DC->>DC: Position Component
    U->>DC: Arrange Layout
    DC->>DC: Update Spatial Data
    U->>DC: Export Design
    DC->>EX: Generate XLSX
    EX->>EX: Parse Components
    EX->>EX: Apply Proximity Grouping
    EX->>EX: Create Order Format
    EX-->>U: Download File
```

**Design Canvas Features:**
- **Spatial Grouping**: 150px proximity threshold for component relationships
- **Priority Detection**: Connector/receptacle detection triggers new rows
- **Export Parsing**: Sophisticated rules for PreSal format generation

### 3. Excel Integration Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Upload Interface
    participant EP as Excel Parser
    participant PR as Pattern Recognition
    participant DB as Database
    
    U->>UI: Upload Excel File
    UI->>EP: Process File
    EP->>EP: Parse Sheets
    EP->>PR: Analyze Patterns
    PR->>PR: Extract Receptacles
    PR->>PR: Identify Components
    PR->>DB: Store Patterns
    DB-->>PR: Success
    PR-->>EP: Processed Data
    EP-->>UI: Analysis Results
    UI-->>U: Display Findings
```

**Pattern Recognition Capabilities:**
- **Multi-Sheet Analysis**: Scans all sheets regardless of name
- **Receptacle Detection**: NEMA, IEC, L-series pattern matching
- **Component Mapping**: Cable, conduit, length identification
- **Duplicate Handling**: Comprehensive pattern capture with deduplication

### 4. Order Entry Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant OE as Order Entry
    participant AG as AG-Grid
    participant Val as Validator
    participant Ex as Exporter
    
    U->>OE: Input Order Data
    OE->>AG: Populate Grid
    AG->>Val: Validate Entries
    Val->>Val: Check NEC Compliance
    Val->>Val: Verify Components
    Val-->>AG: Validation Results
    AG-->>OE: Display Status
    U->>OE: Export Order
    OE->>Ex: Generate Export
    Ex->>Ex: Apply Header Format
    Ex->>Ex: Create 5-Sheet Structure
    Ex-->>U: Download XLSX
```

---

## 🚀 Quick Start Guide

### Installation & Setup
```bash
# Clone the repository
git clone <repository-url>
cd power-whip-configuration-tool

# Install dependencies
npm install

# Set up PostgreSQL database
npm run db:push

# Start development server
npm run dev
# → Application runs on http://localhost:5000
```

### Environment Variables
```bash
# Required environment variables
DATABASE_URL=postgresql://username:password@localhost:5432/powerwhip
NODE_ENV=development
SESSION_SECRET=your-secret-key-here
```

---

## 📖 Comprehensive Feature Guide

### 🎯 **Movable Panel System**

**Revolutionary UI Design**: Replace traditional fixed sidebars with complete panel freedom

#### Panel Management
```
Header Controls → Manage all panels from single location
├── Component Library    # Browse and edit electrical components
├── Configuration Details # Basic power whip settings  
├── Excel Transformer   # Pattern recognition and data conversion
├── Specifications      # Advanced analysis and validation
├── Order Entry        # Professional order management
└── Validation Panel   # Real-time NEC compliance checking
```

#### How to Use Panels:
1. **Open Panels**: Click panel buttons in header controls
2. **Move Panels**: Drag by title bar to any screen location
3. **Resize Panels**: Use corner handles to adjust dimensions
4. **Minimize/Maximize**: Click panel control buttons
5. **Multi-Monitor**: Drag panels across multiple displays

---

### 🔧 **Component Library Module**

**Dynamic Electrical Component Management with Live Editing**

#### Supported Component Types
| Component Type | Editable Fields | Special Features |
|---|---|---|
| **Connectors & Receptacles** | Name, Voltage, Current, Wire Gauge, Price | Full specification editing |
| **Protection Devices** | Voltage, Current, Price | Electrical parameter editing |
| **Wire & Cable** | Wire Gauge, Price | Gauge specification editing |
| **Junction Boxes** | Price Only | Limited editing permissions |
| **Conduit Systems** | Price Only | Cost management only |

#### Live Editing Workflow
1. **Browse Components**: 
   - Navigate accordion categories (Connectors, Protection, Wire/Cable)
   - Use search to filter across all specifications
   - Auto-expand categories during search

2. **Edit Specifications** (Click to Edit):
   ```
   Component Name → Click title → Edit → Auto-save variant
   Voltage Rating → Click badge → 125V → 240V → Create new component
   Current Rating → Click badge → 15A → 20A → Permanent variant  
   Wire Gauge → Click badge → 12 AWG → 10 AWG → New specification
   Price → Click display → $12.50 → $15.99 → Updated pricing
   ```

3. **Variant Creation**:
   - Every edit creates a permanent new component
   - Original component remains unchanged
   - New variants appear in library instantly
   - Contextual editing based on component category

4. **Design Integration**:
   - Click ⚡ button to add to Design Canvas
   - Drag components from library to canvas
   - Components maintain all edited specifications

#### Key Features:
- **Real-time editing**: No forms, click and edit directly
- **Contextual permissions**: Different fields editable per component type
- **Visual feedback**: Hover states indicate editable fields
- **Keyboard shortcuts**: Enter to save, Escape to cancel
- **Search integration**: Find components by any specification

---

### 🎨 **Design Canvas Module**

**Visual Electrical Layout Design with Intelligent Export**

#### Core Design Features
- **Drag & Drop**: Add components from library or floating panel
- **Spatial Arrangement**: Position components with pixel precision
- **Proximity Grouping**: 150px threshold for automatic component relationships
- **Undo/Redo System**: Complete design history (Ctrl+Z support)
- **Zoom Controls**: 25% to 300% with mouse wheel support

#### Intelligent Export System
```
Design Canvas → Spatial Analysis → Order Entry Format
├── Component Detection    # Identify all placed components
├── Proximity Grouping    # Group components within 150px
├── Priority Rules        # Connectors/receptacles trigger new rows
├── Specification Mapping # Extract all component specifications  
└── PreSal Format        # Generate 50+ column professional structure
```

#### Export Features:
- **Performance Optimized**: 31ms export time (down from 11+ seconds)
- **Spatial Intelligence**: Convert 2D layouts to structured data
- **Priority Detection**: Electrical connectors create logical groupings
- **Professional Format**: Compatible with PreSal industry standards
- **5-Sheet Structure**: Complete documentation package

#### Usage Workflow:
1. **Component Placement**: Drag from Component Library or click ⚡ buttons
2. **Spatial Design**: Arrange components to represent actual electrical layout
3. **Grouping Strategy**: Place related components within 150px for auto-grouping
4. **Export Design**: Click "Export Design Canvas" in header for XLSX generation

---

### 🧠 **Excel Integration & Pattern Recognition**

**AI-Powered Data Processing with Natural Language Understanding**

#### Multi-Source Data Architecture
```
Data Sources
├── Excel Files (.xlsx)     # Upload and analyze existing designs
├── Web URLs               # Remote data integration  
├── External APIs          # Odoo, ERP system connections
└── Manual Entry          # Direct component specification
```

#### Pattern Recognition Engine
- **Multi-Sheet Scanning**: Analyze ALL sheets regardless of names (Row-3, Sheet1, etc.)
- **Pattern Categories**:
  ```
  Receptacle IDs     → NEMA: 460C9W, 5-20R, L6-30R | IEC: CS8269A series
  Cable/Conduit Types → MMC, LFMC, FMC, SO, MC, EMT specifications
  Length Identifiers → Whip lengths, tail lengths, custom measurements
  General Patterns   → Natural language specifications and requirements
  ```

#### Natural Language Processing
```bash
# Input Examples:
"860 power whips total" → Structured pattern: 860 units with equal distribution
"25 L6-30R receptacles with 12 AWG wire" → Component mapping with specifications
"Data center power distribution" → Context-aware component suggestions
```

#### Processing Performance
- **Pattern Recognition**: <50ms for comma-delimited patterns
- **Natural Language**: <100ms for complex specifications  
- **Excel Analysis**: <5 seconds with 5-minute intelligent caching
- **Duplicate Handling**: 800+ patterns with reverse-order processing

#### Usage Guide:
1. **File Upload**: Drag & drop .xlsx files or browse
2. **Pattern Analysis**: Automatic detection and categorization
3. **Data Extraction**: View parsed components and specifications
4. **Transform Data**: Convert to structured order entry format
5. **Export Results**: Generate professional documentation

---

### 📊 **Order Entry Module**

**Professional Order Management with Three Interface Options**

#### Interface Options
| Interface | Use Case | Key Features |
|---|---|---|
| **Standard** | Basic order entry | Simple form-based input, validation |
| **Performance** | Large datasets (1000+ items) | Virtualized rendering, optimized scrolling |
| **AG-Grid** | Excel-like experience | Copy/paste, cell editing, advanced filtering |

#### AG-Grid Professional Features
```
Excel-Like Experience
├── Cell Editing        # Click any cell to edit with validation
├── Copy/Paste         # Full Excel clipboard integration
├── Sorting/Filtering  # Advanced data management tools
├── Range Selection    # Multi-cell operations and formulas
├── Keyboard Navigation # Excel shortcuts and hotkeys
└── Export Options     # Professional documentation generation
```

#### Order Management Workflow
1. **Data Input**: 
   - Manual entry in AG-Grid interface
   - Import from Excel pattern recognition
   - Auto-populate from component library
   - Bulk operations with copy/paste

2. **Real-Time Validation**:
   - Component availability checking
   - Price calculation and totals
   - Specification compliance verification
   - NEC code validation integration

3. **Professional Export**:
   - Multi-format exports (XLSX, PDF, CSV)
   - Custom templates and headers
   - Order summary and totals
   - Compliance documentation

#### Advanced Features:
- **Floating Panel Access**: Single optimized interface, no redundancy
- **Component Integration**: Direct connection to component library
- **Validation Integration**: Real-time NEC compliance checking
- **Export Flexibility**: Multiple format options with custom templates

---

### ⚡ **Live Validation System**

**Real-Time NEC Compliance with Electrical Engineering Calculations**

#### Validation Modes
| Mode | Description | Use Case |
|---|---|---|
| **Live** | Real-time calculations and validation | Active design work |
| **Static** | Display cached validation results | Review and presentation |
| **Hidden** | Validation runs but UI hidden | Background processing |

#### Electrical Calculations
```
NEC Compliance Engine
├── Voltage Drop Analysis    # Line loss calculations and limits
├── Thermal Analysis        # Temperature derating and safety margins  
├── Ampacity Calculations   # Current-carrying capacity verification
├── Wire Gauge Compatibility # Gauge vs. current rating validation
├── Code Compliance        # National Electrical Code standard checks
└── Safety Margins         # Engineering safety factor analysis
```

#### Validation Results Display
- **Success Indicators**: Green badges for compliant configurations
- **Warning States**: Yellow alerts for marginal but acceptable conditions  
- **Error Conditions**: Red alerts for code violations or safety issues
- **Detailed Analysis**: Hover tooltips with calculation details

#### Integration Points:
- **Component Library**: Validate specifications during editing
- **Design Canvas**: Spatial validation of component relationships
- **Order Entry**: Real-time validation during data entry
- **Export System**: Include compliance documentation in outputs

#### 🎨 Design Canvas Module

**Purpose**: Visual design and spatial arrangement of electrical components

**How to Use:**
1. **Add Components**: Drag from Component Library or click ⚡ button
2. **Position Elements**: Drag components to desired locations
3. **Group Related Items**: Place related components within 150px for auto-grouping
4. **Export Design**: Click "Export Design Canvas" for XLSX generation

**Export Features:**
- **Spatial Parsing**: Components grouped by proximity
- **Priority Rules**: Connectors/receptacles trigger new rows
- **PreSal Format**: Professional 50+ column structure
- **5-Sheet Export**: Complete documentation package

#### 📊 Excel Integration Module

**Purpose**: Process and analyze Excel files for component data

**How to Use:**
1. **Upload Files**: Drag & drop or browse for .xlsx files
2. **Pattern Analysis**: Automatic detection of electrical patterns
3. **Data Extraction**: View parsed components and specifications
4. **Transform Data**: Convert patterns to structured format

**Supported Patterns:**
- **NEMA Standards**: 460C9W, 460R9W, 5-20R, L6-30R
- **IEC Pin & Sleeve**: CS8269A series
- **Cable Types**: MMC, LFMC, FMC, SO, MC, EMT
- **Custom Patterns**: User-defined electrical specifications

#### 📋 Order Entry Module

**Purpose**: Professional order management with validation

**How to Use:**
1. **Data Input**: Enter order details in AG-Grid interface
2. **Validation**: Real-time NEC compliance checking
3. **Component Lookup**: Auto-populate from component library
4. **Export Orders**: Generate professional order documentation

**AG-Grid Features:**
- **Excel-like Interface**: Familiar spreadsheet experience
- **Cell Editing**: Click-to-edit with validation
- **Sorting & Filtering**: Advanced data management
- **Copy/Paste**: Bulk data operations

### 🎯 Panel Management

**Movable Panel System:**
- **Drag Panels**: Click title bar and drag anywhere
- **Resize**: Use corner handles to adjust size
- **Minimize/Maximize**: Click panel controls
- **Reset Layout**: Use header controls to restore defaults

---

## 📁 Detailed Project Architecture

### 🏗️ **Frontend Architecture**
```
client/src/
├── components/                 # React Component Library
│   ├── panels/                # Floating Panel System
│   │   ├── DraggablePanel.tsx           # Core draggable container
│   │   ├── PanelControls.tsx            # Header panel management
│   │   ├── FloatingComponentLibrary.tsx # Component browser panel
│   │   ├── FloatingOrderEntryPanel.tsx  # Order entry panel
│   │   ├── ConfigurationDetailsPanel.tsx # Configuration panel
│   │   └── SpecificationsAnalysisPanel.tsx # Analysis panel
│   ├── library/               # Component Library System
│   │   ├── ExpandedComponentLibrary.tsx # Main library interface
│   │   ├── ComponentLibrary.tsx         # Basic library view
│   │   └── EditableComponentCard.tsx    # Live editing interface
│   ├── canvas/                # Design Canvas System
│   │   ├── DesignCanvas.tsx             # Main canvas interface
│   │   ├── CanvasComponent.tsx          # Draggable canvas elements
│   │   └── DesignCanvasExportButton.tsx # Export functionality
│   ├── excel/                 # Excel Integration
│   │   ├── ExcelTransformer.tsx         # Pattern recognition
│   │   ├── AGGridExcelViewer.tsx        # Excel-like interface
│   │   ├── ExcelFileViewer.tsx          # File analysis
│   │   └── ExcelLikeInterface.tsx       # Professional Excel UI
│   ├── order/                 # Order Entry System
│   │   ├── AGGridOrderEntry.tsx         # Professional grid interface
│   │   ├── PerformanceOrderEntry.tsx    # Virtualized performance view
│   │   └── VirtualizedOrderEntry.tsx    # Large dataset handling
│   ├── validation/            # Validation System
│   │   ├── ValidationOptions.tsx        # Validation mode selector
│   │   └── ValidationStatus.tsx         # Real-time status display
│   └── ui/                    # shadcn/ui Components
├── contexts/                  # State Management
│   ├── ConfigurationContext.tsx        # Global configuration state
│   ├── DesignCanvasContext.tsx         # Canvas state management
│   └── PanelManagerContext.tsx         # Panel positioning state
├── hooks/                     # Custom React Hooks
│   ├── use-mobile.tsx                  # Mobile responsiveness
│   ├── use-toast.tsx                   # Notification system
│   └── use-panel-state.tsx             # Panel state management
├── lib/                       # Utility Functions
│   ├── utils.ts                        # General utilities
│   ├── queryClient.ts                  # TanStack Query setup
│   ├── electricalCalculations.ts      # NEC compliance calculations
│   └── exportUtils.ts                  # Export functionality
└── types/                     # TypeScript Definitions
    ├── component.ts                    # Component library types
    ├── panel.ts                        # Panel system types
    └── validation.ts                   # Validation system types
```

### 🖥️ **Backend Architecture**
```
server/
├── core/                      # Core Business Logic
│   ├── routes.ts                       # API endpoint definitions
│   ├── index.ts                        # Express server setup
│   ├── storage.ts                      # Data persistence layer
│   └── db.ts                          # Database connection
├── excel/                     # Excel Processing Engine
│   ├── excelParser.ts                  # File parsing and analysis
│   ├── analyzeExcel.js                 # Pattern recognition logic
│   ├── analyzeLookupFile.js           # Lookup table processing
│   ├── excelFormulaExtractor.ts       # Formula extraction
│   └── multiSheetProcessor.ts         # Multi-sheet analysis
├── export/                    # Export System
│   ├── designCanvasExport.ts          # Canvas to XLSX conversion
│   └── exportUtils.ts                 # Export utility functions
└── data/                      # Data Management
    ├── dataSourceManager.ts           # Multi-source data integration
    └── componentDataSources.ts        # Component data handling
```

### 🗄️ **Database Schema Architecture**
```sql
-- Core Configuration Tables
powerWhipConfigurations {
  id: uuid PRIMARY KEY
  name: varchar(255)
  voltage: integer
  current: integer
  wireGauge: varchar(10)
  specifications: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}

-- Component Library System
electricalComponents {
  id: uuid PRIMARY KEY
  name: varchar(255) NOT NULL
  type: varchar(50) NOT NULL        -- connector, protection, wire, etc.
  category: varchar(100)            -- NEMA, IEC, L-series, etc.
  partNumber: varchar(100)
  voltage: integer
  current: integer
  wireGauge: varchar(10)
  price: decimal(10,2)
  specifications: jsonb             -- Flexible specification storage
  manufacturer: varchar(255)
  isCustomVariant: boolean DEFAULT false
  parentComponentId: uuid           -- Reference to original component
  createdAt: timestamp
}

-- Excel Processing & Pattern Recognition  
excelFormulaLibrary {
  id: uuid PRIMARY KEY
  fileName: varchar(255)
  sheetName: varchar(255)
  formula: text
  category: varchar(100)            -- calculation, lookup, validation
  complexity: integer               -- 1-5 complexity rating
  dependencies: jsonb               -- Formula dependencies
  description: text
  extractedAt: timestamp
}

excelPatternLibrary {
  id: uuid PRIMARY KEY
  fileName: varchar(255)
  sheetName: varchar(255)
  patternType: varchar(50)          -- receptacle, cable, length, etc.
  originalPattern: varchar(255)    -- Raw pattern from Excel
  normalizedPattern: varchar(255)  -- Standardized pattern
  componentMapping: jsonb           -- Mapped component specifications
  frequency: integer                -- Pattern occurrence count
  extractedAt: timestamp
}

-- File Archive & Data Sources
excelFileArchive {
  id: uuid PRIMARY KEY
  fileName: varchar(255)
  originalName: varchar(255)
  fileSize: bigint
  uploadedAt: timestamp
  processingStatus: varchar(50)     -- pending, processing, completed, error
  extractedData: jsonb              -- Processed file data
  patternCount: integer             -- Number of patterns found
  errorLog: text                    -- Processing error information
}

componentDataSources {
  id: uuid PRIMARY KEY
  sourceType: varchar(50)           -- excel, url, api, manual
  sourceName: varchar(255)
  sourceUrl: text
  lastSync: timestamp
  syncStatus: varchar(50)           -- active, paused, error
  dataMapping: jsonb                -- Field mapping configuration
  componentCount: integer
}
```

---

## 🔧 Comprehensive API Reference

### 🔌 **Component Library Management**
```http
# Component CRUD Operations
GET    /api/components                           # List all components with filtering
GET    /api/components/search?q={query}          # Search across all specifications
GET    /api/components/type/{type}               # Filter by component type
GET    /api/components/category/{category}       # Filter by electrical category
GET    /api/components/{id}                      # Get specific component details
POST   /api/components                           # Create new component or variant
PUT    /api/components/{id}                      # Update existing component
DELETE /api/components/{id}                      # Delete component (soft delete)

# Live Editing & Variant Creation
POST   /api/components/{id}/variants             # Create component variant
GET    /api/components/{id}/variants             # List all variants of component
POST   /api/components/validate                  # Validate component specifications
```

### ⚙️ **Configuration Management**
```http
# Power Whip Configuration
GET    /api/configurations                       # List all configurations
GET    /api/configurations/{id}                  # Get specific configuration
POST   /api/configurations                       # Create new configuration
PUT    /api/configurations/{id}                  # Update configuration
DELETE /api/configurations/{id}                  # Delete configuration
POST   /api/configurations/{id}/duplicate        # Duplicate existing configuration

# Basic Configuration Settings
GET    /api/configurations/{id}/validation       # Get validation status
POST   /api/configurations/{id}/validate         # Run validation checks
```

### 📊 **Excel Processing & Pattern Recognition**
```http
# File Upload & Analysis
POST   /api/excel/upload                         # Upload Excel file for analysis
GET    /api/excel/files                          # List uploaded files
GET    /api/excel/files/{id}                     # Get file analysis results
DELETE /api/excel/files/{id}                     # Delete uploaded file

# Pattern Recognition & Transformation
POST   /api/excel/transform                      # Transform patterns to structured data
POST   /api/excel/analyze-configurator           # Analyze configurator dataset
GET    /api/excel/components                     # Get parsed components from Excel
GET    /api/excel/patterns                       # List recognized patterns
POST   /api/excel/patterns/validate              # Validate pattern recognition

# Natural Language Processing
POST   /api/excel/nlp/parse                      # Parse natural language specifications
POST   /api/excel/nlp/distribute                 # Generate distribution patterns
```

### 🎨 **Design Canvas Operations**
```http
# Canvas Management
GET    /api/design-canvas/{id}                   # Get canvas configuration
POST   /api/design-canvas                        # Create new canvas
PUT    /api/design-canvas/{id}                   # Update canvas layout
DELETE /api/design-canvas/{id}                   # Delete canvas

# Component Placement & Export
POST   /api/design-canvas/{id}/components        # Add component to canvas
PUT    /api/design-canvas/{id}/components/{cid}  # Update component position
DELETE /api/design-canvas/{id}/components/{cid}  # Remove component from canvas
POST   /api/design-canvas/export-xlsx            # Export canvas to XLSX (31ms)
POST   /api/design-canvas/export-presal          # Export PreSal format
```

### 📋 **Order Entry & Management**
```http
# Order Operations
GET    /api/orders                               # List all orders
GET    /api/orders/{id}                          # Get specific order
POST   /api/orders                               # Create new order
PUT    /api/orders/{id}                          # Update order
DELETE /api/orders/{id}                          # Delete order

# Order Line Items
GET    /api/orders/{id}/items                    # Get order line items
POST   /api/orders/{id}/items                    # Add item to order
PUT    /api/orders/{id}/items/{itemId}           # Update order item
DELETE /api/orders/{id}/items/{itemId}           # Remove order item

# Professional Export
POST   /api/orders/{id}/export/xlsx              # Export order to Excel
POST   /api/orders/{id}/export/pdf               # Export order to PDF
POST   /api/orders/{id}/export/csv               # Export order to CSV
```

### ⚡ **Validation & Compliance**
```http
# NEC Compliance Validation
POST   /api/validation/nec-compliance            # Run NEC compliance check
POST   /api/validation/voltage-drop              # Calculate voltage drop
POST   /api/validation/thermal-analysis          # Perform thermal analysis
POST   /api/validation/ampacity                  # Check ampacity calculations
POST   /api/validation/wire-compatibility        # Validate wire gauge compatibility

# Configuration Validation
POST   /api/validation/configuration             # Validate complete configuration
GET    /api/validation/standards                 # Get validation standards reference
POST   /api/validation/custom                    # Run custom validation rules
```

### 🔧 **System Administration**
```http
# Data Management
GET    /api/admin/stats                          # System statistics
POST   /api/admin/cleanup                        # Cleanup temporary files
GET    /api/admin/health                         # System health check
POST   /api/admin/cache/clear                    # Clear system cache

# Data Sources
GET    /api/data-sources                         # List all data sources
POST   /api/data-sources                         # Add new data source
PUT    /api/data-sources/{id}                    # Update data source
POST   /api/data-sources/{id}/sync               # Sync data source
```

### 📈 **Performance & Analytics**
```http
# Performance Metrics
GET    /api/metrics/performance                  # Get performance metrics
GET    /api/metrics/usage                        # Get usage statistics
GET    /api/metrics/components/popular           # Most used components
GET    /api/metrics/export/frequency             # Export frequency data

# Error Reporting
POST   /api/errors/report                        # Report client-side errors
GET    /api/errors/stats                         # Error statistics
```

### 🔒 **Authentication & Security** (Future)
```http
# Authentication (Planned)
POST   /api/auth/login                           # User login
POST   /api/auth/logout                          # User logout
GET    /api/auth/profile                         # Get user profile
PUT    /api/auth/profile                         # Update user profile
```

### 📊 **Request/Response Examples**

#### Component Creation with Validation
```bash
# Request
POST /api/components
Content-Type: application/json

{
  "name": "CS8369A Industrial Connector",
  "type": "connector", 
  "category": "IEC Pin & Sleeve",
  "voltage": 480,
  "current": 60,
  "wireGauge": "8",
  "price": 89.99,
  "specifications": {
    "poles": 4,
    "grounding": "Yes",
    "ip_rating": "IP67",
    "certification": "UL, CSA"
  }
}

# Response
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "CS8369A Industrial Connector",
  "type": "connector",
  "category": "IEC Pin & Sleeve", 
  "voltage": 480,
  "current": 60,
  "wireGauge": "8",
  "price": 89.99,
  "isCustomVariant": true,
  "parentComponentId": null,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### Design Canvas Export
```bash
# Request  
POST /api/design-canvas/export-xlsx
Content-Type: application/json

{
  "canvasId": "canvas-001",
  "exportType": "presal",
  "includeValidation": true,
  "groupByProximity": true
}

# Response (31ms processing time)
{
  "downloadUrl": "/downloads/DesignCanvasOutput_1642248600.xlsx",
  "fileName": "DesignCanvasOutput_1642248600.xlsx",
  "fileSize": 45632,
  "sheets": ["Order Entry", "Components", "Specifications", "Compliance", "Summary"],
  "componentCount": 25,
  "groupCount": 8,
  "processingTime": "31ms"
}
```

---

## 🚀 Deployment

### Development
```bash
npm run dev          # Start development server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

### Production
```bash
npm run build        # Build for production
npm start           # Start production server
```

### Environment Variables
```bash
DATABASE_URL=        # PostgreSQL connection string
NODE_ENV=           # development/production
SESSION_SECRET=     # Session encryption key
```

---

## 🚄 Performance Engineering & Optimization

### ⚡ **Ultra-Fast Processing Metrics**

| Operation | Performance | Optimization Technique |
|---|---|---|
| **Design Canvas Export** | 31ms | Spatial analysis algorithms, pre-compiled patterns |
| **Excel Pattern Recognition** | <50ms | Optimized regex, pattern caching |
| **Natural Language Processing** | <100ms | Pre-trained models, smart parsing |
| **Excel File Analysis** | <5s cached | 5-minute intelligent caching system |
| **Component Rendering** | 1000+ items | Virtualized rendering with react-window |
| **Live Validation** | Real-time | Memoized calculations, background processing |
| **Panel Interactions** | 60fps | Hardware acceleration, optimized animations |

### 🧠 **Smart Optimization Strategies**

#### Intelligent Caching System
```
Excel Processing Cache (5-minute TTL)
├── Pattern Recognition Results     # Pre-compiled regex patterns
├── Component Mapping Data         # NEMA, IEC, L-series mappings  
├── Natural Language Parsing      # Structured pattern conversion
├── Multi-Sheet Analysis          # Sheet-by-sheet processing results
└── Validation Calculations       # NEC compliance, voltage drop, thermal
```

#### React Performance Optimization
```typescript
// Virtualized rendering for large datasets
const VirtualizedOrderEntry = React.memo(() => {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/excel/components'],
    staleTime: 5 * 60 * 1000,      // 5-minute cache
    select: useCallback(data => 
      data.slice(startIndex, endIndex), [startIndex, endIndex])
  });
  
  return (
    <FixedSizeList
      height={600}
      itemCount={data.length}
      itemSize={80}
      itemData={{ data, onQuantityChange }}
    >
      {OrderEntryRow}
    </FixedSizeList>
  );
});
```

#### Design Canvas Spatial Optimization
```typescript
// 31ms export time optimization
const optimizeCanvasExport = useMemo(() => {
  const spatialTree = buildSpatialIndex(components);
  const proximityGroups = calculateProximityGroups(spatialTree, 150);
  const priorityRules = applyConnectorPriority(proximityGroups);
  
  return generatePreSalStructure(priorityRules);
}, [components]);
```

### 📊 **Performance Monitoring**

#### Real-Time Metrics Dashboard
- **Component Library**: Live search performance, edit response times
- **Design Canvas**: Drag responsiveness, export generation speed  
- **Excel Processing**: File upload speed, pattern recognition time
- **Order Entry**: Grid rendering performance, bulk operation speed
- **Validation Engine**: Calculation speed, real-time update performance

#### Performance Benchmarks
```
System Requirements:
├── Minimum: 4GB RAM, Intel i5 2.0GHz, Chrome 90+
├── Recommended: 8GB RAM, Intel i7 3.0GHz, Chrome 100+
└── Optimal: 16GB RAM, Intel i9 3.5GHz, Chrome Latest

Dataset Handling:
├── Components: 10,000+ items with smooth scrolling
├── Excel Patterns: 800+ patterns with duplicate handling
├── Design Elements: 500+ canvas components
├── Order Items: 1,000+ line items with real-time totals
└── Validation Rules: Real-time NEC compliance for complex configurations
```

### 🔧 **Development Performance Tools**

#### Build Optimization
```json
{
  "vite": {
    "optimizeDeps": {
      "include": ["react-window", "ag-grid-react", "@tanstack/react-query"]
    },
    "build": {
      "rollupOptions": {
        "output": {
          "manualChunks": {
            "vendor": ["react", "react-dom"],
            "ui": ["@radix-ui/react-dialog", "@radix-ui/react-accordion"],
            "grid": ["ag-grid-react", "ag-grid-community"],
            "excel": ["xlsx", "papaparse"]
          }
        }
      }
    }
  }
}
```

#### Runtime Performance Monitoring
```typescript
// Performance tracking for critical operations
const performanceTracker = {
  trackExcelProcessing: (startTime: number) => {
    const duration = performance.now() - startTime;
    console.log(`Excel processing: ${duration.toFixed(2)}ms`);
  },
  
  trackCanvasExport: (componentCount: number, startTime: number) => {
    const duration = performance.now() - startTime;
    console.log(`Canvas export (${componentCount} components): ${duration.toFixed(2)}ms`);
  }
};
```

---

## 🧪 Testing & Quality

### Code Quality
- **TypeScript**: Full type safety across frontend/backend
- **Zod Validation**: Runtime type checking and validation
- **ESLint**: Code style and error detection
- **Shared Schemas**: Consistent types between client/server

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile Responsive**: Touch-optimized interactions
- **Dark/Light Theme**: System preference detection

---

## 📚 Key Technologies

### Frontend
- **React 18**: Latest React with concurrent features
- **shadcn/ui**: Modern component library built on Radix UI
- **TanStack Query**: Powerful server state management
- **AG-Grid**: Professional data grid for Excel-like experience
- **Framer Motion**: Smooth animations and transitions

### Backend
- **Express.js**: Fast, minimalist web framework
- **Drizzle ORM**: Type-safe database operations
- **Neon Serverless**: Serverless PostgreSQL database
- **Zod**: Schema validation library

### Excel Processing
- **xlsx**: Excel file parsing and generation
- **papaparse**: CSV parsing capabilities
- **formula-parser**: Excel formula evaluation

---

## 🎯 **Troubleshooting & Common Issues**

### 🔧 **Component Library Issues**

#### Editing Not Working
```bash
# Check if component type supports editing
GET /api/components/{id}
# Verify: NEMA connectors = full editing, Junction boxes = price only

# Clear component cache
localStorage.removeItem('componentLibraryCache')

# Refresh component data
queryClient.invalidateQueries(['/api/components'])
```

#### Variant Creation Failed
```bash
# Validate component specifications
POST /api/components/validate
{
  "voltage": 480,
  "current": 60,
  "wireGauge": "8"
}

# Check for duplicate specifications
# Each variant must have unique specification combination
```

### 🎨 **Design Canvas Issues**

#### Export Performance Slow
```bash
# Check component count (optimal: <100 components)
# Reduce complexity for large designs
# Use proximity grouping to optimize structure

# Clear canvas cache
sessionStorage.removeItem('designCanvasState')

# Monitor export performance
console.time('canvasExport');
// ... export operation ...
console.timeEnd('canvasExport'); // Should show ~31ms
```

#### Components Not Dropping
```bash
# Verify drag data format
console.log(e.dataTransfer.getData('application/json'));

# Check canvas event listeners
canvasRef.current?.addEventListener('dragover', handleDragOver);
canvasRef.current?.addEventListener('drop', handleDrop);

# Clear dragging state
setIsDraggingComponent(false);
```

### 📊 **Excel Processing Issues**

#### Pattern Recognition Failed
```bash
# Verify file format (.xlsx only)
# Check file size limit (10MB max)
# Ensure sheets contain electrical patterns

# Manual pattern testing
POST /api/excel/nlp/parse
{
  "text": "25 L6-30R receptacles with 12 AWG wire"
}

# Clear Excel processing cache
DELETE /api/admin/cache/clear
```

#### Upload Stuck Processing
```bash
# Check file processing status
GET /api/excel/files/{fileId}

# Cancel stuck processing
DELETE /api/excel/files/{fileId}

# Retry with smaller file or different format
```

### ⚡ **Validation Issues**

#### NEC Compliance Errors
```bash
# Check validation mode setting
setValidationMode("live"); // Enable real-time validation

# Verify electrical calculations
POST /api/validation/voltage-drop
{
  "voltage": 480,
  "current": 60,
  "wireGauge": "8",
  "length": 25
}

# Review configuration parameters
# Ensure voltage, current, wire gauge compatibility
```

#### Performance Validation Slow
```bash
# Switch to static validation mode for large datasets
setValidationMode("static");

# Background validation for complex configurations
setValidationMode("hidden");

# Clear validation cache
sessionStorage.removeItem('validationResults');
```

### 🔄 **Panel System Issues**

#### Panels Not Moving/Resizing
```bash
# Check panel state in localStorage
localStorage.getItem('panelPositions');

# Reset panel positions
localStorage.removeItem('panelPositions');
window.location.reload();

# Verify panel manager context
const { panels, updatePanel } = usePanelManager();
```

#### Panel Performance Issues
```bash
# Reduce number of open panels (max 4 recommended)
# Close unused panels to improve performance

# Disable panel animations for better performance
.draggable-panel {
  transition: none !important;
}
```

### 📋 **Order Entry Issues**

#### AG-Grid Not Loading
```bash
# Check AG-Grid license (Community vs Enterprise)
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

# Verify data format
const rowData = components.map(comp => ({
  id: comp.id,
  partNumber: comp.partNumber,
  description: comp.description
}));
```

#### Export Generation Failed
```bash
# Check order data validity
console.log(orderItems.filter(item => !item.partNumber));

# Verify export permissions
# Ensure all required fields are populated

# Clear order cache
sessionStorage.removeItem('orderEntryState');
```

### 🌐 **Browser Compatibility**

#### Recommended Browser Settings
```bash
# Chrome/Edge (Recommended)
- Version 90+ required
- Hardware acceleration enabled
- JavaScript enabled
- Local storage allowed

# Firefox
- Version 88+ required  
- Enable CSS Grid support
- Allow clipboard access for copy/paste

# Safari
- Version 14+ required
- Enable experimental web features
- Allow cross-origin requests
```

#### Performance Settings
```bash
# For optimal performance:
1. Close unnecessary browser tabs
2. Enable hardware acceleration
3. Clear browser cache regularly
4. Disable unnecessary extensions
5. Use latest browser version
```

---

## 🤝 Contributing Guide

### 🏗️ **Development Setup**

```bash
# 1. Clone and install
git clone <repository-url>
cd power-whip-configuration-tool
npm install

# 2. Database setup
npm run db:push

# 3. Development environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Start development
npm run dev
```

### 📝 **Code Standards**

#### TypeScript Guidelines
```typescript
// Use strict typing for all functions
interface ComponentProps {
  id: string;
  name: string;
  specifications: ComponentSpecifications;
}

// Prefer interfaces over types for objects
interface ElectricalComponent {
  voltage: number;
  current: number;
  wireGauge: string;
}

// Use Zod for runtime validation
const componentSchema = z.object({
  name: z.string().min(1),
  voltage: z.number().min(1).max(600),
  current: z.number().min(1).max(400)
});
```

#### React Component Guidelines
```tsx
// Use React.memo for expensive components
const ComponentLibrary = React.memo(() => {
  // Component implementation
});

// Prefer custom hooks for complex logic
const useComponentEditing = (componentId: string) => {
  // Hook implementation
};

// Use shadcn/ui components when possible
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
```

#### Performance Guidelines
```typescript
// Use useMemo for expensive calculations
const filteredComponents = useMemo(() => {
  return components.filter(comp => 
    comp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [components, searchQuery]);

// Use useCallback for event handlers
const handleComponentEdit = useCallback((id: string, field: string, value: any) => {
  // Edit handler implementation
}, []);

// Virtualize large datasets
import { FixedSizeList as List } from 'react-window';
```

### 🚀 **Feature Development Process**

#### 1. Feature Planning
```bash
# Create feature branch
git checkout -b feature/panel-system-enhancement

# Document feature requirements
# Update relevant documentation
# Plan component architecture
```

#### 2. Implementation
```bash
# Follow coding standards
# Write tests for new functionality
# Ensure TypeScript strict mode compliance
# Add proper error handling
```

#### 3. Testing
```bash
# Test component functionality
# Verify performance requirements
# Check browser compatibility
# Validate accessibility standards
```

#### 4. Documentation
```bash
# Update README.md with new features
# Add inline code documentation
# Update API documentation
# Create usage examples
```

### 📊 **Commit Convention**

```bash
# Feature additions
feat(component-library): add live specification editing
feat(design-canvas): implement 31ms export optimization
feat(validation): add real-time NEC compliance checking

# Bug fixes
fix(excel-parser): resolve multi-sheet analysis issue
fix(panel-system): correct panel positioning state
fix(order-entry): fix AG-Grid copy/paste functionality

# Performance improvements
perf(canvas-export): optimize spatial analysis algorithm
perf(pattern-recognition): improve regex compilation
perf(virtualization): enhance large dataset rendering

# Documentation
docs(readme): add comprehensive feature guide
docs(api): update endpoint documentation
docs(troubleshooting): add common issue solutions

# Code refactoring
refactor(components): reorganize panel system architecture
refactor(hooks): extract custom panel state management
refactor(types): improve TypeScript interface definitions
```

### 🔍 **Code Review Guidelines**

#### Checklist for Pull Requests
- [ ] **TypeScript**: Strict type checking passes
- [ ] **Performance**: No performance regressions
- [ ] **Testing**: New features have tests
- [ ] **Documentation**: README and inline docs updated
- [ ] **Standards**: Follows established code patterns
- [ ] **Accessibility**: UI components are accessible
- [ ] **Browser Support**: Works in target browsers
- [ ] **Mobile**: Responsive design considerations

#### Review Focus Areas
1. **Component Architecture**: Proper use of React patterns
2. **State Management**: Efficient TanStack Query usage
3. **Performance**: Virtualization and memoization
4. **User Experience**: Intuitive interface design
5. **Error Handling**: Comprehensive error states
6. **Security**: Input validation and sanitization

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

For questions, issues, or feature requests:

1. **Documentation**: Check this README and inline code comments
2. **Issues**: Create GitHub issues for bugs or feature requests
3. **Discussions**: Use GitHub Discussions for questions

---

**Built with ⚡ by electrical engineers, for electrical engineers.**