# ASHES Stack — Client Portal

A working login/signup + client portal + admin portal, built with Next.js and MongoDB.

## What's inside

- **Login / signup** (`/login`, `/signup`) — the **first account ever created becomes the admin account**. Sign yourself up first.
- **Client portal** (`/portal`) — client fills in Gmail (for Google Meet), name (from signup), age, gender, phone — and sees/downloads every document you've sent them.
- **Admin portal** (`/admin`, `/admin/client/[id]`) — a list of clients, and per-client **one-click buttons** to instantly generate and send a branded PDF:
  - Welcome Doc
  - Contract (based on your Landing Page Service Agreement template)
  - Invoice (with editable amount/invoice #/due date)
  - Access Request
  - Monthly Report
  - Fulfillment Doc
  - Feedback Request

  Every document is generated on the server with `pdf-lib` using the ASHES black/orange branding from your agreement doc, stored in MongoDB, and instantly appears in that client's portal for download.

## 1. Local setup

```bash
npm install
cp .env.example .env.local
# edit .env.local and fill in MONGODB_URI and JWT_SECRET
npm run dev
```

Visit `http://localhost:3000`, sign up — that account becomes admin. Have your client sign up separately (or you create their account) to test the client side.

## 2. MongoDB

Create a free cluster at https://www.mongodb.com/cloud/atlas, create a database user, allow network access from anywhere (0.0.0.0/0, or Vercel's IPs), and copy the connection string into `MONGODB_URI`.

## 3. Push to your GitHub repo

```bash
cd ashes-portal
git init
git add .
git commit -m "ASHES client + admin portal"
git branch -M main
git remote add origin https://github.com/eishal-web-dev/Ashes-Stack-LTD.git
git push -u origin main --force
```
(`--force` only if the repo already has unrelated content you want to replace — otherwise push normally or to a new branch.)

## 4. Deploy on Vercel

1. Import the GitHub repo in Vercel.
2. In **Project Settings → Environment Variables**, add:
   - `MONGODB_URI` — your Atlas connection string
   - `JWT_SECRET` — a random string (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
3. Deploy. That's it — this is a single Next.js app, frontend and backend (API routes) together, so there's no separate backend to configure.

## Notes / what you still need to decide

- **Google Meet invites**: this app collects the client's Gmail and shows it to you in the admin panel — it does not auto-send a Google Calendar/Meet invite (that needs Google OAuth + Calendar API, which needs a Google Cloud project and consent screen). I can wire that up next if you want it fully automatic.
- **Invoice numbers / amounts**: currently entered by hand when you click "Send Invoice" — easy to extend into auto-incrementing invoice numbers per client.
- **Payment details**: the invoice template has a placeholder line for bank/JazzCash/Easypaisa — edit `lib/pdfTemplates.js` → `invoice` case to hardcode your real payment details.
- **Roles**: only two roles exist (`admin`, `client`). If you want a "team member" role later, extend `models/User.js`.
