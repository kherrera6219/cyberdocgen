# Overview

ComplianceAI is a web application that helps organizations generate compliance documentation for various security frameworks including ISO 27001, SOC 2, FedRAMP, and NIST CSF. The application uses OpenAI's GPT models to automatically generate tailored compliance documents based on company profile information, streamlining the complex process of regulatory compliance preparation.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. The application follows a modern component-based architecture with:

- **UI Framework**: Radix UI primitives with shadcn/ui components for consistent, accessible design
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management and React Hook Form for form handling
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Organized into pages, components (layout and UI), hooks, and utilities

The frontend uses a three-page layout (Dashboard, Company Profile, Documents) with a sidebar navigation system that categorizes compliance frameworks and document types.

## Backend Architecture
The backend is an Express.js server with TypeScript that provides a REST API for managing compliance data:

- **Framework**: Express.js with middleware for JSON parsing, logging, and error handling
- **API Design**: RESTful endpoints for company profiles, documents, and generation jobs
- **Data Validation**: Zod schemas for type-safe data validation
- **Storage**: Pluggable storage interface with in-memory implementation (ready for database integration)
- **AI Integration**: OpenAI service for generating compliance documents using GPT-4

## Data Storage Solutions
The application uses a flexible storage architecture:

- **Database ORM**: Drizzle ORM configured for PostgreSQL with migrations support
- **Schema Design**: Three main entities - company profiles, documents, and generation jobs
- **Current Implementation**: In-memory storage for development with interface ready for PostgreSQL integration
- **Data Relationships**: Foreign key relationships between profiles and documents/jobs

## Authentication and Authorization
Currently no authentication system is implemented - the application assumes single-tenant usage. The architecture is prepared for future auth integration through middleware patterns.

## AI Document Generation
The core feature uses OpenAI's API to generate compliance documents:

- **Model**: GPT-4 for high-quality document generation
- **Templates**: Predefined document templates for each compliance framework
- **Context**: Company profile information is used to customize generated content
- **Progress Tracking**: Generation jobs track progress and status of batch document creation

# External Dependencies

## Third-Party Services
- **OpenAI API**: Core service for AI-powered document generation using GPT-4 model
- **Neon Database**: Serverless PostgreSQL database service (configured but not actively used)

## Key Libraries and Frameworks
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Radix UI, shadcn/ui, TanStack Query, React Hook Form, Wouter
- **Backend**: Express.js, TypeScript, Drizzle ORM, Zod validation
- **Development**: ESBuild for production builds, TSX for development server
- **UI Components**: Comprehensive set of Radix UI primitives wrapped in shadcn/ui components

## Database and ORM
- **Drizzle ORM**: Type-safe database interactions with PostgreSQL support
- **Migration System**: Database schema migrations managed through Drizzle Kit
- **Schema Definition**: Centralized schema definitions with Zod validation integration

## Development Tools
- **Build System**: Vite for frontend bundling, ESBuild for backend compilation
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Code Quality**: Path aliases for clean imports, strict TypeScript configuration