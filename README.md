# PocketDM (MVP)

Text-first, theatre-of-the-mind "Dungeon Master in your pocket".

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```env
DATABASE_URL="postgresql://..."
AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="..."
OPENROUTER_MODEL="google/gemini-3.1-flash-lite-preview"
```

3. Apply migrations and generate Prisma client:

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

4. Run:

```bash
npm run dev
```

## Vercel deployment

- Framework preset: `Next.js`
- Root directory: `./`
- Output directory: leave empty (`Next.js default`)
- Build command: `npm run vercel-build`

Required env vars in Vercel:
- `DATABASE_URL`
- `AI_PROVIDER`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (optional)

## Notes on dice animation

The d20 roll UI uses a lightweight Three.js component and is server-authoritative:
- server computes roll result via `/api/session/roll`
- animation is cosmetic and settles to server-provided value

Reference interaction inspiration: [Major's 3D Dice Roller](https://majorvictory.github.io/3DDiceRoller/).
