# Overview

ComplianceAI is a web application that helps organizations generate compliance documentation for various security frameworks including ISO 27001, SOC 2, FedRAMP, and NIST CSF. The application uses OpenAI's GPT models to automatically generate tailored compliance documents based on company profile information, streamlining the complex process of regulatory compliance preparation.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (August 2025)

## Medium-Term UX Enhancement Integration Complete (August 14, 2025 - Latest)
- **Navigation Infrastructure**: Successfully integrated GlobalSearch and Breadcrumbs components into header layout providing intelligent search across documents, profiles, and pages with keyboard shortcuts (Cmd/Ctrl+K)
- **Onboarding Enhancements**: Integrated WelcomeTutorial and QuickStartChecklist components into home page for guided first-time user experience with progress tracking
- **Contextual Help System**: Added HelpTooltip components throughout company profile forms providing framework-specific guidance and best practices
- **Document Generation Customization**: Integrated GenerationCustomizer component into dashboard enabling advanced AI document generation with custom parameters, quality settings, and framework-specific configurations
- **Collaborative Document Workflow**: Successfully created and integrated DocumentComments system providing real-time commenting, approval workflows, threaded discussions, and team collaboration features
- **Advanced Template Management**: Implemented DocumentTemplates system with template creation, variable extraction, framework categorization, and reusable content management
- **Enhanced Layout System**: Updated layout components to include breadcrumb navigation and global search functionality improving user orientation and content discovery
- **Component Integration**: All medium-term enhancement components successfully created and properly integrated into existing page structures without breaking functionality

## Major Code Cleanup and TypeScript Improvements (August 14, 2025)
- **Complete TypeScript Error Resolution**: Successfully achieved 100% error elimination - reduced LSP diagnostic errors from 31+ to 0, achieving perfect type safety
- **MemStorage Interface Compliance**: Completed full IStorage interface implementation with proper type handling for all CRUD operations including documents, company profiles, users, and generation jobs
- **Audit Service Type Safety**: Fixed all enum type mismatches and error handling in audit trail system with proper type constraints and unknown error handling
- **TODO Comment Resolution**: Addressed organization context TODOs by implementing proper user context integration throughout the application
- **Database Storage Optimization**: Enhanced DatabaseStorage class with proper null handling, array type safety, and comprehensive type checking
- **Error Handling Improvements**: Standardized error handling across all services using proper TypeScript unknown type patterns, replacing all console.error with structured logging
- **Build System Validation**: Confirmed successful production builds with no TypeScript compilation errors
- **Code Quality Enhancement**: Maintained full functionality while achieving perfect type safety and significantly improved code quality

## Major Enhancements Completed
- **Security & Middleware**: Implemented comprehensive security middleware with rate limiting, input sanitization, CSRF protection, and enhanced error handling
- **User Experience Improvements**: Added welcome wizard onboarding flow, loading skeleton components, error boundaries, and persistent storage hooks
- **Enhanced Dashboard**: Integrated document template previews, improved generation progress tracking, and comprehensive statistics display
- **Component Architecture**: Refactored layout system with better error handling and state management
- **Performance Optimizations**: Added parallel component loading, improved caching strategies, and better form validation

## Authentication System Implementation (August 14, 2025)
- **Database Integration**: Successfully migrated from in-memory storage to PostgreSQL with Drizzle ORM
- **User Management**: Implemented comprehensive user profiles, organizations, and multi-tenant architecture
- **Replit Authentication**: Integrated OpenID Connect authentication with session management and token refresh
- **Authorization**: Added role-based access control with user, admin, and organization admin roles
- **Frontend Authentication**: Created landing page for logged-out users and authenticated home page
- **Multi-tenant Support**: Added organization-based data isolation and user-organization relationships
- **Enhanced Schema**: Extended database schema with users, organizations, user memberships, and audit trails

