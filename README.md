# MealPlanner

[![Node](https://img.shields.io/badge/node-22.14.0-green)](https://nodejs.org) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Secure and personal AI-powered nutrition calculator for home recipes. MealPlanner analyses user-provided ingredients and automatically returns calories and macronutrients (protein, fat, carbs) with up to 90 % accuracy. Store private recipes, tailor dietary preferences, and edit nutritional data whenever needed.

## Table of Contents
1. Tech Stack
2. Getting Started Locally
3. Available Scripts
4. Project Scope
5. Project Status
6. License

## Tech Stack

**Frontend**  
- Astro 5.5.5  
- React 19.0.0  
- TypeScript 5  
- Tailwind CSS 4.0.17  
- Shadcn/ui  
- Lucide-react

**Backend & Infrastructure**  
- Supabase (PostgreSQL, Auth)  
- OpenRouter.ai (LLM access for ingredient parsing)  
- GitHub Actions (CI/CD)  
- DigitalOcean Docker image (deployment)

**Testing**  
- Vitest (Unit & Integration Testing)
- React Testing Library (Component Testing)
- Playwright (E2E Testing)
- Mock Service Worker (API Mocking)

## Getting Started Locally

### Prerequisites  
- Node.js 22.14.0 (see `.nvmrc`)  
- npm 10+

1. Clone the repository
```bash
git clone https://github.com/paulinablaszk/10xdevs_meal
cd mealplanner
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Build and preview production version
```bash
npm run build
npm run preview
```

## Available Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the development server with live reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the built production app |
| `npm run lint` | Run ESLint against all source files |
| `npm run lint:fix` | Run ESLint and automatically fix problems |
| `npm run format` | Format files with Prettier |
| `npm run astro` | Run Astro CLI commands |

## Project Scope

**Included in MVP**  
- User authentication (Supabase)  
- Private recipe CRUD (create, read, update, delete)  
- User dietary preferences (allergens, daily kcal, macro goals)  
- AI calorie & macro calculation with manual correction option  
- Validation and clear error handling when AI cannot parse ingredients

**Out of scope for MVP**  
- Importing recipes from external URLs  
- Media uploads (photos, video)  
- Sharing or social features  
- Advanced analytics, payment integrations, production-grade scaling

## Project Status

Version 0.0.1 – Minimum Viable Product under active development.  
Next milestone: reach ≤10 % average error in nutritional calculations across test set of 10 recipes.

## License

This project is licensed under the MIT License – see the [LICENSE](./LICENSE) file for details.
