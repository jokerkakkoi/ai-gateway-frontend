# AGENTS.md

## Project Scope

This folder is a standalone frontend repository for the AI Gateway FinOps console. It is a Vite + React + TypeScript app focused on team governance, billing, token-cost calculation, API key risk, and budget controls.

## Commands

- Install dependencies: `npm install`
- Start local development server: `npm run dev`
- Run tests: `npm test`
- Build production assets: `npm run build`

Before handing work back, run `npm test` and `npm run build` from this `frontend` directory.

## Code Guidelines

- Keep business math in `src/finops.ts` and cover it with Vitest tests in `src/finops.test.ts`.
- Keep UI state local unless a real backend/API integration is introduced.
- Use TypeScript types for new data shapes and avoid `any`.
- Prefer existing visual patterns in `src/App.tsx` and `src/styles.css` before adding new abstractions.
- Use `lucide-react` icons for controls and navigation.

## Design Guidelines

- This is an operational FinOps dashboard, not a marketing page.
- Favor dense, scannable layouts with clear hierarchy, restrained surfaces, and explicit states.
- Preserve the team-governance direction: budget rules, member quotas, API key risk, billing queue, model prices, routing, and token calculator should remain first-class concepts.
- Avoid oversized hero sections, decorative gradients, nested cards, and purely cosmetic visual elements.
- Check desktop and mobile layouts for text overflow and horizontal scrolling.

## Git Notes

This `frontend` directory has its own Git repository. Do not assume the parent directory's repository is the source of truth for frontend commits.

Generated or local-only files should stay ignored: `node_modules/`, `dist/`, logs, `.vite/`, `.env*`, and TypeScript build info.
