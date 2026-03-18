## HedafApp – Fitness Challenge Waitlist

This is a small Next.js 14 + Tailwind CSS landing page for **HedafApp**, a fitness challenge app. It includes a waitlist email signup form connected to **Supabase**.

### Getting started

1. **Install dependencies**

```bash
npm install
```

2. **Create a Supabase project**

- In Supabase, create a new project.
- Create a table called `waitlist` with at least:
  - `id` – uuid, primary key, default value `uuid_generate_v4()`
  - `email` – text, **unique**
  - `created_at` – timestamptz, default `now()`

3. **Add environment variables**

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings under **Project Settings → API**.

4. **Run the dev server**

```bash
npm run dev
```

Then open `http://localhost:3000` to see the HedafApp landing page.

