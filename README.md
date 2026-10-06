# Phase 0: Setup and Foundations

By the end of this phase you'll have Next.js running in your Codespace, connected to Firebase, with the ADN theme applied and a confirmed Firestore read/write. Do the steps in order and tell me if anything errors.

Version note: create-next-app and shadcn change often. If a prompt or file looks different from what I describe, tell me what you see rather than forcing it.

## Step 1: Create the Firebase project (browser)

In the [Firebase Console](https://console.firebase.google.com):

1. Create a project named `adn-admin-dev`. This is your **dev** project, and we'll make a separate production one in Phase 9.
2. **Build → Firestore Database → Create database.** Choose **production mode** and region **asia-south1 (Mumbai)**. The region can't be changed later.
3. **Build → Authentication → Get started → Email/Password → Enable.**
4. **Project settings → General → Your apps → Web (`</>`).** Register an app called `adn-admin-web` and copy the config values (apiKey, authDomain, projectId, appId).
5. **Project settings → Service accounts → Generate new private key.** This downloads a JSON file. Keep it private and never commit it.

## Step 2: Scaffold Next.js in the Codespace

Check `node -v` first (Node 20+ is needed). Then, from the repo root:

```bash
npx create-next-app@latest .
```

Answer the prompts like this:

| Prompt | Answer |
|---|---|
| TypeScript | Yes |
| ESLint | Yes |
| Tailwind CSS | Yes |
| `src/` directory | Yes |
| App Router | Yes |
| Turbopack | Yes |
| Import alias | `@/*` |

If it complains about existing files, a lone `README.md` is fine. Then run `npm run dev`, open the forwarded port 3000, and confirm the starter page loads.

## Step 3: Install dependencies

```bash
npm i firebase firebase-admin server-only zod react-hook-form @hookform/resolvers lucide-react next-themes sonner date-fns
npm i -D firebase-tools prettier prettier-plugin-tailwindcss
npx shadcn@latest init
```

For shadcn, pick the neutral base color, since we'll override it with brand colors. Then add the starter components:

```bash
npx shadcn@latest add button input label card dialog dropdown-menu sonner table badge
```

## Step 4: Environment variables

Open the downloaded service account JSON and create `.env.local` in the repo root:

```bash
# Client (safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Server only (secret)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...   # "client_email" in the JSON
FIREBASE_PRIVATE_KEY="..."  # "private_key" in the JSON, keep the quotes and the \n characters
```

Then verify:

1. Run `git check-ignore .env.local`. It should print the filename. create-next-app ignores `.env*` by default, but confirm.
2. Delete the downloaded JSON from your machine once the values are copied, or store it somewhere safe.

## Step 5: Firebase initialization code

Create these two files.

**`src/lib/firebase/admin.ts`** (server only):

```ts
import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const isNew = getApps().length === 0;

const app = isNew
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
  : getApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

if (isNew) {
  // settings() may only be called once, so it's guarded against hot reload
  adminDb.settings({ ignoreUndefinedProperties: true });
}
```

**`src/lib/firebase/client.ts`** (browser, used only for login in Phase 1):

```ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(config);
export const clientAuth = getAuth(app);
```

## Step 6: Lock Firestore rules and set up the emulator

Our architecture is server-only access, so client access is denied entirely. Log in and initialize:

```bash
npx firebase login --no-localhost
npx firebase init firestore emulators
```

Choose your existing project, accept the default `firestore.rules` and `firestore.indexes.json`, and select the **Firestore** and **Auth** emulators. Then set `firestore.rules` to:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

The Admin SDK bypasses rules, so the app still works, but nobody can reach your database directly from a browser. Deploy the rules with `npx firebase deploy --only firestore:rules`.

**Codespaces caveat:** the Firestore emulator works smoothly with server code. The Auth emulator is awkward because the browser needs a forwarded port URL. So for now we use the **Firestore emulator** for safe local data, and we'll sort out Auth emulator vs. a dev Auth project at the start of Phase 1. Add this script to `package.json`:

```json
"emulators": "firebase emulators:start --only firestore"
```

## Step 7: Apply the ADN brand theme

Open `src/app/globals.css` (generated by shadcn). Keep the imports and the `@theme inline` block shadcn created, and replace the `:root` and `.dark` variable values with these. If shadcn used `oklch(...)`, swap them for the `hsl(...)` values below.

```css
:root {
  --radius: 0.625rem;

  --background: hsl(0 0% 100%);
  --foreground: hsl(24 10% 10%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(24 10% 10%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(24 10% 10%);

  --primary: hsl(41 65% 59%);
  --primary-foreground: hsl(24 10% 10%);
  --accent: hsl(41 65% 59%);
  --accent-foreground: hsl(24 10% 10%);
  --secondary: hsl(41 20% 95%);
  --secondary-foreground: hsl(24 10% 10%);
  --muted: hsl(41 20% 96%);
  --muted-foreground: hsl(24 10% 46%);

  --destructive: hsl(0 84.2% 60.2%);
  --border: hsl(41 65% 59%);
  --input: hsl(41 20% 90%);
  --ring: hsl(41 65% 59%);

  --gradient-primary: linear-gradient(135deg, #dcaf53, #e4bd67);
  --gradient-hero: linear-gradient(135deg, #dcaf53 0%, #d18847 100%);
}

.dark {
  --background: hsl(24 15% 8%);
  --foreground: hsl(41 20% 95%);
  --card: hsl(24 12% 12%);
  --card-foreground: hsl(41 20% 95%);
  --popover: hsl(24 12% 12%);
  --popover-foreground: hsl(41 20% 95%);

  --primary: hsl(41 65% 59%);
  --primary-foreground: hsl(24 15% 8%);
  --accent: hsl(41 65% 59%);
  --accent-foreground: hsl(24 15% 8%);
  --secondary: hsl(24 10% 18%);
  --secondary-foreground: hsl(41 20% 95%);
  --muted: hsl(24 10% 18%);
  --muted-foreground: hsl(41 15% 65%);

  --destructive: hsl(0 62.8% 50%);
  --border: hsl(41 65% 59%);
  --input: hsl(24 10% 20%);
  --ring: hsl(41 65% 59%);
}

@utility bg-brand-gradient { background-image: var(--gradient-primary); }
@utility bg-hero-gradient { background-image: var(--gradient-hero); }
```

The `@utility` lines let you use `bg-brand-gradient` and `bg-hero-gradient` as classes anywhere.

**Design note:** you specified gold for Border, and shadcn applies `border-border` to every card, table and input. A full-strength gold border everywhere can look heavy in data-dense admin screens. If it does, we can change only that one variable to `hsl(41 65% 59% / 0.3)` and keep the brand feel without the weight. We'll judge it once real pages exist.

## Step 8: Folder structure

Create these empty folders now so everyone (including future you) knows where things go:

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── packages/ customers/ order-sources/
│   │   ├── bookings/ invoices/ finance/ analytics/
│   └── api/
├── actions/          # Server Actions per module
├── components/
│   ├── ui/           # shadcn (auto-generated)
│   ├── layout/       # sidebar, topbar
│   └── shared/       # DataTable, ConfirmDialog, PageHeader
├── lib/
│   ├── firebase/     # admin.ts, client.ts
│   ├── validators/   # Zod schemas
│   └── utils/        # money, dates, constants
└── types/
```

Also add `.prettierrc`:

```json
{ "semi": true, "singleQuote": false, "plugins": ["prettier-plugin-tailwindcss"] }
```

## Step 9: Smoke test

Temporarily replace `src/app/page.tsx` with a server component that does all of these:

- Writes a doc to a `_healthcheck` collection with `adminDb`
- Reads it back
- Renders "ADN Adventures", the tagline, and the result inside a `bg-brand-gradient` block with a primary button

If you see the gold gradient, the tagline, and a successful read/write, then env vars, Admin SDK, Firestore, Tailwind and the theme all work. I can write this test page for you if you want it. Afterward, delete the `_healthcheck` document and the test page.

## Step 10: Commit

```bash
git add .
git commit -m "chore: scaffold Next.js, Firebase admin, ADN theme"
git push
```

From here on, use a branch per phase (`git checkout -b phase-1-layout-auth`).

## Phase 0 Done Checklist

- [ ] `npm run dev` runs without errors
- [ ] `.env.local` exists and is git-ignored
- [ ] Firestore read/write works through the Admin SDK
- [ ] Firestore rules deployed (deny all)
- [ ] Gold brand theme visible in light and dark mode
- [ ] Folder structure created and committed

## Next Step

Tell me when the checklist is done, or paste any error you hit. Then we start **Phase 1**: app shell (sidebar, top bar, theme toggle), Firebase login with server-side session cookies, role-based route protection, and the first admin seed script.

One question is still open from earlier: do you need **GST** on invoices, and is **INR (₹)** the only currency? I need this before Phase 5, but it also affects how we name constants in `lib/utils/money`.


