# ಕನ್ನಡಪ್ರಭ — Kannada Prabha

A Kannada-language news website built with **Next.js 16** (App Router), **React 19**,
**TypeScript 5**, and **Tailwind CSS v4**. This repository is currently a **clean skeleton**
— folder structure, language, font, and theme are configured, but no real UI, article
pages, or API integrations are built yet.

It mirrors the architecture of a sister site (Dinamani — a Tamil news site), adapted for
Kannada (`lang="kn"`, Noto Sans Kannada font).

## Tech stack

| Area          | Choice                                  |
| ------------- | --------------------------------------- |
| Framework     | Next.js 16 (App Router)                 |
| UI            | React 19 · TypeScript 5                 |
| Styling       | Tailwind CSS v4 (`@tailwindcss/postcss`)|
| Theme         | next-themes (`darkMode: "class"`)       |
| Language      | Kannada (`lang="kn"`)                    |
| Fonts         | Noto Sans Kannada + Roboto (next/font)  |
| Path alias    | `@/*` → `./src/*`                        |
| Output        | `standalone` (Docker-friendly)          |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the Kannada homepage
heading **ಕನ್ನಡಪ್ರಭ** rendered in the Noto Sans Kannada font.

## Scripts

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `npm run dev`    | Start the dev server              |
| `npm run build`  | Production build                  |
| `npm run start`  | Start the production server       |
| `npm run lint`   | Run ESLint                        |
| `npm run format` | Format with Prettier              |

## Cloning for another language

`src/config/site.ts` is the **single source of truth** for brand, locale, domain, and
navigation. To spin up a sister site for another language, edit that file (and swap the
Kannada font in `src/app/layout.tsx`).

## Environment variables

Copy `.env.example` to `.env.local` and fill in values. See that file for documentation.
