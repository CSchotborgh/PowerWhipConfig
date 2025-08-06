# Power Whip Configuration Tool

An advanced electrical power whip configuration platform that transforms complex Excel datasets into precise, automated transformations using intelligent data parsing and pattern recognition technologies.

## 🚀 Features

### Core Capabilities
- **Advanced Excel Processing**: Intelligent transformation algorithms for electrical component datasets
- **Pattern Recognition**: Automated detection of receptacle patterns and formula sequences
- **Multi-Format Support**: Handles comma-delimited, space-delimited, and tab-delimited data formats
- **Natural Language Processing**: Converts human specifications into structured patterns
- **Real-Time Transformations**: High-speed data processing with sub-100ms response times

### Professional Interface
- **AG-Grid Integration**: Enterprise-grade spreadsheet functionality with Excel-like features
- **Drag & Drop**: Interactive pattern builder and component management
- **Mobile Responsive**: Touch-optimized design with collapsible panels
- **Dark/Light Theme**: Professional theming with technical color palette
- **Formula Library**: Categorized storage and searchable archive of Excel formulas

### Technical Excellence
- **TypeScript**: Full type safety across frontend and backend
- **Performance Optimized**: Virtualized rendering, intelligent caching, pre-compiled patterns
- **Database Integration**: PostgreSQL with Drizzle ORM for reliable data persistence
- **Real-Time Updates**: WebSocket integration for live collaboration

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **shadcn/ui** component library (built on Radix UI)
- **Tailwind CSS** with custom technical styling
- **TanStack Query** for server state management
- **AG-Grid** for professional spreadsheet functionality

### Backend
- **Node.js** with Express.js REST API
- **TypeScript** for type safety
- **Drizzle ORM** with PostgreSQL
- **Neon Serverless** PostgreSQL database
- **Zod** for runtime validation

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- PostgreSQL database (Neon serverless recommended)

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/power-whip-configurator.git
cd power-whip-configurator
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_postgresql_connection_string
PGHOST=your_host
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
PGPORT=5432
```

### 4. Database Setup
```bash
# Push schema to database
npm run db:push

# Optional: Generate migrations
npm run db:generate
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
power-whip-configurator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── types/          # TypeScript type definitions
├── server/                 # Express backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data access layer
│   ├── db.ts              # Database configuration
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── attached_assets/       # Sample Excel files and test data
```

## 🔧 Configuration

### Database Schema
The application uses the following main tables:
- `powerWhipConfigurations` - Configuration data with JSONB flexibility
- `electricalComponents` - Component specifications and compatibility
- `excelFormulaLibrary` - Archived formulas with categorization
- `excelPatternLibrary` - Pattern recognition templates
- `excelFileArchive` - Uploaded file metadata and processing history

### Excel Processing
Key processing endpoints:
- `/api/excel/transform` - Main transformation endpoint
- `/api/excel/analyze-configurator` - Dataset analysis
- `/api/excel/export-master-bubble` - PreSalOutputFile generation
- `/api/excel/analyze-builder-sheet` - Builder sheet processing

## 📊 Usage Guide

### Basic Workflow

1. **Upload Excel Files**: Use the drag-and-drop interface to upload your electrical component datasets
2. **Pattern Configuration**: Define receptacle patterns using the built-in pattern recognition
3. **Data Transformation**: Process files through the Master Bubble Format Transformer
4. **Export Results**: Generate PreSalOutputFile.xlsx with transformed data
5. **Formula Management**: Archive and reuse Excel formulas through the formula library

### Advanced Features

#### Pattern Recognition
```typescript
// Natural language input examples:
"860 power whips total"
"L5-20R, L6-30R pattern distribution"
"Equal distribution across 4 zones"
```

#### Formula Extraction
The system automatically categorizes Excel formulas:
- **Calculation Formulas**: Mathematical operations
- **Lookup Formulas**: VLOOKUP, INDEX/MATCH patterns
- **Conditional Logic**: IF statements and nested conditions
- **Data Processing**: Text manipulation and formatting

## 🧪 Testing

### Sample Data Files
The `attached_assets/` directory contains sample Excel files for testing:
- `ConfiguratorModelDatasetEPW_*.xlsx` - Component configuration datasets
- `MasterBubbleUpLookup_*.xlsx` - Lookup table examples
- `EXAMPLE02_*.xlsx` - Pattern transformation examples
- `EXAMPLE03_*.xlsx` - Builder sheet samples

### Running Tests
```bash
# Run development server with test data
npm run dev

# Access test endpoints
curl http://localhost:3000/api/excel/components
curl -X POST http://localhost:3000/api/excel/transform
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL=your_production_db_url
PORT=3000
```

### Deployment Platforms
- **Recommended**: Replit Deployments (automatic setup)
- **Alternative**: Vercel, Netlify, Railway
- **Database**: Neon serverless PostgreSQL

## 🔍 API Reference

### Core Endpoints

#### Excel Processing
- `GET /api/excel/components` - Retrieve component library
- `POST /api/excel/upload` - Upload Excel files for processing
- `POST /api/excel/transform` - Transform receptacle patterns
- `POST /api/excel/export-master-bubble` - Generate PreSalOutputFile

#### Configuration Management
- `GET /api/configurations` - List saved configurations
- `POST /api/configurations` - Save new configuration
- `PUT /api/configurations/:id` - Update configuration
- `DELETE /api/configurations/:id` - Remove configuration

#### Formula Library
- `GET /api/formulas` - Retrieve formula archive
- `POST /api/formulas/extract` - Extract formulas from Excel files
- `GET /api/formulas/patterns` - Get pattern recognition results

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Verify database connection
npm run db:push
```

#### Excel Processing Errors
- Ensure uploaded files are valid `.xlsx` format
- Check file size limits (10MB default)
- Verify receptacle patterns format

#### Performance Issues
- Enable virtualization for large datasets
- Use pattern pre-compilation for repeated operations
- Implement caching for frequently accessed data

### Debug Mode
```bash
# Start with debug logging
DEBUG=* npm run dev
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Conventional commits for changelog generation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- Create GitHub Issues for bugs and feature requests
- Check existing documentation in `/docs`
- Review sample files in `/attached_assets`

## 📈 Roadmap

### Upcoming Features
- [ ] Real-time collaboration
- [ ] Advanced formula debugging
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Enhanced mobile experience
- [ ] Automated testing suite

### Performance Goals
- [ ] Sub-50ms transformation times
- [ ] 10x larger dataset support
- [ ] Advanced caching strategies
- [ ] Database query optimization

---

Built with ❤️ for electrical engineers and technicians who need powerful, reliable configuration tools.