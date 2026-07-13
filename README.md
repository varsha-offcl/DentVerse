# DentVerse

AI-first dental practice management platform — staff dashboards (Doctor, Receptionist, Admin) plus an AI receptionist backend for patient onboarding over WhatsApp, Instagram, and Facebook.

This repository contains **application source code only**. All project documentation — architecture, database schema, API docs, SOPs, tech stack, ADRs, milestones, and setup guides — lives in a separate repository:

**→ [`C:\work\DentVerseDocs`](../DentVerseDocs/README.md)**

## Quick start

```bash
npm install
npm run dev
```

See [`DentVerseDocs/13-setup-guides/frontend-setup.md`](../DentVerseDocs/13-setup-guides/frontend-setup.md) for full setup details, stack notes, and what's mock vs. real at the current stage.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui. Backend (Supabase + a NestJS AI orchestrator) is planned but not yet built — see [`DentVerseDocs/12-milestones/development-milestones.md`](../DentVerseDocs/12-milestones/development-milestones.md).
