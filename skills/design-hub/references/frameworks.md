# Framework and environment notes

## Any framework

- **Stop the dev server before editing framework config (`next.config`, `vite.config`) or installing dependencies**, or ask the user to restart it afterwards. Doing both under a running Turbopack server can cause a reload loop on every page (`HMR hash mismatch` on the root layout chunk) that only a restart fixes.
- **A 200 status doesn't mean the page worked.** With partial prerendering or error boundaries, an error page can return 200. Every setup check asserts on page content (a heading or `data-hub-ready` marker) as well as status, and the renderer's report includes console errors.
- **Production builds checked locally** may need required environment keys. Pass placeholder values to that one process only (e.g. `FOO=placeholder next start`); never write them to a file.
- Check a port is free before starting a server on it, since another app may hold it. Confirm the old server is gone before starting another, or later checks hit stale results.
- Dev servers can keep a stale Tailwind result, so new `@utility` rules may be missing in dev. If an animation or utility doesn't apply, check a production build before debugging the code.

## Next.js (app router)

- Guard: render the hub only when `process.env.NEXT_PUBLIC_DESIGN_HUB === '1'`, else `notFound()`. `<meta name="robots" content="noindex">` on every hub page and frame route.
- **Import `manifest.json` (and the other system JSON) rather than reading it from disk.** You get hot reload, and a bad manifest fails the build instead of one page.
- Add `outputFileTracingIncludes` for `/design` routes if anything under `design-gate/system/` is read at runtime, so the files reach the deployment.

### Cache Components (Next.js 16+)

- Reading `design-gate/system/*` from disk during render needs `<Suspense>` plus `await connection()`.
- Dynamic routes need `generateStaticParams` returning at least one entry.

## Windows and Git Bash

- Git Bash rewrites arguments that start with `/` (e.g. `/design` becomes `C:/Program Files/Git/design`). Prefix commands with `MSYS_NO_PATHCONV=1`.
- `kill` doesn't stop `next start`, which then keeps serving stale results. Stop it by port in PowerShell: `Get-NetTCPConnection -LocalPort <port> | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`, then confirm the port is free.
- The renderer and setup script need Node 18+; run `setup.sh` from Git Bash or WSL.
