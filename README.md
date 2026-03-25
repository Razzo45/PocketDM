# PocketDM (MVP)

Text-first, theatre-of-the-mind “Dungeon Master in your pocket”.

## Setup

1. Install dependencies

```bash
npm install
```

2. Set environment variables in `.env`

- `DATABASE_URL="file:./dev.db"`
- `OPENROUTER_API_KEY="..."` (required for AI calls)
- Optional: `OPENROUTER_MODEL="google/gemini-2.0-flash-lite"`
- Optional: `AI_PROVIDER="openrouter"`

3. Create DB + generate Prisma client

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

4. Run the app

```bash
npm run dev
```

Open the app, generate a campaign, and you’ll be redirected into the session chat.

## Deploy to Vercel

1. Push this project to GitHub/GitLab.
2. Import it in Vercel.
3. Add Environment Variables in Vercel:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL` (optional)
   - `AI_PROVIDER` (optional, default `openrouter`)
   - `DATABASE_URL`

### Neon / Postgres (recommended)

Set `DATABASE_URL` to your Neon connection string (the pooled URL is fine).

Then run Prisma migrations against Neon (locally, or using a CI step):

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
