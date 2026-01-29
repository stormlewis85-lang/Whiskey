# WhiskeyPedia Architecture

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  Express API    │────▶│  PostgreSQL     │
│  (TypeScript)   │     │  (Node.js)      │     │  Database       │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Anthropic API  │
                        │  (AI Tasting)   │
                        └─────────────────┘
```

## Folder Structure

```
whiskeypedia/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Buttons, inputs, modals
│   │   │   ├── whiskey/       # Whiskey-specific components
│   │   │   ├── review/        # Review form, display
│   │   │   └── layout/        # Header, nav, footer
│   │   ├── pages/             # Route-level components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Collection.tsx
│   │   │   ├── WhiskeyDetail.tsx
│   │   │   ├── AddWhiskey.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── Auth/
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API client functions
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Helper functions
│   │   └── App.tsx            # Root component + routing
│   ├── public/
│   └── vite.config.ts
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth.ts
│   │   │   ├── whiskeys.ts
│   │   │   ├── reviews.ts
│   │   │   ├── distilleries.ts
│   │   │   ├── flights.ts
│   │   │   └── ai.ts
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── models/            # Database queries/ORM
│   │   ├── services/          # Business logic
│   │   │   ├── reviewScoring.ts    # Weighted score calculation
│   │   │   └── aiTasting.ts        # Anthropic integration
│   │   ├── utils/
│   │   └── index.ts           # Server entry point
│   └── package.json
│
├── database/
│   ├── migrations/            # Schema migrations
│   ├── seeds/                 # Seed data (distilleries)
│   └── schema.sql             # Current schema reference
│
├── specs/                     # Project documentation
│   ├── ARCHITECTURE.md        # This file
│   ├── DATABASE.md
│   ├── API.md
│   ├── REVIEW-SYSTEM.md
│   ├── TESTING.md
│   └── TASKS.md
│
├── tests/                     # Test files
│   ├── api/                   # API integration tests
│   ├── unit/                  # Unit tests
│   └── e2e/                   # End-to-end tests
│
├── CLAUDE.md                  # Claude Code instructions
├── .env                       # Environment variables (not in git)
├── .env.example               # Template for env vars
└── package.json               # Root package.json (workspaces)
```

## Data Flow

### Authentication Flow
```
1. User submits login form
2. POST /api/auth/login with credentials
3. Server validates, generates JWT
4. JWT stored in httpOnly cookie
5. All subsequent requests include cookie
6. Middleware extracts user from token
7. User ID available in req.user
```

### Adding a Whiskey
```
1. User fills AddWhiskey form
2. Form validates client-side
3. POST /api/whiskeys with whiskey data
4. Server validates + sanitizes
5. Insert into whiskeys table with user_id
6. Return created whiskey
7. Client updates local state
8. Redirect to collection
```

### Creating a Review
```
1. User opens review form for whiskey
2. Selects ratings for 6 components
3. Adds tasting notes (optional)
4. Can request AI-generated notes
5. POST /api/reviews
6. Server calculates weighted scores
7. Generates 5-star and 100-point values
8. Stores review linked to whiskey + user
9. Updates whiskey's average rating
```

## Key Design Decisions

### Why Weighted Reviews?
Simple 5-star ratings lack nuance. The 6-component system lets enthusiasts capture complexity while still outputting familiar formats (5-star, 100-point) for casual sharing.

### Why JWT in Cookies?
HttpOnly cookies prevent XSS attacks from stealing tokens. More secure than localStorage for auth tokens.

### Why Anthropic for AI?
Claude excels at nuanced, descriptive writing—perfect for expanding terse tasting notes into rich descriptions.

## Environment Variables

```
# Database
DATABASE_URL=postgresql://user:pass@host:5432/whiskeypedia

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Server
PORT=3001
NODE_ENV=development

# Client
VITE_API_URL=http://localhost:3001/api
```

## External Dependencies

### Frontend
- react, react-dom, react-router-dom
- @tanstack/react-query (data fetching)
- tailwindcss (styling)
- lucide-react (icons)
- zod (validation)

### Backend
- express
- pg (PostgreSQL client)
- jsonwebtoken
- bcrypt
- @anthropic-ai/sdk
- cors, helmet, cookie-parser

## Performance Considerations

- Pagination on collection queries (default 20 per page)
- Eager loading for whiskey + distillery joins
- Client-side caching with React Query
- Debounced search inputs
- Lazy loading for images (future)
