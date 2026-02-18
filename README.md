# OurHome - Shared Dashboard for Couples

A beautiful, cozy web application for couples to manage their shared life together. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Authentication** - Secure login/registration via Supabase Auth
- **Tasks** - Shared to-do list with completion tracking
- **Shopping** - Shopping list with estimated prices and total calculation
- **Movies** - Movie watchlist with Kinopoisk API integration
- **Finance** - Savings goals and expense tracking
- **Calendar** - Shared calendar with events
- **Wishlist** - Gift ideas with priority and reservation system
- **Memories** - Timeline of shared moments

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Lucide Icons, React Calendar
- **APIs**: Kinopoisk API for movie search

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Kinopoisk API key (optional, for movies feature)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd family
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase/migrations.sql`
3. This will create all necessary tables and RLS policies

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your values:

```env
# From Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Get from https://kinopoisk.dev
NEXT_PUBLIC_KINOPOISK_API_KEY=your-api-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create Your Accounts

1. Register two accounts (one for each partner)
2. Both accounts will have access to all shared data
3. Each item shows who added it via avatar

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_KINOPOISK_API_KEY`
4. Deploy!

### 3. Configure Supabase for Production

In Supabase Dashboard > Authentication > URL Configuration:
- Add your Vercel URL to "Site URL"
- Add `https://your-app.vercel.app/**` to "Redirect URLs"

## Project Structure

```
src/
├── app/
│   ├── (app)/           # Protected routes
│   │   ├── dashboard/   # Main dashboard
│   │   ├── tasks/       # To-do list
│   │   ├── shopping/    # Shopping list
│   │   ├── movies/      # Movie watchlist
│   │   ├── finance/     # Goals & expenses
│   │   ├── calendar/    # Shared calendar
│   │   ├── wishlist/    # Gift ideas
│   │   ├── memories/    # Memory timeline
│   │   └── profile/     # User settings
│   ├── page.tsx         # Login page
│   └── layout.tsx       # Root layout
├── components/
│   ├── Avatar.tsx       # User avatar component
│   └── Sidebar.tsx      # Navigation sidebar
└── lib/
    ├── database.types.ts # TypeScript types
    └── supabase/        # Supabase clients
```

## Database Schema

The app uses the following tables:

- `profiles` - User profiles (linked to auth.users)
- `todos` - Tasks
- `shopping_items` - Shopping list items
- `movies` - Movie watchlist
- `goals` - Savings goals
- `expenses` - Expense tracking
- `events` - Calendar events
- `wishes` - Wishlist items
- `memories` - Memory entries

All tables have Row Level Security (RLS) enabled for data protection.

## Customization

### Colors

Edit `tailwind.config.ts` to change the color scheme:

```typescript
colors: {
  background: "#f9f7f5",  // Main background
  card: "#e6d7ce",        // Card backgrounds
  accent: "#b8a9a1",      // Accent color
  primary: "#8b7355",     // Primary actions
  // ... more colors
}
```

### Fonts

The app uses Inter font. Change in `src/app/globals.css`.

## License

MIT License - feel free to use for personal projects!

---

Made with love for couples to share their life together.
