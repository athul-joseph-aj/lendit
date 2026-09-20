# LendIt — Shared Foundation

Welcome to the **LendIt** platform foundation repository. This branch (`main`) contains the shared architecture, UI components, authentication, routing, and i18n system.

## 🛠 Tech Stack
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS v3
- **Routing:** React Router v6
- **Backend:** Firebase (Auth, Firestore, Storage)
- **Icons:** Lucide React

## 🚀 Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase project credentials in `.env`. (DO NOT commit `.env`)

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 🏗 Team Workflow (IMPORTANT)

This repository is designed for a 3-person team. **Do NOT push directly to `main`!**

Depending on your assigned module, create and switch to your feature branch:

```bash
# Developer 1: Rental Customer Features
git checkout -b feature/rental-user

# Developer 2: Rental Owner Features
git checkout -b feature/rental-owner

# Developer 3: Local Services Features
git checkout -b feature/services
```

### Development Rules:
- **Reuse Components:** Use the shared components in `src/components/` (Button, Card, Input, etc.). Do not build your own generic buttons.
- **Translations:** Do not hardcode UI text. Add keys to the JSON files in `src/locales/` and use the `useTranslation` hook.
- **Database:** Refer to `src/firebase/collections.js` for the agreed-upon Firestore schema.
- **Git Flow:** Commit frequently, pull from `main` to keep your branch updated, and use Pull Requests to merge back.
