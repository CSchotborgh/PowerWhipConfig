# Contributing to Power Whip Configuration Tool

Thank you for considering contributing to the Power Whip Configuration Tool! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use GitHub Issues for bug reports and feature requests
- Include detailed reproduction steps for bugs
- Provide sample Excel files when reporting transformation issues
- Check existing issues before creating new ones

### Submitting Changes
1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes following our coding standards
4. Test your changes thoroughly
5. Submit a pull request with a clear description

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (Neon serverless recommended)
- Git

### Local Development
```bash
# Clone your fork
git clone https://github.com/yourusername/power-whip-configurator.git
cd power-whip-configurator

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run db:push

# Start development server
npm run dev
```

## 📋 Coding Standards

### TypeScript
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React Components
- Use functional components with hooks
- Implement proper error boundaries
- Follow component composition patterns
- Use TypeScript for all props and state

### Backend Code
- Use Express.js REST conventions
- Implement proper error handling
- Validate all inputs with Zod schemas
- Use transactions for database operations

### Database
- Use Drizzle ORM for all database operations
- Define schemas in `shared/schema.ts`
- Use migrations for schema changes
- Implement proper indexing for performance

## 🧪 Testing Guidelines

### Required Tests
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for critical workflows

### Test Data
- Use sample files from `attached_assets/` directory
- Create minimal test cases that cover edge cases
- Mock external dependencies appropriately
- Test both success and error scenarios

### Performance Testing
- Excel processing should complete under 100ms for standard files
- Database queries should be optimized
- Frontend should remain responsive during processing
- Memory usage should be monitored for large datasets

## 🎯 Areas for Contribution

### High Priority
- **Performance Optimization**: Improve Excel processing speed
- **Mobile Experience**: Enhance touch interactions and responsive design
- **Error Handling**: Better user feedback and recovery options
- **Documentation**: API documentation and user guides

### Medium Priority
- **Testing Coverage**: Expand automated test suite
- **Accessibility**: WCAG compliance improvements
- **Internationalization**: Multi-language support
- **Advanced Features**: Real-time collaboration, advanced formulas

### Good First Issues
- **UI Polish**: Small visual improvements and animations
- **Code Cleanup**: Refactoring and optimization
- **Documentation**: README improvements and code comments
- **Bug Fixes**: Minor issues and edge cases

## 🔍 Code Review Process

### Before Submitting
- [ ] Code follows TypeScript strict mode
- [ ] All tests pass
- [ ] Changes are documented
- [ ] Performance impact assessed
- [ ] Breaking changes are noted

### Review Criteria
- **Functionality**: Does it work as intended?
- **Code Quality**: Is it maintainable and readable?
- **Performance**: Does it maintain or improve performance?
- **Security**: Are there any security implications?
- **Compatibility**: Does it work across supported environments?

## 📚 Architecture Guidelines

### Frontend Structure
```
client/src/
├── components/     # Reusable UI components
├── pages/          # Route components
├── hooks/          # Custom React hooks
├── lib/            # Utility functions
├── types/          # TypeScript definitions
└── contexts/       # React context providers
```

### Backend Structure
```
server/
├── routes.ts       # API route definitions
├── storage.ts      # Data access layer
├── db.ts           # Database configuration
└── utils/          # Server utilities
```

### Shared Code
```
shared/
├── schema.ts       # Database schemas
├── types.ts        # Shared TypeScript types
└── validation.ts   # Zod validation schemas
```

## 🚀 Release Process

### Version Numbering
- Follow Semantic Versioning (SemVer)
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Steps
1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release branch
4. Test thoroughly
5. Merge to main
6. Tag release
7. Deploy to production

## 💬 Communication

### Discussions
- Use GitHub Discussions for questions and ideas
- Join our community channels for real-time chat
- Participate in design reviews and RFC processes

### Issue Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `performance` - Performance related
- `documentation` - Improvements or additions

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Annual contributor acknowledgment
- Special contributor badges

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## ❓ Questions?

Feel free to:
- Open a GitHub Discussion
- Create an issue with the `question` label
- Contact maintainers directly

Thank you for helping make the Power Whip Configuration Tool better! 🎉