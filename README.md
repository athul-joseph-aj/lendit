# LendIt

LendIt is a community marketplace for renting items and booking trusted local service providers. It connects people who need something with owners and professionals who can provide it, while keeping requests, communication, payments, availability, and reviews in one place.

## Problem Statement

People often depend on informal contacts or scattered platforms to rent useful items or find reliable local service providers. This makes it difficult to compare options, verify availability, coordinate a time, protect private contact details, and build trust after a transaction.

Lenders and service providers also need a simple way to publish their offerings, manage requests, track earnings, and avoid accepting jobs when they are unavailable.

## Project Description

LendIt provides two connected marketplace experiences:

- **Item rentals:** Users can browse listings, filter by category, location, availability, and price, then request a rental for selected dates.
- **Local services:** Users can discover providers such as electricians, plumbers, cleaners, painters, and repair professionals, then submit a service request with a preferred date and time.
- **Owner and provider dashboards:** Lenders can manage listings, rental requests, active rentals, completed rentals, and earnings. Service providers can manage requests, availability, rescheduling proposals, completed jobs, and earnings.
- **Privacy-aware contact sharing:** A renter provides a phone number with a request. The number is kept in a separate private contact record and is revealed to the lender only after the request is accepted.
- **Platform fee accounting:** Completed rentals calculate a 5% platform fee and show the resulting owner payout and earnings breakdown.
- **Trust and reviews:** Users can review lenders and service providers after completed transactions. Ratings are used to display review counts and trust scores.
- **Rescheduling:** Providers can propose another date and time when the requested slot does not match their saved availability. The customer can accept or decline the proposal.
- **Authentication and localization:** Users can register with email/password or Google sign-in. The interface supports English, Hindi, Kannada, Malayalam, and Tamil.

## Google AI Usage

### Tools / Models Used

No Google AI tool or model is currently integrated into the submitted application. The current implementation uses Firebase and client-side application logic for marketplace, scheduling, accounting, and trust features.

### How Google AI Was Used

Google AI is not currently used at runtime or as a project dependency. This is documented here for submission transparency. Any future Gemini or Vertex AI integration should be added to this section together with corresponding evidence in the `/proofs` folder.

## Tech Stack Used

- React 19
- Vite
- React Router
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- Cloudinary image uploads
- Lucide React icons
- Vercel deployment

## Links

- **GitHub repository:** [athul-joseph-aj/lendit](https://github.com/athul-joseph-aj/lendit)

## Proof of Google AI Usage

The `/proofs` folder contains the current disclosure about Google AI usage. There is no Google AI usage proof to attach because no Google AI model or API is currently integrated in this version.

## Screenshots

https://drive.google.com/drive/folders/1u7fDk6dtMgr_7VvHmWAXDUZAOZrT1OaW?usp=drive_link

## Demo Video

https://drive.google.com/drive/folders/12TgxDR9E3o_4wT4dtUmO1mEn5JyE5nkm?usp=sharing

## Installation Steps

### Prerequisites

- Node.js 18 or later
- A Firebase project with Authentication and Cloud Firestore enabled
- Optional: Cloudinary credentials for image uploads

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/athul-joseph-aj/lendit.git
   cd lendit
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Add the Firebase and optional Cloudinary values to `.env`. Never commit `.env` or private credentials.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local URL shown by Vite, normally `http://localhost:5173`.

### Production build

```bash
npm run build
npm run preview
```

### Useful checks

```bash
npm run lint
```

## Project Structure

```text
src/
├── components/       Reusable UI components
├── context/           Authentication and language context
├── firebase/          Firebase setup and Firestore collections
├── hooks/             Service-provider data hooks
├── locales/           Translation files
├── pages/             Rental, service, owner, and account screens
└── utils/             Reviews, trust scores, fees, availability, and uploads
```
