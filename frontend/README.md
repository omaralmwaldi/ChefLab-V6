# ChefLab Frontend

Next.js app for ChefLab (TailwindCSS, Axios, Tiptap).

## Setup

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_URL to your Django API (e.g. http://localhost:8000/api)
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Log in with a user created via the Django API (or admin). Unauthenticated users are redirected to `/login`.

## Pages

- **Login** (`/login`) — Email + password, JWT stored in localStorage.
- **Dashboard** (`/dashboard`) — Links to Create Recipe, Ingredients, Categories.
- **Create Recipe** (`/recipes/create`) — Recipe info, ingredients table (selector + quantity), Tiptap instructions editor.
- **Ingredients** (`/ingredients`) — List, add, edit, delete ingredients.
- **Categories** (`/categories`) — List, add, edit, delete categories.

## Backend

Start the Django backend (from `backend/`) so the API is available at `NEXT_PUBLIC_API_URL`.
