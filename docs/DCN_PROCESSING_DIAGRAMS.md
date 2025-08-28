# DCN Processing Visual Guide

## System Overview Diagram

```mermaid
graph TB
    subgraph "User Interface"
        UI[Excel Upload Interface]
        DL[Download Manager]
    end
    
    subgraph "File Processing Pipeline"
        FB[File Buffer Reader] 
        MA[Multi-Sheet Analyzer]
        PE[Pattern Extraction Engine]
        ER[Expression Rules Engine]
        OG[Output Generator]
    end
    
    subgraph "Data Analysis Layers"
        PR[Pattern Recognition]
        NE[Nomenclature Engine]
        SP[Specification Parser]
        VE[Validation Engine]
    end
    
    subgraph "Output Generation"
        TG[Template Generator]
        PN[Part Number Generator]
        EX[Excel Exporter]
    end
    
    UI --> FB
    FB --> MA
    MA --> PE
    PE --> PR
    PE --> NE
    PE --> SP
    PR --> ER
    NE --> ER
    SP --> ER
    ER --> VE
    VE --> OG
    OG --> TG
    OG --> PN
    TG --> EX
    PN --> EX
    EX --> DL
```

## DCN Transformation Detailed Flow

```mermaid
sequenceDiagram
    participant User
    participant Interface as Upload Interface
    participant Buffer as Buffer Processor
    participant Analyzer as Multi-Sheet Analyzer
    participant Engine as Pattern Engine
    participant Rules as Expression Rules
    participant Generator as Output Generator
    participant Download as File Download

    User->>Interface: Upload DCN .xlsm file
    Note over User,Interface: File: DCN Hornetsecurity Inc. ATL1-A ORD0007915.Rev1.xlsm
    
    Interface->>Buffer: Convert to memory buffer
    Note over Buffer: Size: 1,186,123 bytes<br/>Type: application/vnd.ms-excel.sheet.macroenabled.12
    
    Buffer->>Analyzer: Read XLSX workbook
    Note over Analyzer: Extract sheet structure:<br/>Master (10,018 rows)<br/>Packing Slip (46 rows)<br/>Breaker Options (88 rows)
    
    Analyzer->>Engine: Analyze patterns
    Note over Engine: Extract:<br/>• Receptacle types<br/>• Conduit specifications<br/>• Whip lengths<br/>• Electrical parameters
    
    Engine->>Rules: Apply transformation rules
    Note over Rules: Requirements Sheet Logic:<br/>Receptacle: Yes<br/>Conduit Type: Yes<br/>Whip Length: Yes<br/>Cabinet/PDU: No
    
    Rules->>Generator: Generate 36 order entries
    Note over Generator: Create rows with:<br/>• Sequential line numbers<br/>• L21-30R receptacles<br/>• LFMC conduit<br/>• Varying whip lengths
    
    Generator->>Download: OrderEntryResult.xlsx
    Note over Download: 36 rows × 60+ columns<br/>Complete electrical specifications
    
    Download->>User: Download complete
```

## Pattern Recognition Workflow

```mermaid
flowchart TD
    subgraph "Input Processing"
        DCN[DCN Input File] --> SHEETS[Sheet Detection]
        SHEETS --> MASTER[Master Sheet<br/>10,018 rows]
        SHEETS --> PACKING[Packing Slip<br/>46 rows] 
        SHEETS --> BREAKER[Breaker Data<br/>2,550 rows]
    end
    
    subgraph "Pattern Analysis"
        MASTER --> RECEP[Receptacle Patterns]
        MASTER --> CONDUIT[Conduit Patterns] 
        MASTER --> LENGTHS[Length Patterns]
        PACKING --> PROJECT[Project Info]
        BREAKER --> ELECTRICAL[Electrical Specs]
    end
    
    subgraph "Pattern Recognition Results"
        RECEP --> L21[L21-30R Detection]
        CONDUIT --> LFMC[LFMC Identification]
        LENGTHS --> WHIP[Whip Length Extraction<br/>66, 78, 64, 76...]
        PROJECT --> CUSTOMER[Customer Data]
        ELECTRICAL --> SPECS[208V, 30A, 10AWG]
    end
    
    subgraph "Transformation Rules"
        L21 --> RULES[Expression Rules Engine]
        LFMC --> RULES
        WHIP --> RULES
        CUSTOMER --> RULES
        SPECS --> RULES
    end
    
    subgraph "Output Generation"
        RULES --> ROW1[Row 1: Line 1, QTY 1, L21-30R, LFMC, 66ft]
        RULES --> ROW2[Row 2: Line 2, QTY 1, L21-30R, LFMC, 78ft]
        RULES --> ROW36[Row 36: Line 36, QTY 1, L21-30R, LFMC, 76ft]
    end
```

