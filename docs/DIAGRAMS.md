# CyberDocGen Diagrams

This page consolidates the high-level diagrams that are normally expected in a production repository: system context, deployment topology, AI request flow, and evidence ingestion flow.

For the narrative architecture document, see [ARCHITECTURE.md](ARCHITECTURE.md).

## 1. System Context

```mermaid
flowchart LR
    User[Browser User or Desktop User]
    Client[React Client]
    Desktop[Electron Shell]
    API[Express API]
    Services[Compliance, Auth, MCP, Connector Services]
    DB[(PostgreSQL or SQLite)]
    Storage[(Cloud Object Storage or Local Filesystem)]
    Providers[AI Providers]
    External[Drive, OneDrive, SharePoint, Jira, Notion]

    User --> Client
    User --> Desktop
    Desktop --> Client
    Client --> API
    API --> Services
    Services --> DB
    Services --> Storage
    Services --> Providers
    Services --> External
```

## 2. Deployment Modes

```mermaid
flowchart TD
    Start[CyberDocGen Runtime]
    Mode{DEPLOYMENT_MODE}
    Cloud[Cloud Mode]
    Local[Local Mode]

    Start --> Mode
    Mode -->|cloud or unset| Cloud
    Mode -->|local| Local

    Cloud --> CloudAuth[Enterprise auth enabled]
    Cloud --> CloudDb[PostgreSQL via Neon]
    Cloud --> CloudStorage[Cloud object storage]
    Cloud --> CloudFeatures[Multi-tenant features enabled]

    Local --> LocalAuth[Auth bypass provider]
    Local --> LocalDb[SQLite in local app data]
    Local --> LocalStorage[Local filesystem storage]
    Local --> LocalSecrets[Windows Credential Manager]
    Local --> LocalFeatures[Single-user desktop-safe feature set]
```

Source of truth: [server/config/runtime.ts](../server/config/runtime.ts).

## 3. AI Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Client UI
    participant API as API Route
    participant G as AI Guardrails
    participant O as AI Orchestrator
    participant M as Model Provider
    participant S as Storage and Audit

    U->>UI: Submit generation or analysis request
    UI->>API: POST /api/ai/*
    API->>G: Validate input, rate limits, redaction, injection checks
    G->>O: Forward safe request
    O->>M: Select provider and send prompt
    M-->>O: Return model output
    O-->>G: Structured result
    G-->>API: Safe response or rejection
    API->>S: Persist metadata, usage, audit trail
    API-->>UI: Return response
```

## 4. Evidence And Connector Flow

```mermaid
flowchart LR
    Source[SharePoint, Jira, Notion, Web, Drive, OneDrive]
    Connector[Connector or Cloud Integration Route]
    Snapshot[Snapshot and Evidence Pipeline]
    Extract[Extraction and Analysis Services]
    Map[Evidence Mapping and Compliance Workspace]
    Store[(Database and File Storage)]

    Source --> Connector
    Connector --> Snapshot
    Snapshot --> Store
    Snapshot --> Extract
    Extract --> Store
    Extract --> Map
```

## 5. Documentation Cross-Reference

- Architecture narrative: [ARCHITECTURE.md](ARCHITECTURE.md)
- API surface: [API_ENDPOINTS.md](API_ENDPOINTS.md)
- Deployment operations: [DEPLOYMENT.md](DEPLOYMENT.md)
- Security posture: [SECURITY.md](SECURITY.md) and [SECURITY_PRODUCTION_REVIEW.md](SECURITY_PRODUCTION_REVIEW.md)
