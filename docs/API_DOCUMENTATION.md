# API Documentation

## Extreme Excel Transformer API

### Endpoint: POST /api/excel/extreme-transform

Transforms DCN electrical files into standardized OrderEntryResult format.

#### Request
```http
POST /api/excel/extreme-transform
Content-Type: multipart/form-data
Content-Length: [file-size]

file: [DCN .xlsm file]
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | DCN Excel file (.xlsm format) |

#### File Requirements
- **Format**: Excel Macro-Enabled Workbook (.xlsm)
- **Size Limit**: 200MB maximum
- **Structure**: Must contain standard DCN sheets (Master, Packing Slip, Breaker Data)
- **Content**: Electrical specifications and component data

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="OrderEntryResult_[timestamp].xlsx"
Content-Length: [output-file-size]

[Excel file binary data]
```

#### Response Structure
The output Excel file contains:

**Sheet: Order Entry**
- **Rows**: 37 total (1 header + 36 data rows)
- **Columns**: 60+ columns with electrical specifications
- **Format**: Compatible with manufacturing and order processing systems

#### Sample cURL Request
```bash
curl -X POST http://localhost:5000/api/excel/extreme-transform \
  -F "file=@DCN_Hornetsecurity_ATL1-A_ORD0007915.xlsm" \
  -o OrderEntryResult.xlsx
```

#### Processing Workflow
1. **File Upload**: Secure buffer-based processing
2. **Sheet Analysis**: Multi-sheet structure analysis
3. **Pattern Recognition**: Extract electrical specifications
4. **Rule Application**: Apply transformation rules
5. **Output Generation**: Create 36-row OrderEntryResult
6. **File Download**: Stream Excel file to client

#### Error Responses

##### 400 Bad Request - No File
```json
{
  "error": "No file uploaded"
}
```

##### 400 Bad Request - Invalid Format
```json
{
  "error": "Invalid file format. Please upload a .xlsm file."
}
```

##### 413 Payload Too Large
```json
{
  "error": "File size exceeds 200MB limit"
}
```

##### 500 Internal Server Error
```json
{
  "error": "Processing failed: [specific error message]"
}
```

#### Performance Metrics
- **Processing Time**: < 2 seconds for typical DCN files
- **Memory Usage**: Buffer-only processing (no disk I/O)
- **Throughput**: Handles files up to 200MB
- **Output Size**: ~23KB for 36-row OrderEntryResult

#### Example Response Data Structure

**Column Headers (First Row)**
```
Line | Order QTY | Choose receptacle | Cable/Conduit Type | Brand Preference | 
Whip Length (ft) | Tail Length (ft) | Conduit Color | Label Color | building | 
PDU | Panel | First Circuit | Second Circuit | Third Circuit | Cage | 
Cabinet Number | Included Breaker | Mounting bolt | Standard Size | 
Conductor AWG | Green AWG | Voltage | Current | Box | L1 | L2 | L3 | N | E | 
Drawing number | Notes to Enconnex | Orderable Part number | Whip Parts Cost | 
Breaker Cost | Total parts Cost | Whip List | Breaker adder | List Price | 
Budgetary pricing text | [additional columns...]
```

**Sample Data Row**
```
1 | 1 | L21-30R | LFMC | Best Value | 66 | 6 | Grey (conduit) | 
White/Black (UL) | | | | | | | | | | 1/2 | 10 | 10 | 10 | 208 | 30 | 
Outlet Box, Cast Aluminum, 1 gang Bell 5320 or equv | Black | Red | Blue | 
White | Green | PWxx-L2130RT-xxSALx(001) | | PW66S-L2130RT-001SAL???? | 
#N/A | 0 | #N/A | #N/A | $0.00 | ??? | Whip, L21-30R, 10AWG, 
White/Black (UL) Label, 1/2 LFMC Grey (conduit) 66ft+6ft tail AL Box, 
List Price ???ea | [additional data...]
```

## Pattern Recognition API

### Endpoint: POST /api/excel/analyze-patterns

Analyzes Excel files for electrical component patterns.

#### Request
```http
POST /api/excel/analyze-patterns
Content-Type: multipart/form-data

file: [Excel file]
```

#### Response
```json
{
  "patterns": {
    "receptacles": ["L21-30R", "CS8269A", "460R9W"],
    "conduitTypes": ["LFMC", "EMT", "Metal Conduit"],
    "whipLengths": [50, 62, 64, 66, 74, 76, 78, 102, 104, 106, 116, 118, 120],
    "electricalSpecs": {
      "voltage": "208V",
      "current": "30A", 
      "wireGauge": "10AWG"
    }
  },
  "sheetAnalysis": {
    "totalSheets": 5,
    "processedSheets": ["Master", "Packing Slip", "Breaker Options"],
    "patternCount": 847,
    "duplicatesFound": 23
  },
  "processingTime": "0.89s"
}
```