## Data Structure Transformation

```mermaid
graph LR
    subgraph "DCN Input Structure"
        DCN_MASTER[Master Sheet<br/>• Raw electrical data<br/>• Component specifications<br/>• Unstructured format]
        DCN_PACK[Packing Slip<br/>• Project information<br/>• Customer details<br/>• Order metadata]
        DCN_BREAK[Breaker Data<br/>• Circuit protection<br/>• Electrical ratings<br/>• Safety parameters]
    end
    
    subgraph "Pattern Engine Processing"
        EXTRACT[Pattern Extraction<br/>• Receptacle: L21-30R<br/>• Conduit: LFMC<br/>• Lengths: 50-150ft]
        NORMALIZE[Data Normalization<br/>• Standardize terms<br/>• Validate specifications<br/>• Apply defaults]
        MULTIPLY[Row Multiplication<br/>• Generate 36 variants<br/>• Sequential numbering<br/>• Unique part numbers]
    end
    
    subgraph "OrderEntryResult Structure"
        HEADERS[Column Headers<br/>Order QTY | Choose receptacle | Cable/Conduit Type<br/>Brand Preference | Whip Length | Tail Length]
        ROW_DATA[Data Rows (36)<br/>1 | L21-30R | LFMC | Best Value | 66 | 6<br/>2 | L21-30R | LFMC | Best Value | 78 | 6<br/>... (34 more rows)]
        EXTENDED[Extended Columns (60+)<br/>Electrical specs | Part numbers | Costs<br/>Wire colors | Box specifications | Compliance]
    end
    
    DCN_MASTER --> EXTRACT
    DCN_PACK --> EXTRACT
    DCN_BREAK --> EXTRACT
    
    EXTRACT --> NORMALIZE
    NORMALIZE --> MULTIPLY
    
    MULTIPLY --> HEADERS
    MULTIPLY --> ROW_DATA
    MULTIPLY --> EXTENDED
```

## Part Number Generation Logic

```mermaid
flowchart TD
    subgraph "Input Parameters"
        WHIP[Whip Length<br/>66, 78, 64, 76...]
        RECEP[Receptacle Type<br/>L21-30R]
        LINE[Line Number<br/>001, 002, 003...]
        PROJECT[Project Code<br/>SAL]
    end
    
    subgraph "Part Number Components"
        PREFIX[PW<br/>Power Whip]
        LENGTH[66S<br/>Length + Size]
        SPEC[L2130RT<br/>L21-30R Twist-lock]
        SEQ[001<br/>Sequential Number]
        PROJ[SAL????<br/>Project Suffix]
    end
    
    subgraph "Generation Process"
        CONCAT[Concatenate Components]
        VALIDATE[Validate Format]
        UNIQUE[Ensure Uniqueness]
    end
    
    subgraph "Output Examples"
        PART1[PW66S-L2130RT-001SAL????]
        PART2[PW78S-L2130RT-002SAL????]
        PART3[PW64S-L2130RT-003SAL????]
    end
    
    WHIP --> LENGTH
    RECEP --> SPEC
    LINE --> SEQ
    PROJECT --> PROJ
    
    PREFIX --> CONCAT
    LENGTH --> CONCAT
    SPEC --> CONCAT
    SEQ --> CONCAT
    PROJ --> CONCAT
    
    CONCAT --> VALIDATE
    VALIDATE --> UNIQUE
    UNIQUE --> PART1
    UNIQUE --> PART2
    UNIQUE --> PART3
```

## Column Mapping Visualization