## Enhanced Company Profile & Document Workspace (August 14, 2025)
- **Enhanced Company Profile Form**: Created comprehensive multi-tab company profile form with key personnel management, framework configurations, and compliance settings
- **Key Personnel System**: Added support for CEO, CISO, Security Officer, Compliance Officer, IT Manager, and Legal Counsel with email contacts for accurate SOP listings
- **Framework-Specific Configurations**: Implemented FedRAMP (Low/Medium/High), NIST 800-53 Rev 5 (20 control families), and SOC 2 trust service configurations
- **Document Upload & RAG**: Built file upload component with drag-and-drop support and simulated AI document extraction for auto-populating company information
- **Document Workspace**: Created comprehensive document management interface with AI-powered generation, template previews, and collaborative editing capabilities
- **Object Storage Integration**: Successfully set up cloud storage with bucket configuration for document and asset management
- **Enhanced UI Components**: Added Progress, Badge, and enhanced form components for better user experience

## Audit Trail & Document Versioning System (August 14, 2025 - Latest)
- **Comprehensive Audit Trail**: Implemented full activity logging system tracking all user actions across documents, company profiles, and system entities
- **Document Version Control**: Built complete versioning system with version history, change tracking, and restoration capabilities
- **Audit Trail Interface**: Created detailed audit log viewer with filtering, search, and comprehensive activity statistics
- **Version Management UI**: Developed version timeline interface with comparison tools, restoration options, and change visualization
- **Document Approvals**: Added approval workflow system with role-based approvals and tracking
- **Database Schema Extensions**: Extended schema with audit_trail, document_versions, and document_approvals tables
- **Audit & Version Services**: Created comprehensive backend services for audit logging and version management with integrity verification

## Advanced Multi-Model AI Integration (August 14, 2025 - All Phases Complete)
- **Phase 1 - Core AI Integration**: Successfully integrated Anthropic Claude 4.0 Sonnet alongside OpenAI GPT-4o with intelligent orchestration
- **Phase 2 - Advanced AI Features**: Completed comprehensive AI enhancement suite with document analysis, chatbot, risk assessment, and quality scoring
- **Document Analysis & RAG System**: Built intelligent document analysis with company profile extraction and retrieval-augmented generation capabilities
- **AI-Powered Compliance Chatbot**: Created conversational AI assistant with framework-specific guidance and document context awareness
- **Advanced Risk Assessment Engine**: Implemented comprehensive organizational risk analysis with threat landscape intelligence and compliance gap identification
- **Quality Scoring & Analytics**: Developed AI-driven document quality assessment with framework alignment checking and improvement recommendations
- **Enhanced Analytics Dashboard**: Built comprehensive analytics interface with quality trends, risk analysis, framework progress, and AI usage metrics
- **API Architecture**: Extended backend with 10+ new AI service endpoints supporting all Phase 2 features with proper authentication and audit logging
- **Multi-Model Health Monitoring**: Operational health check system for real-time AI service status monitoring across all features

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
The application uses a robust PostgreSQL-based storage architecture:

- **Database ORM**: Drizzle ORM with full PostgreSQL integration and type-safe operations
- **Schema Design**: Comprehensive entities including users, organizations, user memberships, company profiles, documents, and generation jobs
- **Current Implementation**: Full PostgreSQL database integration with Neon serverless database service
- **Data Relationships**: Complex relational model with foreign keys, indexes, and proper constraints
- **Multi-tenancy**: Organization-scoped data access with user-organization membership management
- **Audit Trails**: Comprehensive tracking of user actions with created/updated timestamps and user references

## Security and Middleware
Comprehensive security implementation including:
- **Rate Limiting**: Multiple tiers for general requests, authentication, and document generation
- **Input Sanitization**: Prevents XSS and injection attacks through request sanitization
- **Security Headers**: Implements CORS, XSS protection, content type validation, and frame options
- **Error Handling**: Enhanced error boundaries with logging and user-friendly error states
- **Request Validation**: Validates content types, request sizes, and data integrity

## Authentication and Authorization  
The application now includes a comprehensive authentication system using Replit's OpenID Connect integration:

- **User Authentication**: Secure login/logout flow with automatic token refresh and session management
- **User Profiles**: Complete user management with profile information, roles, and activity tracking
- **Multi-tenant Architecture**: Organization-based isolation with user-organization memberships and role-based permissions
- **Session Storage**: Persistent PostgreSQL-backed sessions with configurable TTL and secure cookie settings
- **Authorization Middleware**: Protected routes with authentication checks and user context injection
- **Frontend Integration**: Conditional rendering based on authentication state with landing and home pages

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