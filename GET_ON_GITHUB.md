# Get this repo onto your machine

The code was built in a Cloud Agent. Push from this VM failed (no GitHub credentials). Use one of these:

## Option A — Download from the agent, then push (fastest)

1. In the [agent run](https://cursor.com/agents/bc-01a03846-3276-7831-a01d-7753bb35a1bf), download **`scrapbook-export.zip`** from the project root.
2. On your Mac:

```bash
cd ~/Projects
git clone https://github.com/vinniboro/scrapbook.git
cd scrapbook
unzip ~/Downloads/scrapbook-export.zip
npm install
cp .env.example .env.local
git add .
git commit -m "Initial scrapbook plumbing and manifesto"
git branch -M main
git push -u origin main
```

3. Run locally:

```bash
npx drizzle-kit migrate   # after DATABASE_URL is in .env.local
npm run dev
```

## Option B — Git bundle (keeps commit history)

1. Download **`scrapbook.gitbundle`** from the agent project root.
2. On your Mac:

```bash
cd ~/Projects
git clone scrapbook.gitbundle scrapbook
cd scrapbook
git remote add origin https://github.com/vinniboro/scrapbook.git
git push -u origin cursor/exclusive-plumbing-a1bf:main
```

## Option C — Let a future agent push

Restart this agent **from** `https://github.com/vinniboro/scrapbook` in Cursor (with repo access). It can commit and push directly.

---

Remote is already set here to `https://github.com/vinniboro/scrapbook.git` on branch `cursor/exclusive-plumbing-a1bf`.