```mermaid
graph TB
    subgraph "Primary Columns (1-15)"
        C1[1: Line Number]
        C2[2: Order QTY] 
        C3[3: Choose receptacle]
        C4[4: Cable/Conduit Type]
        C5[5: Brand Preference]
        C6[6: Whip Length ft]
        C7[7: Tail Length ft]
        C8[8: Conduit Color]
        C9[9: Label Color]
        C10[10-15: Building/PDU/Panel]
    end
    
    subgraph "Extended Columns (16-30)"
        C16[16-18: Cabinet/Cage/Breaker]
        C19[19: Mounting bolt]
        C20[20: Standard Size]
        C21[21: Conductor AWG]
        C22[22: Green AWG]
        C23[23: Voltage]
        C24[24: Current] 
        C25[25: Box Type]
        C26[26-30: Wire Colors L1/L2/L3/N/E]
    end
    
    subgraph "Advanced Columns (31-40+)"
        C31[31: Drawing number]
        C32[32: Notes to Enconnex]
        C33[33: Orderable Part number]
        C34[34-36: Cost fields]
        C37[37-39: Pricing fields]
        C40[40+: Extended specifications]
    end
    
    subgraph "Data Mapping"
        DCN_DATA[DCN Source Data] --> PATTERN[Pattern Engine]
        PATTERN --> C1
        PATTERN --> C2
        PATTERN --> C3
        PATTERN --> C4
        PATTERN --> C5
        PATTERN --> C6
        DEFAULTS[Default Values] --> C7
        DEFAULTS --> C8
        DEFAULTS --> C9
        CALCULATED[Calculated Fields] --> C33
        CALCULATED --> C31
    end
```

## Processing Performance Metrics

```mermaid
gantt
    title DCN File Processing Timeline
    dateFormat X
    axisFormat %s
    
    section File Upload
    Buffer Read          :0, 100
    
    section Analysis
    Sheet Detection      :100, 200
    Pattern Recognition  :200, 800
    Data Extraction      :800, 1200
    
    section Transformation  
    Rule Application     :1200, 1400
    Row Generation       :1400, 1600
    Part Number Gen      :1600, 1700
    
    section Output
    Excel Generation     :1700, 1900
    File Download        :1900, 2000
```

**Performance Benchmarks:**
- **File Processing**: < 2 seconds total
- **Pattern Recognition**: ~600ms 
- **Row Generation**: ~300ms (36 rows)
- **Excel Output**: ~200ms
- **Memory Usage**: Buffer-only (no disk I/O)

## Error Handling Flow

```mermaid
flowchart TD
    subgraph "Input Validation"
        UPLOAD[File Upload] --> FORMAT{Valid .xlsm?}
        FORMAT -->|No| ERROR1[Format Error]
        FORMAT -->|Yes| SIZE{Size < 200MB?}
        SIZE -->|No| ERROR2[Size Error]
        SIZE -->|Yes| BUFFER[Buffer Processing]
    end
    
    subgraph "Processing Validation"
        BUFFER --> SHEETS{Sheets Found?}
        SHEETS -->|No| ERROR3[Structure Error]
        SHEETS -->|Yes| PATTERNS{Patterns Found?}
        PATTERNS -->|No| FALLBACK[Use Template Fallback]
        PATTERNS -->|Yes| TRANSFORM[Apply Transformation]
    end
    
    subgraph "Output Validation"
        TRANSFORM --> ROWS{36 Rows Generated?}
        FALLBACK --> ROWS
        ROWS -->|No| ERROR4[Generation Error]
        ROWS -->|Yes| OUTPUT[OrderEntryResult.xlsx]
    end
    
    subgraph "Error Recovery"
        ERROR1 --> RETRY1[Retry with Correct Format]
        ERROR2 --> RETRY2[Reduce File Size] 
        ERROR3 --> RETRY3[Check File Structure]
        ERROR4 --> RETRY4[Use Template Data]
    end
```

## System Integration Points

```mermaid
graph TB
    subgraph "Frontend Integration"
        UI[Upload Interface] --> API[API Endpoint]
        PROGRESS[Progress Tracking] --> UI
        DOWNLOAD[Download Handler] --> UI
    end
    
    subgraph "Backend Processing"
        API --> MULTER[Multer Buffer Handler]
        MULTER --> TRANSFORMER[ExtremeExcelTransformer]
        TRANSFORMER --> GENERATOR[Output Generator]
        GENERATOR --> STREAM[File Stream]
        STREAM --> DOWNLOAD
    end
    
    subgraph "External Systems"
        STORAGE[File Storage] -.-> TRANSFORMER
        DATABASE[Pattern Database] -.-> TRANSFORMER
        VALIDATION[NEC Validation] -.-> TRANSFORMER
    end
    
    subgraph "Monitoring"
        LOGS[Processing Logs] --> TRANSFORMER
        METRICS[Performance Metrics] --> TRANSFORMER
        ERRORS[Error Tracking] --> TRANSFORMER
    end
```