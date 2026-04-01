# Power Whip Configuration Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

> A professional electrical engineering platform designed for electrical engineers, technicians, and procurement teams to configure, design, validate, and document custom electrical power whip assemblies — with AI-powered pattern recognition, real-time NEC compliance validation, comprehensive Excel integration, and an Adobe After Effects-style docking panel workspace.

---

## Table of Contents

- [What Is This Tool?](#what-is-this-tool)
- [Major Modules](#major-modules)
- [System Architecture](#system-architecture)
- [Design Canvas](#design-canvas-module)
- [Component Library](#component-library-module)
- [Excel Transformer & DCN Transformation](#excel-transformer--dcn-transformation)
- [Order Entry](#order-entry-module)
- [Panel System](#panel-system)
- [NEC Compliance Validation](#nec-compliance-validation)
- [Technical Complexity & Performance](#technical-complexity--performance)
- [Quick Start Guide](#quick-start-guide)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## What Is This Tool?

The Power Whip Configuration Tool is a full-stack web application for designing and documenting electrical power whip assemblies used in data centers, manufacturing plants, commercial buildings, and industrial installations.

**Target users:**
- **Electrical Engineers**: Design assemblies, validate NEC compliance, generate Bill of Materials
- **Technicians**: Configure existing assemblies, browse and customize components
- **Procurement Teams**: Generate structured order entry output from Excel files or design canvases

Core capabilities at a glance:

| Capability | Summary |
|---|---|
| Visual Design Canvas | Drag-and-drop workspace for spatial component arrangement |
| Component Library | 50+ live-editable NEMA/IEC/L-series components |
| Excel Transformer | Converts DCN input files to SAL-0y Configurator format |
| Order Entry | AG-Grid professional interface with Excel-like experience |
| Docking Panel System | Adobe AE-style floating panels with magnetic edge snapping |
| NEC Validation | Real-time voltage drop, thermal, and ampacity calculations |

---

## Major Modules

### Design Canvas Module

The Design Canvas is an interactive 2D layout workspace where engineers place and arrange electrical components to represent a real installation.

**Key behaviors:**
- Drag components from the Component Library onto the canvas
- Reposition with pixel precision; supports zoom 25%–300%
- Full undo/redo history (Ctrl+Z)
- Export to XLSX in PreSal format using intelligent spatial parsing

**Export intelligence:**
1. After clicking "Export Design Canvas", the system performs spatial analysis on all placed components
2. Components within **150px of each other** are grouped together
3. Connectors and receptacles act as **priority triggers** — they always start a new row in the output
4. Output is mapped to the full **PreSal 50+ column structure**
5. Export completes in approximately **31ms** (optimized from 11+ seconds)

```mermaid
flowchart TD
    DC[Design Canvas] --> SA[Spatial Analysis]
    SA --> CD[Component Detection]
    SA --> PG["Proximity Grouping: 150px threshold"]
    SA --> PR["Priority Rules: Connectors start new rows"]

    CD --> SM[Specification Mapping]
    PG --> GR[Group Relationships]
    PR --> LO[Logical Ordering]

    SM --> PS[PreSal 50+ Column Structure]
    GR --> PS
    LO --> PS

    PS --> EX["XLSX Export (~31ms)"]
    EX --> S1[Order Entry Sheet]
    EX --> S2[Components Sheet]
    EX --> S3[Specifications Sheet]
    EX --> S4[Compliance Sheet]
    EX --> S5[Summary Sheet]
```

---

### Component Library Module

The Component Library provides a browsable, live-editable catalog of 50+ electrical components.

**Supported component families:**

| Family | Examples | Editable Fields |
|---|---|---|
| NEMA Straight Blade | 5-15R, 5-20R, 14-30R | Name, Voltage, Current, Wire Gauge, Price |
| NEMA Twist-Lock (L-series) | L6-30R, L14-30R | Name, Voltage, Current, Wire Gauge, Price |
| Three-Phase | 460C9W, 460R9W | Name, Voltage, Current, Wire Gauge, Price |
| IEC Pin & Sleeve (CS-series) | CS8269A, CS8369A | Name, Voltage, Current, Wire Gauge, Price |
| Protection Devices | GFCI, AFCI, Breakers | Voltage, Current, Price |
| Wire & Cable | SO, MC, FMC, LFMC, EMT | Wire Gauge, Price |
| Junction Boxes | Standard, Weather Resistant | Price only |

**Live editing — how it works:**
- Click any editable field (voltage badge, current badge, wire gauge, price display)
- Type the new value and press Enter (or Escape to cancel)
- Every saved edit creates a **permanent new component variant** — the original is never modified
- New variants appear in the library instantly and persist to the database
- Editing permissions are **contextual** — protection devices cannot have their wire gauge edited; junction boxes expose only price

**Workflow diagram:**

```mermaid
sequenceDiagram
    participant U as User
    participant CL as Component Library
    participant ED as Inline Editor
    participant VS as Validation
    participant API as Backend API
    participant DB as Database

    U->>CL: Click voltage badge (e.g. 125V)
    CL->>ED: Activate inline editor
    U->>ED: Type new value (240V) and press Enter
    ED->>VS: Validate specification

    alt Valid
        VS-->>ED: OK
        ED->>API: POST /api/components
        API->>DB: Insert variant (isCustomVariant=true)
        DB-->>API: New component ID
        API-->>CL: Updated component list
        CL-->>U: New variant appears in library
    else Invalid
        VS-->>ED: Error
        ED-->>U: Show error message
    end
```

---

### Excel Transformer & DCN Transformation

The Excel Transformer is the most technically complex module. It processes uploaded DCN (Design Change Notice) Excel files and transforms them into the SAL-0y Configurator format used for order entry.

#### Multi-Sheet Excel Scanning

When an Excel file is uploaded, the system scans **all sheets regardless of their names** (Row-3, Sheet1, Row-4, etc.). It looks for:
- Receptacle IDs (NEMA codes like `460C9W`, `L6-30R`; IEC codes like `CS8269A`)
- Cable/Conduit Type IDs (`MMC`, `LFMC`, `FMC`, `SO`, `MC`, `EMT`)
- Whip and Tail Length identifiers
- General pattern identifiers

The scanner processes up to **800+ patterns** including duplicates, in reverse order to ensure complete capture.

#### DCN File Type Detection: CERTUSOFT vs Hornetsecurity

The transformer identifies which DCN variant was uploaded using a two-stage detection pipeline:

**Stage 1 — Filename inspection:**
- File names containing `hornetsecurity` or `q-40824` → classified as **Hornetsecurity**
- File names containing `certusoft` or `32275` → classified as **CERTUSOFT**

**Stage 2 — Content inspection** (if filename is ambiguous):
- Scans all sheet content for vendor-specific strings
- Falls back to standard DCN structure heuristics
- Default fallback: **CERTUSOFT** (minimum 2-row output, scalable up to 999)

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Upload Interface
    participant DT as DCN Type Detector
    participant HT as Hornetsecurity Handler
    participant CT as CERTUSOFT Handler
    participant EX as Output Generator

    U->>UI: Upload DCN file
    UI->>DT: Inspect filename
    alt Filename contains "hornetsecurity" or "q-40824"
        DT->>HT: Route to Hornetsecurity handler
        HT->>HT: Generate 36-row template pattern
        HT->>EX: 36 order entries
    else Filename contains "certusoft" or "32275"
        DT->>CT: Route to CERTUSOFT handler
        CT->>CT: Extract actual electrical data from sheets
        CT->>CT: Parse Master sheet, Packing Slip, Breaker List
        CT->>EX: Actual extracted entries (adaptive count)
    else Ambiguous filename
        DT->>DT: Scan sheet content for vendor strings
        DT->>CT: Default to CERTUSOFT if DCN structure detected
        CT->>EX: Adaptive order entries
    end
    EX->>EX: Apply expression rules from Requirements sheet
    EX->>EX: Generate OrderEntryResult.xlsx
    EX-->>U: Download output file
```

**CERTUSOFT extraction process:**
- Scans `Master` sheet, `Packing Slip` sheet, and `Breaker List` sheet
- Applies flexible pattern matching to identify electrical specifications
- Extracts receptacle type, conduit type, whip length, tail length, and label color
- Defaults conduit type to **LFMC** for CERTUSOFT files when not specified

**Hornetsecurity extraction process:**
- Generates a **36-row standardized template** based on known Hornetsecurity patterns
- Each row uses a consistent structure matching the expected output format

#### OrderEntryResult Output Format

The output is an `.xlsx` file named `OrderEntryResult_<timestamp>.xlsx` with two sheets:

**Order Entry sheet columns:**

| Column | Description |
|---|---|
| (line number) | Auto-incremented row ID |
| Order QTY | Quantity ordered |
| Choose receptacle | NEMA/IEC receptacle code |
| Cable/Conduit Type | LFMC, FMC, EMT, etc. |
| Brand Preference | Manufacturer preference |
| Whip Length (ft) | Primary cable run length |
| Tail Length (ft) | Pigtail/stub length |
| Conduit Color | Color designation |
| Label Color (Background/Text) | Label specification |
| building, PDU, Panel | Installation location references |
| First/Second/Third Circuit | Electrical circuit assignments |
| Cage, Cabinet Number | Physical location in rack/cabinet |
| Included Breaker | Breaker specification |
| Conductor AWG, Green AWG | Wire gauge specifications |
| Voltage, Current | Electrical ratings |
| Drawing number, Notes | Documentation fields |
| Orderable Part number | Final part number for ordering |
| Whip Parts Cost, Breaker Cost, Total parts Cost | Pricing breakdown |
| List Price, Margin fields | Pricing tiers |

**Technical Data sheet:** Contains transformation metadata, source analysis summary, and processing log.

#### Pattern Parser

The transformer also accepts comma-delimited pattern specifications directly via `/api/excel/parse-patterns`:

```
Input:  "460R9W, Metal Conduit, 50ft, Pigtail 10"
Output: Structured row with receptacle=460R9W, conduit=MCC, whipLength=50, tailLength=10

Input:  "L6-30R, LFMC, 25ft, 8"
Output: Structured row with L6-30R specs + LFMC conduit, 25ft whip, 8ft tail
```

Each comma-delimited entry maps to: `receptacle, conduit type, whip length, tail length`. The parser normalizes conduit names (e.g., "Metal Conduit" → "MCC", "Liquid tight" → "LFMC") and looks up electrical specifications from a built-in receptacle database.

Processing time: **<50ms** for comma-delimited patterns.

#### Expression Rules (Requirements Sheet)

Each transformation applies a set of expression rules derived from the SAL-0y Requirements sheet:

```
receptacle   → IF(Requirements!B4='Yes', EXTRACT_RECEPTACLE_FROM_DCN(), '')
conduitType  → IF(Requirements!C4='Yes', EXTRACT_CONDUIT_FROM_DCN(), '')
conduitLength → IF(Requirements!D4='Yes', EXTRACT_LENGTH_FROM_DCN(), '')
tailLength   → IF(Requirements!E4='Yes', EXTRACT_TAIL_FROM_DCN(), '')
labelColor   → IF(Requirements!K4='No', 'Black (conduit)', CUSTOM_LABEL_COLOR())
```

---

### Order Entry Module

The Order Entry module provides three interface options for entering and managing order data.

| Interface | Use Case | Key Features |
|---|---|---|
| Standard | Small orders, basic entry | Simple forms, basic validation |
| Performance | Large datasets (1000+ rows) | Virtualized rendering via `react-window` |
| Order Entry | Component catalog order view | Search, filter by category, quantity controls, CSV export |

**Order Entry features:**
- Browse and search components from the Master Bubble Lookup data source by part number, description, or manufacturer
- Filter by electrical category
- Quantity +/- controls with running price totals per line and order summary
- Export active order items to CSV format

**Workflow:**

```mermaid
sequenceDiagram
    participant U as User
    participant OE as Order Entry Panel
    participant API as /api/excel/components
    participant Cache as Component Cache

    U->>OE: Open Order Entry panel
    OE->>API: GET /api/excel/components
    alt Cache hit (within 5 minutes)
        API->>Cache: Read from componentCache
        Cache-->>OE: Instant response
    else Cache miss
        API->>API: Load MasterBubbleUpLookup.xlsx from disk
        API->>Cache: Store result
        API-->>OE: Component list
    end
    OE-->>U: Display searchable component catalog
    U->>OE: Set quantities and export
    OE-->>U: Download order-entry-<date>.csv
```

---

### Panel System

The panel system provides a professional floating workspace inspired by Adobe After Effects — panels can float freely, dock to screen edges, and includes magnetic snapping infrastructure for edge alignment.

#### Provider Hierarchy

```
ConfigurationProvider
  └── DesignCanvasProvider          ← manages canvas state + docking state
        └── FloatingPanelCoordinatorProvider   ← magnetic snapping for standalone panels
              └── PanelManagerProvider         ← dynamically spawned panels (e.g. from order entry)
                    └── ConfiguratorContent
```

#### DesignCanvasContext

`DesignCanvasContext` is the central hub for the workspace layout. It manages:
- **`droppedComponents`** — components placed on the canvas
- **`dockedPanels`** — panels currently docked into layout zones (top/bottom/left/right)
- **`activeDockZone`** — the dock zone currently highlighted during a drag
- **`isDraggingPanel`** — global signal to show dock zone overlays

#### FloatingPanelCoordinator

`FloatingPanelCoordinatorContext` provides the infrastructure for **magnetic edge snapping** between floating panels. It does not depend on `PanelManager`.

The context exposes:
- `registerPanel(id, position, size)` — registers a panel so other panels can snap to it
- `unregisterPanel(id)` — removes a panel from the snapping registry
- `updatePanelPosition(id, position)` — updates a registered panel's position
- `getSnappedPosition(id, newPosition, size)` — computes a snapped position if within 20px of any registered panel's edge

Snapping logic when called:
- Threshold: **20px** from another panel's edge
- Snaps to: left edge, right edge, top edge, bottom edge
- Also aligns: top-top, bottom-bottom, left-left, right-right edges

Note: `DraggablePanel` calls `getSnappedPosition` via the coordinator when `enableCollision=true`, but does not currently call `registerPanel` or `updatePanelPosition`. Panel self-registration is implemented in the coordinator but is not wired into `DraggablePanel`'s lifecycle.

#### DraggablePanel Component

Each floating panel is rendered by `DraggablePanel`, which provides:
- Free-form drag anywhere on screen (minimum 50px must remain visible)
- **Adobe AE-style docking**: drag to center top/bottom/left/right zones (96px) to dock
- Dock zone visual feedback during drag (colored overlay indicators)
- **Grid snapping**: hold Ctrl/Cmd while dragging for 20px grid alignment
- Corner and edge resize handles
- Scale controls (50%–200% via Ctrl+scroll or ± buttons)
- Pin button (disables dragging to lock position)
- Minimize/maximize toggle
- Z-index management (click to bring to front)

#### Z-Index Hierarchy

| Layer | Z-Index | Component |
|---|---|---|
| Design Canvas | 0 | Canvas background |
| Top/Bottom docked panels | z-[5] | Prevents overlap with canvas |
| Left/Right docked panels | z-10 | Side panels |
| Floating panels (all) | 10000 | Equal priority layer |
| Active panel (brought to front) | 10001+ | Increments on each bring-to-front |

#### Docking: How it works

```mermaid
graph TB
    subgraph "Panel Drag Flow"
        D[Panel Drag Start] --> DZ[Check Dock Zones during drag]
        DZ --> TZ["Top Zone: mouse Y ≤ 96px, X in middle 50%"]
        DZ --> BZ["Bottom Zone: mouse Y ≥ screen-96px, X in middle 50%"]
        DZ --> LZ["Left Zone: mouse X ≤ 96px, Y in middle 50%"]
        DZ --> RZ["Right Zone: mouse X ≥ screen-96px, Y in middle 50%"]
    end

    subgraph "On Release"
        TZ --> DOCK[dockPanel() called in DesignCanvasContext]
        BZ --> DOCK
        LZ --> DOCK
        RZ --> DOCK
        DOCK --> LAYOUT[configurator.tsx renders docked panel inline]
        DOCK --> HIDE[DraggablePanel returns null - hidden from float layer]
    end

    subgraph "Docked Rendering"
        LAYOUT --> TOP[Top: height = panel.size, z-5]
        LAYOUT --> BOTTOM[Bottom: height = panel.size, z-5]
        LAYOUT --> LEFT[Left: width = panel.size, z-10]
        LAYOUT --> RIGHT[Right: width = panel.size, z-10]
    end
```

Panels that can be docked: `all-features-panel`, `content-panel`, `component-library-panel`.
PanelManager-spawned panels (dynamic) display a "cannot be docked" message when docked.

---

### NEC Compliance Validation

The validation engine performs real-time electrical code compliance checking.

**Validation modes:**

| Mode | Behavior |
|---|---|
| Live | Recalculates on every change — for active design work |
| Static | Displays cached results — for review and presentation |
| Hidden | Runs in background but UI hidden — for large dataset processing |

**Calculations performed:**
- Voltage drop analysis (line loss vs NEC limits)
- Thermal derating and safety margin analysis
- Ampacity checking (current-carrying capacity per wire gauge)
- Wire gauge compatibility validation
- NEC standard verification (Article 400 and related)

**Result display:**
- Green badge: NEC compliant
- Yellow badge: Marginal — within tolerance but close to limits
- Red badge: Code violation or safety issue

---

## System Architecture

### Frontend Stack

```
React 18 + TypeScript
├── UI Framework: shadcn/ui (Radix UI primitives)
├── Styling: Tailwind CSS with custom technical color palette
├── State Management: TanStack Query (server) + React Context (UI)
├── Routing: Wouter
├── Forms: React Hook Form + Zod validation
├── Data Grid: AG-Grid Community
├── Virtualization: react-window (FixedSizeList)
└── Build Tool: Vite
```

### Backend Stack

```
Node.js + Express.js
├── Database: PostgreSQL (Neon Serverless)
├── ORM: Drizzle ORM with Zod schemas
├── File Upload: multer (memory storage, 200MB limit)
├── Excel Processing: xlsx, papaparse
└── Session: Express sessions
```

### Mermaid: Full Architecture Overview

```mermaid
graph TB
    subgraph "Frontend"
        DC[Design Canvas] --> DCC[DesignCanvasContext]
        DCC --> DP[DraggablePanel]
        DP --> FPC[FloatingPanelCoordinator]
        FPC --> PM[PanelManager]
        PM --> CONF[configurator.tsx]
    end

    subgraph "Backend"
        API[Express Routes] --> ST[Storage Layer]
        API --> EXT[ExtremeExcelTransformer]
        API --> MPR[MultiSheetProcessor]
        API --> RPP[ReceptaclePatternParser]
        ST --> DB[(PostgreSQL via Neon)]
    end

    subgraph "Excel Pipeline"
        UPLOAD[File Upload] --> EXT
        EXT --> DCN[DCN Type Detection]
        DCN --> |CERTUSOFT| CE[CERTUSOFT Extractor]
        DCN --> |Hornetsecurity| HE[Hornetsecurity Generator]
        CE --> OER[OrderEntryResult.xlsx]
        HE --> OER
    end

    CONF --> API
    CONF --> DC
```

### Database Schema

```
powerWhipConfigurations   -- Main power whip assembly configurations
electricalComponents      -- Component library (NEMA, IEC, L-series, protection, wire)
excelFormulaLibrary       -- Stored Excel formulas with complexity analysis
excelPatternLibrary       -- Recognized patterns from uploaded files
excelFileArchive          -- Uploaded file metadata and processing status
componentDataSources      -- Multi-source data integration config
```

---

## Quick Start Guide

### Prerequisites

- Node.js 20.x LTS
- PostgreSQL database (or Neon serverless account)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd power-whip-configuration-tool

# Install dependencies
npm install

# Configure environment variables
DATABASE_URL=postgresql://username:password@host:5432/powerwhip
NODE_ENV=development

# Push database schema
npm run db:push

# Start development server (frontend + backend on same port)
npm run dev
# → Application available at http://localhost:5000
```

### Using the Tool: Step-by-Step

#### 1. Design a Power Whip Assembly
1. Open the **Component Library** panel from the header
2. Browse or search for components (e.g., "L6-30R", "LFMC")
3. Click the ⚡ button or drag a component onto the **Design Canvas**
4. Arrange components to represent the physical installation layout
5. Place related components within 150px for automatic grouping in export
6. Click **Export Design Canvas** to download an XLSX in PreSal format

#### 2. Transform a DCN Excel File
1. Open the **Excel Transformer** panel
2. Upload your DCN `.xlsx` file (CERTUSOFT or Hornetsecurity format)
3. The system detects the file type automatically
4. Review the transformation log
5. Download the `OrderEntryResult.xlsx` output file

#### 3. Enter Orders Manually
1. Open the **Order Entry** panel
2. Select **AG-Grid** interface for an Excel-like experience
3. Enter data directly or paste from Excel
4. Validation indicators update in real-time
5. Export when complete

#### 4. Edit a Component
1. In the **Component Library**, find a component
2. Click any editable field (voltage, current, wire gauge, price)
3. Type the new value and press Enter
4. A new permanent variant is created and appears in the library

#### 5. Dock Panels for a Fixed Layout
1. Drag any panel by its title bar
2. Move toward the top, bottom, left, or right edge of the screen
3. When the dock zone highlights, release the mouse
4. The panel becomes part of the fixed layout surrounding the canvas
5. Click **Undock** to return it to floating mode

---

## Technical Complexity & Performance

### Pre-compiled Regex Pattern Engine

The receptacle identification engine uses pre-compiled regex patterns to achieve sub-millisecond pattern matching:

```typescript
// Four patterns cover the full NEMA/IEC receptacle namespace
const receptaclePatterns = [
  /^[A-Z0-9]{2,10}[A-Z]?\d*[A-Z]*$/,   // Standard codes (460C9W, 5-20R)
  /^L\d+-\d+[A-Z]?$/,                    // NEMA L-series (L6-30R, L14-20P)
  /^CS\d+[A-Z]*$/,                        // IEC CS series (CS8269A)
  /^\d+[A-Z]\d+[A-Z]?$/                  // Numeric prefix codes (14R30)
];
```

These patterns are evaluated for each candidate cell value using `Array.some()` for early exit — no backtracking, no dynamic regex compilation.

### 5-Minute Excel Component Cache

The `/api/excel/components` endpoint serves component data from a fixed set of `MasterBubbleUpLookup.xlsx` files stored in `attached_assets/`. Parsing these on every request is expensive, so the system uses a single in-process `componentCache` with a 5-minute TTL:
- Cache miss: loads the highest-priority available lookup file, parses the first 3 sheets, extracts receptacle components, stores result
- Cache hit: returns stored result in <1ms without touching disk
- Cache clear: available via `POST /api/excel/clear-cache`

This is a global singleton cache for this endpoint — it is not per-uploaded-file. User-uploaded files via `/api/excel/extreme-transform` and `/api/excel/upload-analyze` use separate in-memory `uploadedFiles` storage keyed by a generated file ID.

### Multi-Sheet Scanning with Reverse-Order Processing

The `MultiSheetProcessor` scans every sheet in an uploaded workbook. Sheets are processed in reverse order when scanning for patterns — this ensures patterns that appear on later sheets (often summary or output sheets) are captured before they would be overwritten by earlier sheets with the same pattern code.

The system processes **800+ patterns including duplicates** in a single pass.

### Pattern Parser for Comma-Delimited Specifications

The `ReceptaclePatternParser` converts comma-delimited pattern strings into structured PreSal rows:

```
Input:  "460R9W, Metal Conduit, 50ft, Pigtail 10"
Output: { receptacle: "460R9W", conduitType: "MCC", whipLength: 50, tailLength: 10, ... }
```

The parser handles:
- Conduit type normalization ("Metal Conduit" → "MCC", "Liquid tight" → "LFMC", "Armored cable" → "MC")
- Whip length extraction from tokens like "50ft", "25 feet"
- Tail/pigtail length extraction from tokens like "Pigtail 10", "tail length, 8"
- Electrical specification lookup from a built-in receptacle database (voltage, current, wire gauge)
- NEMA, IEC CS-series, and L-series code identification via regex prefix matching

### AG-Grid Virtualization

For large order entry datasets (1000+ rows), the Performance interface uses `react-window` with `FixedSizeList`:

```typescript
<FixedSizeList
  height={600}
  itemCount={data.length}
  itemSize={80}         // Each row is 80px
  itemData={{ data, onQuantityChange }}
>
  {OrderEntryRow}
</FixedSizeList>
```

Only the visible rows are rendered in the DOM — scrolling through 10,000 rows maintains 60fps.

### NEC Compliance Calculation Engine

The NEC engine runs calculations across six dimensions simultaneously:
1. **Voltage drop** — checks line loss against NEC Article 210.19 limits
2. **Thermal analysis** — derates ampacity for ambient temperature
3. **Ampacity** — verifies wire gauge can carry the specified current
4. **Wire gauge compatibility** — cross-checks gauge vs connector rating
5. **Code compliance** — verifies NEC 2020 standard conformance
6. **Safety margins** — applies engineering safety factors

Calculations are **memoized** — results for the same configuration are cached for the session. The validation engine runs in the background in Hidden mode to pre-warm the cache.

### Design Canvas Export Optimization

The original export approach iterated all components in nested loops: O(n²) complexity, producing 11+ second export times for larger designs.

The optimized approach:
1. Build a spatial index of all component positions
2. Calculate proximity groups in a single O(n log n) pass using sorted coordinates
3. Apply connector-priority rules as a single filtering pass
4. Map to PreSal structure using pre-built column mapping

Result: **~31ms** for typical designs with 25–50 components.

### Performance Summary

| Operation | Time | Technique |
|---|---|---|
| Design Canvas Export | ~31ms | Spatial index + pre-compiled column mapping |
| Comma-delimited pattern parsing | <50ms | Pre-compiled regex, O(n) scan |
| Excel component list (cache hit) | <1ms | Global singleton componentCache, 5-min TTL |
| Excel component list (cache miss) | seconds | Load + parse MasterBubbleUpLookup.xlsx |
| Virtualized order entry rendering | 60fps | react-window FixedSizeList |
| NEC compliance calculations | Real-time | Memoized per configuration |
| Panel drag interactions | 60fps | Hardware-accelerated CSS, minimal React re-renders |

---

## API Reference

### Component Library

```http
GET    /api/components                  List all components
GET    /api/components/type/:type       Filter by type
GET    /api/components/:id              Get component details
POST   /api/components                  Create component or variant
```

### Configurations

```http
GET    /api/configurations              List all configurations
GET    /api/configurations/:id          Get configuration
POST   /api/configurations              Create configuration
PATCH  /api/configurations/:id          Update configuration
DELETE /api/configurations/:id          Delete configuration
```

### Excel Processing

```http
POST   /api/excel/upload-analyze        Upload and analyze Excel file
POST   /api/excel/extreme-transform     Transform DCN file to OrderEntryResult
POST   /api/excel/parse-patterns        Parse comma-delimited patterns to XLSX
POST   /api/excel/fast-transform        Fast pattern transformation (NLP + comma)
POST   /api/excel/transform-presal      Convert fileId + rules to PreSal format
GET    /api/excel/analyze               Analyze built-in master lookup file
```

### Export

```http
POST   /api/export/xlsx/:id             Prepare XLSX export data for configuration
POST   /api/export/pdf/:id              Prepare PDF export data for configuration
```

---

## Project Structure

```
.
├── client/src/
│   ├── components/
│   │   ├── DraggablePanel.tsx           # Core floating panel (drag, dock, resize, scale)
│   │   ├── PanelManager.tsx             # Dynamic panel spawning and z-index management
│   │   ├── PanelControlsFloating.tsx    # All-Features floating panel
│   │   ├── ContentPanel.tsx             # Content area floating panel
│   │   ├── ExpandedComponentLibrary.tsx # Full component library view
│   │   ├── DesignCanvas.tsx             # Interactive 2D design workspace
│   │   ├── DesignCanvasExportButton.tsx # Export trigger + spatial analysis
│   │   ├── ExtremeTransformerInterface.tsx # DCN upload and transform UI
│   │   ├── FloatingOrderEntryPanel.tsx  # Order entry panel wrapper
│   │   ├── AGGridOrderEntry.tsx         # AG-Grid professional interface
│   │   ├── PerformanceOrderEntry.tsx    # Virtualized large-dataset view
│   │   ├── DockZones.tsx               # Visual dock zone overlays during drag
│   │   └── ...
│   ├── contexts/
│   │   ├── DesignCanvasContext.tsx      # Canvas state + docking system
│   │   ├── FloatingPanelCoordinator.tsx # Magnetic edge snapping for standalone panels
│   │   └── ConfigurationContext.tsx     # Global configuration form state
│   └── pages/
│       └── configurator.tsx             # Main page: layout + docked panel rendering
├── server/
│   ├── routes.ts                        # All API endpoint definitions
│   ├── storage.ts                       # Database abstraction layer
│   ├── extremeExcelTransformer.ts       # DCN → SAL-0y transformation engine
│   ├── multiSheetProcessor.ts           # Multi-sheet Excel scanning
│   ├── receptaclePatternParser.ts       # NLP + pattern parsing
│   ├── excelParser.ts                   # General Excel parsing utilities
│   ├── excelFormulaExtractor.ts         # Formula analysis and extraction
│   ├── designCanvasExport.ts            # Canvas spatial analysis + XLSX generation
│   └── db.ts                           # Neon PostgreSQL connection
└── shared/
    └── schema.ts                        # Drizzle ORM schema + Zod types (shared client/server)
```

---

## Contributing

### Development Setup

```bash
git clone <repository-url>
cd power-whip-configuration-tool
npm install
npm run db:push
npm run dev
```

### Code Standards

- **TypeScript strict mode** throughout — no `any` except at boundary layers (Excel parsing)
- Use **Zod schemas** from `shared/schema.ts` for all API validation
- Frontend data fetching via **TanStack Query** — no raw fetch calls in components
- Use **shadcn/ui** components instead of custom HTML wherever possible
- Panel system additions: follow the provider hierarchy — standalone panels use `FloatingPanelCoordinator`, managed panels use `PanelManager`

### Commit Convention

```bash
feat(excel-transformer): add Hornetsecurity 36-row template generation
fix(panel-system): correct dock zone detection for high-DPI displays
perf(canvas-export): reduce spatial analysis from O(n²) to O(n log n)
docs(readme): update DCN transformation section with sequence diagram
```

---

## License

This project is licensed under the **MIT License**.

```
Power Whip Configuration Tool
Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

### Third-Party Libraries

- React & TypeScript: MIT License
- shadcn/ui & Radix UI: MIT License
- TanStack Query: MIT License
- AG-Grid Community: MIT License
- Drizzle ORM: Apache 2.0 License
- Neon Database: PostgreSQL License
- xlsx: Apache 2.0 License

---

*Built for electrical engineers, technicians, and procurement teams who need a professional tool for configuring, validating, and documenting electrical power whip assemblies.*
