# API Reference

Complete API documentation for the Power Whip Configuration Tool backend services.

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication
Currently, the API does not require authentication. Future versions may implement API key or JWT-based authentication.

## Response Format
All API responses follow a consistent JSON format:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": {...}
}
```

## Excel Processing Endpoints

### Upload Excel File
Upload and process Excel files for transformation.

**Endpoint:** `POST /api/excel/upload`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `file` (required): Excel file (.xlsx format)
- `type` (optional): Processing type (`configurator`, `master-bubble`, `builder-sheet`)

**Example Request:**
```bash
curl -X POST \
  -F "file=@example.xlsx" \
  -F "type=configurator" \
  http://localhost:5000/api/excel/upload
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid-string",
    "filename": "example.xlsx",
    "size": 1024000,
    "sheets": ["Sheet1", "Sheet2"],
    "processingType": "configurator"
  }
}
```

### Transform Patterns
Transform receptacle patterns using the Master Bubble Format.

**Endpoint:** `POST /api/excel/transform`

**Content-Type:** `application/json`

**Body Parameters:**
```json
{
  "patterns": "460C9W\n460R9W\nL5-20R",
  "lookupPatterns": "CS8264C\nCS8269A",
  "naturalLanguage": "860 power whips total",
  "transformationType": "master-bubble"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transformedRows": [
      {
        "receptacleType": "460C9W",
        "quantity": 100,
        "specifications": {...}
      }
    ],
    "processingTime": "45ms",
    "matchedPatterns": 15
  }
}
```

### Export Master Bubble Format
Export processed data to PreSalOutputFile format.

**Endpoint:** `POST /api/excel/export-master-bubble`

**Content-Type:** `application/json`

**Body Parameters:**
```json
{
  "transformedData": [...],
  "filename": "PreSalOutputFile.xlsx",
  "includeMetadata": true
}
```

**Response:** Binary Excel file download

### Analyze Configurator Dataset
Analyze uploaded configurator dataset files.

**Endpoint:** `GET /api/excel/analyze-configurator`

**Query Parameters:**
- `fileId` (optional): Specific file ID to analyze
- `includeFormulas` (boolean): Include formula extraction

**Response:**
```json
{
  "success": true,
  "data": {
    "totalComponents": 1250,
    "categories": ["connectors", "cables", "accessories"],
    "formulas": [...],
    "patterns": [...],
    "metadata": {
      "processingTime": "120ms",
      "accuracy": 0.98
    }
  }
}
```

### Analyze Builder Sheet
Process EXAMPLE03-style builder sheets with power cable specifications.

**Endpoint:** `POST /api/excel/analyze-builder-sheet`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `file` (required): Builder sheet Excel file

**Response:**
```json
{
  "success": true,
  "data": {
    "powerCables": [
      {
        "whipLabel": "WL-001",
        "cableType": "SOOW",
        "conductorSize": "12 AWG",
        "numberOfConductors": 4,
        "length": 25,
        "specifications": {...}
      }
    ],
    "totalCables": 45,
    "processingTime": "67ms"
  }
}
```

## Component Management Endpoints

### Get Components
Retrieve electrical components from the database.

**Endpoint:** `GET /api/components`

**Query Parameters:**
- `type` (optional): Filter by component type
- `category` (optional): Filter by category
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "components": [
      {
        "id": "uuid",
        "name": "NEMA 5-15P",
        "type": "connector",
        "category": "input",
        "specifications": {
          "type": "plug",
          "poles": 3,
          "voltage": 125,
          "current": 15
        },
        "price": 12.50,
        "compatibility": [...]
      }
    ],
    "pagination": {
      "total": 1250,
      "page": 1,
      "limit": 50,
      "totalPages": 25
    }
  }
}
```

### Add Component
Add new electrical component to the database.

**Endpoint:** `POST /api/components`

**Body Parameters:**
```json
{
  "name": "L6-30R",
  "type": "receptacle",
  "category": "output",
  "specifications": {
    "type": "receptacle",
    "poles": 3,
    "voltage": 250,
    "current": 30
  },
  "price": 24.95,
  "compatibleGauges": ["10", "12"]
}
```

