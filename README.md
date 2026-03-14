# NeoTaste Roadmap

A product roadmap sequencing tool built with Next.js 15, Drizzle ORM, and Neon (PostgreSQL). Drag-and-drop initiative cards across Now / Next / Later / Parked columns, filter by product track, and edit inline.

## Tech stack

- **Next.js 15** (App Router, Server Actions)
- **TypeScript** + **Tailwind CSS**
- **Drizzle ORM** + **Neon** (serverless Postgres)
- **@dnd-kit** for drag-and-drop

## Local setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url> && cd neotaste-roadmap
   npm install
   ```

2. Create a Neon project at [neon.tech](https://neon.tech) and copy the connection string.

3. Add your connection string to `.env.local`:
   ```
   DATABASE_URL=postgresql://...
   ```

4. Push the schema and seed the database:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push the repo to GitHub.
2. Connect the repo in the [Vercel dashboard](https://vercel.com/new).
3. Add the `DATABASE_URL` environment variable in Vercel project settings.
4. Deploy.
