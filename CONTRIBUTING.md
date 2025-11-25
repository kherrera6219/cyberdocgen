# Contributing to CyberDocGen

Thank you for your interest in contributing to CyberDocGen! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Submitting Changes](#submitting-changes)
- [Testing](#testing)
- [Documentation](#documentation)
- [Security](#security)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 16
- npm or yarn package manager
- Git

### Setting Up Your Development Environment

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/your-username/cyberdocgen.git
   cd cyberdocgen
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Set Up the Database**
   ```bash
   npm run db:push
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```

For detailed setup instructions, see [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md).

## Development Workflow

### Branch Naming Convention

Use descriptive branch names with the following prefixes:

- `feature/` - New features (e.g., `feature/add-sso-integration`)
- `fix/` - Bug fixes (e.g., `fix/authentication-timeout`)
- `docs/` - Documentation updates (e.g., `docs/update-api-guide`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-auth-flow`)
- `test/` - Test additions or modifications (e.g., `test/add-mfa-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `security`: Security improvements

**Examples:**
```
feat(auth): add OAuth2 integration

Implement OAuth2 authentication flow with support for
Google and Microsoft identity providers.

Closes #123
```

```
fix(document-generation): handle empty document templates

Add validation to prevent crashes when document template
is empty or malformed.

Fixes #456
```

## Code Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Enable strict mode (`strict: true` in tsconfig.json)
- Avoid using `any` type; use proper types or `unknown`
- Use interfaces for object shapes
- Use type aliases for unions and complex types

### Code Style

We use ESLint and Prettier for code formatting:

```bash
npm run check  # Type checking
npx eslint .   # Linting
npx prettier --write .  # Formatting
```

**Key Style Points:**
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use arrow functions for callbacks
- Prefer `const` over `let`; avoid `var`
- Use meaningful variable and function names

### React Guidelines

- Use functional components with hooks
- Keep components small and focused (< 200 lines)
- Use TypeScript for props and state
- Implement proper error boundaries
- Use React Query for server state management
- Avoid prop drilling; use context or composition

### Security Guidelines

- Never commit secrets, API keys, or credentials
- Validate all user inputs
- Sanitize data before rendering
- Use parameterized queries for database operations
- Implement proper authentication checks
- Follow the principle of least privilege
- Log security-relevant events

## Submitting Changes

### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run check          # Type checking
   npm test               # Run tests
   npm run build          # Verify build succeeds
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Use the PR template
   - Provide a clear description
   - Link related issues
   - Request reviews from maintainers

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows the project's style guidelines
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No sensitive data in code
- [ ] Build succeeds without warnings
- [ ] Changes are backward compatible (or breaking changes documented)

### Code Review Process

- At least one maintainer approval required
- All CI checks must pass
- Address all review comments
- Squash commits if requested
- Maintainers will merge approved PRs

## Testing

### Running Tests

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report
```

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies

**Test Structure:**
```typescript
describe('Feature', () => {
  it('should behave as expected', () => {
    // Arrange
    const input = setupTestData();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

See [TESTING.md](docs/TESTING.md) for detailed testing guidelines.

## Documentation

### When to Update Documentation

Update documentation when:
- Adding new features
- Changing APIs or interfaces
- Modifying configuration options
- Fixing bugs that affect documented behavior
- Adding new environment variables
- Changing deployment procedures

### Documentation Standards

- Use clear, concise language
- Provide examples
- Keep README.md up to date
- Update API documentation in `docs/API.md`
- Add inline comments for complex logic
- Use JSDoc for functions and classes

## Security

### Reporting Security Vulnerabilities

**DO NOT** create public issues for security vulnerabilities.

Instead, email security concerns to the maintainers with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Best Practices

- Run `npm audit` regularly
- Keep dependencies up to date
- Review security advisories
- Use environment variables for secrets
- Implement proper authentication and authorization
- Validate and sanitize all inputs
- Use HTTPS in production
- Enable security headers

## Getting Help

- Check existing [documentation](docs/)
- Search [existing issues](https://github.com/kherrera6219/cyberdocgen/issues)
- Ask questions in discussions
- Join our community chat (if available)

## License

By contributing to CyberDocGen, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CyberDocGen! Your efforts help make this project better for everyone.