## Natural Language Pattern API

### Endpoint: POST /api/excel/natural-language

Converts natural language specifications into structured patterns.

#### Request
```http
POST /api/excel/natural-language
Content-Type: application/json

{
  "input": "860 power whips total with L21-30R receptacles and LFMC conduit",
  "distribution": "equal"
}
```

#### Response
```json
{
  "structuredPatterns": [
    {
      "receptacle": "L21-30R",
      "conduitType": "LFMC", 
      "quantity": 860,
      "distribution": "equal",
      "specifications": {
        "voltage": "208V",
        "current": "30A",
        "tailLength": "6ft"
      }
    }
  ],
  "generatedRows": 860,
  "processingTime": "0.12s"
}
```

## Component Management API

### Get Components
```http
GET /api/components
```

**Response:**
```json
{
  "components": [
    {
      "id": "comp_001",
      "name": "NEMA L21-30R",
      "type": "receptacle",
      "category": "Receptacles & Outlets",
      "specifications": {
        "voltage": "208V",
        "current": "30A", 
        "phases": 3,
        "wireGauge": "10AWG"
      },
      "pricing": {
        "listPrice": 89.99,
        "currency": "USD"
      }
    }
  ]
}
```

### Create Component
```http
POST /api/components
Content-Type: application/json

{
  "name": "Custom L21-30R",
  "type": "receptacle",
  "specifications": {
    "voltage": "240V",
    "current": "30A"
  }
}
```

## Configuration Management API

### Get Power Whip Configurations
```http
GET /api/configurations
```

### Create Configuration
```http
POST /api/configurations
Content-Type: application/json

{
  "name": "Industrial Power Whip",
  "specifications": {
    "receptacle": "L21-30R",
    "conduitType": "LFMC",
    "whipLength": 50,
    "tailLength": 6
  },
  "components": ["comp_001", "comp_002"]
}
```

## File Upload Specifications

### Supported File Types
| Format | Extension | MIME Type | Max Size |
|--------|-----------|-----------|----------|
| Excel Macro-Enabled | .xlsm | application/vnd.ms-excel.sheet.macroenabled.12 | 200MB |
| Excel Workbook | .xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | 200MB |
| CSV Files | .csv | text/csv | 50MB |

### Security Measures
- **Buffer-Only Processing**: Files never written to disk
- **MIME Type Validation**: Strict format checking
- **Size Limitations**: Configurable upload limits
- **Memory Management**: Automatic cleanup after processing

## Rate Limiting

### Upload Endpoints
- **Limit**: 10 requests per minute per IP
- **Window**: 60 seconds
- **Response**: HTTP 429 Too Many Requests

### Analysis Endpoints  
- **Limit**: 20 requests per minute per IP
- **Window**: 60 seconds

## Error Handling Standards

### Error Response Format
```json
{
  "error": "Error description",
  "code": "ERROR_CODE", 
  "details": {
    "field": "Additional context",
    "timestamp": "2025-01-28T00:00:00Z"
  }
}
```

### Common Error Codes
| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_FILE_FORMAT` | Unsupported file type | 400 |
| `FILE_TOO_LARGE` | Exceeds size limit | 413 |
| `PROCESSING_FAILED` | Transformation error | 500 |
| `PATTERN_NOT_FOUND` | No recognizable patterns | 422 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |

## SDK Examples

### JavaScript/Node.js
```javascript
const FormData = require('form-data');
const fs = require('fs');

async function transformDCNFile(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  
  const response = await fetch('/api/excel/extreme-transform', {
    method: 'POST',
    body: form
  });
  
  if (response.ok) {
    const buffer = await response.arrayBuffer();
    fs.writeFileSync('OrderEntryResult.xlsx', Buffer.from(buffer));
    return 'Transformation completed successfully';
  } else {
    throw new Error(`API Error: ${response.status}`);
  }
}
```

### Python
```python
import requests

def transform_dcn_file(file_path):
    with open(file_path, 'rb') as file:
        files = {'file': file}
        response = requests.post('/api/excel/extreme-transform', files=files)
        
        if response.status_code == 200:
            with open('OrderEntryResult.xlsx', 'wb') as output:
                output.write(response.content)
            return 'Transformation completed successfully'
        else:
            raise Exception(f'API Error: {response.status_code}')
```

### cURL Examples
```bash
# Transform DCN file
curl -X POST http://localhost:5000/api/excel/extreme-transform \
  -F "file=@input.xlsm" \
  -o output.xlsx \
  --progress-bar

# Analyze patterns
curl -X POST http://localhost:5000/api/excel/analyze-patterns \
  -F "file=@input.xlsx" \
  -H "Accept: application/json"

# Natural language processing
curl -X POST http://localhost:5000/api/excel/natural-language \
  -H "Content-Type: application/json" \
  -d '{"input": "500 L21-30R power whips with LFMC conduit"}'
```