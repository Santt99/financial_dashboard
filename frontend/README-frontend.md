# Frontend (React + TypeScript + Material-UI)

Modern, Spanish-localized financial dashboard with real-time AI chat assistance and comprehensive card management.

## Layout

- **Main Views**: 
  - Login/Register (authentication)
  - Dashboard (overview & card selection)
  - Card Details (transactions, categories, projections)
  - Interest Analysis (MSI tracking and payment schedules)
  - Chat (AI financial advisor with streaming responses)

## Features

- **Responsive Design**: Mobile-friendly single-column layout
- **Spanish UI**: Full localization to Spanish (Mexico) with MXN currency formatting
- **Real-time Streaming Chat**: Character-by-character streaming with elegant markdown formatting
- **Drag-and-Drop Upload**: Statement upload with visual feedback
- **State Management**: Context API for Auth & Data
- **Material-UI Components**: Clean, professional design system

## Setup & Running

Install dependencies:

```bash
cd frontend
npm install
```

Start development server:

```bash
npm run dev
```

Access at `http://localhost:5173` (default Vite port)

Production build:

```bash
npm run build  # Creates optimized dist/
npm run preview # Test production build locally
```

## Project Structure

```
src/
  components/
    auth/          # Login & Register forms
    common/        # Shared UI components
    dashboard/     # Dashboard & card views
    routing/       # Navigation components
  contexts/
    AuthContext.tsx    # User authentication state
    DataContext.tsx    # Financial data & cards
  views/
    LoginView.tsx      # Login/Register page
    HomeView.tsx       # Main dashboard view
    ChatView.tsx       # AI Chat interface
    CalendarView.tsx   # Calendar-based analytics (future)
  types/
    api.ts             # Backend API interfaces
  utils/
    format.ts          # Currency & date formatting
  App.tsx              # Main app router
  main.tsx             # Vite entry point
  theme.ts             # MUI theme configuration
```

## Key Components

### ChatView
- Real-time streaming responses with natural delays
- Markdown-like rendering (bold, lists, headings)
- Auto-scroll on new messages
- Message history display

### Dashboard
- Card selection and switching
- Summary with total balance, minimum due, MSI overview
- Transaction list by card
- Spending category breakdown

### Interest Analysis
- Filter by card selection
- MSI plan details (monthly payment, progress)
- Payment schedule and progress indicators

## State Management

### AuthContext
Provides:
- `user` – Logged-in user object
- `token` – JWT bearer token
- `login()` – Login function
- `register()` – Register function
- `logout()` – Clear session

### DataContext
Provides:
- `summary` – Financial summary (all cards, balances)
- `selectedCard` – Currently selected card
- `selectCard()` – Switch card view
- `uploadStatement()` – Upload & process file

## API Integration

All endpoints use `http://localhost:8000` (configured in API calls).

### Authentication
```
POST /auth/register
POST /auth/login
```

### Dashboard & Cards
```
GET /dashboard/summary
GET /cards/
GET /cards/{id}
```

### Files
```
POST /files/upload
```

### Chat
```
POST /chat/ask-stream
POST /chat/ask
```

## Styling & Theme

Material-UI theme customizable in `src/theme.ts`:
- Primary color: Blue (`#1976d2`)
- Typography: Roboto font
- Responsive breakpoints: xs, sm, md, lg, xl

## Localization

All text and numbers are localized for Spanish (Mexico):
- **Date Format**: `DD/MM/YYYY`
- **Currency**: `$` prefix with MXN
- **Separators**: Comma for thousands, period for decimals
- **Language**: All UI text in Spanish

See `src/utils/format.ts` for formatting utilities.

## Streaming Chat Implementation

### Frontend (ChatView.tsx)
- Uses `fetch()` with streaming response (Response.body.getReader())
- Renders markdown-like formatting on-the-fly
- Maintains message history in component state

### Backend Integration (`/chat/ask-stream`)
- Streams response character-by-character
- Variable delays between characters for natural appearance
- Supports markdown formatting (bold, lists, headings)

### Markdown Parsing
- `**text**` → Bold heading
- `## Heading` → Section heading
- `1. Item` → Numbered list
- `- Item` → Bullet list
- Inline `**bold**` within paragraphs

## Error Handling

- API errors display as Material-UI Alert components
- Connection errors show user-friendly messages
- Loading states with CircularProgress spinners
- Form validation on auth screens

## Performance Optimizations

- Context-based state (no Redux overhead)
- Lazy component loading (async imports in App.tsx)
- Streaming for large responses (no blocking UI)
- CSS-in-JS with MUI (no additional stylesheet parsing)

## Security

- JWT tokens stored in React Context (session-scoped)
- Bearer token sent in Authorization header for all API calls
- No sensitive data logged to console
- For production: migrate to httpOnly cookies or secure storage

## Known Limitations

- Tokens lost on page refresh (no persistence)
- Chat history not saved (session-only)
- Large portfolios (50+ cards) may have performance impact
- Mobile layout still in development

## Improvements Roadmap

- **Persistence**: Save chat history to backend
- **Charts**: Spending trends, category pie charts with Recharts
- **Mobile**: Optimize for small screens (stack vs side-by-side)
- **Performance**: Virtual scrolling for large transaction lists
- **Accessibility**: ARIA labels, keyboard navigation
- **Testing**: Jest + React Testing Library coverage
- **Analytics**: Track user interactions, feature usage
- **Offline Support**: Service workers for offline browsing
- **Calendar View**: Date-based analytics and spending patterns

## Development

### Adding a New View

1. Create file in `src/views/`
2. Import in `App.tsx`
3. Add route in router
4. Update navigation menu

### Adding a New Component

1. Create folder in `src/components/{category}/`
2. Create `.tsx` file with component
3. Export from index (if needed)
4. Import and use in views

### Updating API Calls

1. Define interface in `src/types/api.ts`
2. Create service function (or inline in useEffect)
3. Use AuthContext for token
4. Handle errors with try-catch

## Dependencies

Key libraries:
- **react** – UI library
- **react-router-dom** – Navigation
- **@mui/material** – Component library
- **@emotion/react** – MUI styling
- **axios** – HTTP client (can be replaced with fetch)

## Testing (Future)

Planned with:
- Jest for unit tests
- React Testing Library for component tests
- Mock API responses with MSW (Mock Service Worker)

## License

Prototype code – adapt and extend freely.

