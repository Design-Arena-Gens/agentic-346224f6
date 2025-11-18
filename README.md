# ShortWave Launchpad

ShortWave Launchpad is a Next.js agent that ingests your finished vertical clips and publishes them to the YouTube Shorts shelf with curated metadata, privacy controls, and automated credential handling.

## Stack

- Next.js 14 App Router
- TypeScript + ESLint (core-web-vitals)
- YouTube Data API v3 via `googleapis`
- Multipart ingestion powered by `formidable`

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Populate the required environment variables in `.env.local`:

   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
   YOUTUBE_REFRESH_TOKEN=...
   ```

   > Use the OAuth Playground to exchange a code for a refresh token with the `https://www.googleapis.com/auth/youtube.upload` scope.

3. Run the development server:

   ```bash
   npm run dev
   ```

   The interface is served at `http://localhost:3000`.

## Deploy

Build and lint before deploying:

```bash
npm run lint
npm run build
```

Then deploy to Vercel (token must already be available):

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-346224f6
```

## Environment Notes

- Uploads rely on OAuth2 refresh token flow; ensure the refresh token has not expired.
- The API route enforces a 256 MB file ceiling and automatically cleans up temp files.
- Notify-subscriber and audience controls mirror YouTube Studio options for Shorts.