### Update Component
Update existing component.

**Endpoint:** `PUT /api/components/:id`

**URL Parameters:**
- `id`: Component UUID

**Body Parameters:** Same as Add Component

### Delete Component
Remove component from database.

**Endpoint:** `DELETE /api/components/:id`

**URL Parameters:**
- `id`: Component UUID

## Formula Library Endpoints

### Extract Formulas
Extract formulas from uploaded Excel files.

**Endpoint:** `POST /api/formulas/extract`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `file` (required): Excel file containing formulas

**Response:**
```json
{
  "success": true,
  "data": {
    "formulas": [
      {
        "id": "uuid",
        "formula": "=VLOOKUP(A2,Table1,2,FALSE)",
        "category": "lookup",
        "complexity": "medium",
        "cellReference": "B2",
        "sheetName": "Calculations"
      }
    ],
    "statistics": {
      "total": 45,
      "byCategory": {
        "lookup": 15,
        "calculation": 20,
        "conditional": 10
      }
    }
  }
}
```

### Get Formula Library
Retrieve stored formulas with search and filtering.

**Endpoint:** `GET /api/formulas`

**Query Parameters:**
- `category` (optional): Filter by formula category
- `complexity` (optional): Filter by complexity level
- `search` (optional): Search in formula text
- `page` (optional): Page number
- `limit` (optional): Items per page

### Save Formula
Save formula to library.

**Endpoint:** `POST /api/formulas`

**Body Parameters:**
```json
{
  "formula": "=IF(A1>0,A1*B1,0)",
  "category": "conditional",
  "complexity": "low",
  "description": "Calculate value if positive",
  "tags": ["calculation", "conditional"]
}
```

## Pattern Recognition Endpoints

### Detect Patterns
Analyze Excel data for recurring patterns.

**Endpoint:** `POST /api/patterns/detect`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `file` (required): Excel file for pattern analysis

**Response:**
```json
{
  "success": true,
  "data": {
    "patterns": [
      {
        "type": "receptacle",
        "pattern": "L5-[0-9]+R",
        "occurrences": 25,
        "confidence": 0.95,
        "examples": ["L5-15R", "L5-20R", "L5-30R"]
      }
    ],
    "statistics": {
      "totalPatterns": 8,
      "averageConfidence": 0.87
    }
  }
}
```

### Get Pattern Library
Retrieve stored patterns.

**Endpoint:** `GET /api/patterns`

**Query Parameters:**
- `type` (optional): Pattern type
- `confidence` (optional): Minimum confidence level

## Configuration Management

### Save Configuration
Save power whip configuration.

**Endpoint:** `POST /api/configurations`

**Body Parameters:**
```json
{
  "name": "Industrial Setup A",
  "components": [...],
  "specifications": {...},
  "metadata": {
    "voltage": 480,
    "current": 30,
    "length": 25
  }
}
```

### Get Configurations
Retrieve saved configurations.

**Endpoint:** `GET /api/configurations`

**Query Parameters:**
- `userId` (optional): Filter by user
- `voltage` (optional): Filter by voltage
- `current` (optional): Filter by current

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource doesn't exist |
| 413 | Payload Too Large - File size exceeds limit |
| 415 | Unsupported Media Type - Invalid file format |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server processing error |

## Rate Limits
- General API calls: 100 requests per 15 minutes per IP
- File uploads: 10 uploads per hour per IP
- Excel processing: 50 transformations per hour per IP

## File Upload Limits
- Maximum file size: 10MB
- Supported formats: .xlsx, .xls
- Maximum sheets per file: 20
- Maximum cells per sheet: 1,000,000

## Webhook Support (Future)
Future versions will support webhooks for:
- Processing completion notifications
- Error alerts
- Formula extraction results
- Pattern detection updates

## SDK and Libraries
Official SDKs coming soon for:
- JavaScript/TypeScript
- Python
- C# (.NET)

---

For more examples and interactive API testing, visit our [API Playground](https://your-domain.com/api-docs) (Swagger/OpenAPI documentation).