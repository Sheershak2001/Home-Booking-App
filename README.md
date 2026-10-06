# Home Booking App

## Run locally

1. Install Node.js 20.19 or later and run `npm install`.
2. Copy `.env.example` to `.env` (`Copy-Item .env.example .env` in PowerShell), then edit `.env` and replace the example values with your MongoDB connection string and a long random `SESSION_SECRET`. The app can start without a `.env` file, but it will show a configuration error until these values are set.
3. Start the app with `npm run dev`. Open `http://localhost:3000`.

The production start command is `npm start`. Home photos are stored in MongoDB, so they persist when the app runs on a serverless host. Uploaded PNG and JPEG files must be smaller than 4 MB.

## Deploy to Vercel

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In the [Vercel dashboard](https://vercel.com/dashboard), choose **Add New → Project** and import the repository.
3. Keep the project root at the repository root and select the **Other** framework preset. Vercel uses the included `vercel.json` and `build` script; no custom output directory is needed.
4. In the project’s **Settings → Environment Variables**, add:
   - `MONGODB_URI`: your MongoDB Atlas connection string. In Atlas, allow network access from Vercel (or use an appropriate production network-access policy).
   - `SESSION_SECRET`: a long, random secret; do not commit it to Git.
5. Apply those variables to the Production environment (and Preview/Development if you need those deployments), save, then redeploy.

The Vercel deployment uses MongoDB both for application data and sessions. Local disk uploads are not used for new photos.
