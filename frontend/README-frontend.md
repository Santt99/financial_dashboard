# Frontend (React + TypeScript + MUI)

Implements the Financial Dashboard UI with two-column layout:

- Left: Chat (upload statements, send messages)
- Right: Dashboard (summary + per-card details)

## Scripts

```bash
npm install
npm run dev      # start Vite dev server
npm run build    # production build
npm run preview  # preview build
```

## Structure
```
src/
  contexts/  # Auth, Data, Chat global state
  components/ # (future granular components)
  types/     # Shared TypeScript interfaces matching backend
  App.tsx    # Layout & composition
  main.tsx   # Entry point
```

## Environment
All API calls currently hard-coded to `http://localhost:8000`. For customization create `src/config.ts` and replace constants.

## Improvements Roadmap
- Extract dedicated components: CategoryChart, ProjectionChart, UpcomingPaymentsList.
- Integrate chart library (Recharts or Chart.js) for visualizations.
- Better error/loading states & skeletons.
- Token refresh & secure storage (httpOnly cookie approach).
- File upload progress indicator.
- Responsive tweaks for mobile stacking.

## Styling
Material UI used for rapid prototyping. Theme can be extended in `main.tsx` via `createTheme()`.

## Testing (Future)
Use React Testing Library + Jest to cover context logic and components.
