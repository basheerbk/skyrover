# GitHub Actions CI/CD (Oracle VM)

## Create the private repository (no `gh` CLI)

1. On GitHub: **New repository** → name e.g. `skyrover-ide` → **Private** → **do not** initialize with README (you already have commits locally).
2. In the project folder:

```bash
git remote add origin https://github.com/YOUR_USER/skyrover-ide.git
git branch -M main
git push -u origin main
```

Use SSH remote instead if you prefer SSH keys: `git@github.com:YOUR_USER/skyrover-ide.git`.

## Secrets: two places GitHub accepts them

You can use **either** approach (the workflow supports both):

1. **Repository secrets** — Settings → **Secrets and variables** → **Actions** → **Repository secrets**
2. **Environment secrets** — Settings → **Environments** → create an environment (see below)

### Using Environments (the “Environments / Configure …” screen)

Do **not** name the environment `DEPLOY_SSH_KEY`. That string is a **secret name**, not an environment name.

1. Settings → **Environments** → **New environment** → name it **`production`** (or another name; if you change it, update `environment:` in `.github/workflows/build.yml`).
2. Open **Configure production** (or your environment name).
3. Under **Environment secrets** → **Add environment secret** — add **three** separate secrets:

| Name | Value |
|------|--------|
| `DEPLOY_SSH_KEY` | Full private key from `deploy/github-actions-deploy` (including `BEGIN` / `END` lines) |
| `DEPLOY_HOST` | `68.233.112.68` |
| `DEPLOY_USER` | `opc` |

4. **Deployment branches** can stay **No restriction** for a private solo repo, or restrict to `main` if you want.

Optional: put `DEPLOY_HOST` / `DEPLOY_USER` under **Environment variables** instead (not secret). The workflow currently reads them as **secrets**; keep all three as environment secrets unless we change the workflow to use `vars.DEPLOY_HOST`.

### Repository secrets (alternative)

Settings → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Example | Description |
|--------|---------|-------------|
| `DEPLOY_SSH_KEY` | *(full private key)* | PEM from `deploy/github-actions-deploy` (see below) |
| `DEPLOY_HOST` | `68.233.112.68` | Oracle VM public IP or hostname |
| `DEPLOY_USER` | `opc` | SSH user with write access to `/opt/skyrover/app` |

### Add secrets from this project (GitHub CLI)

1. Install GitHub CLI: `winget install --id GitHub.cli` (then open a **new** terminal), or download the Windows installer from [cli.github.com](https://cli.github.com/).
2. Sign in: `gh auth login` (choose **GitHub.com**, **HTTPS**, authenticate the browser).
3. From the **repo root**:

```powershell
.\tools\set-github-actions-secrets.ps1
```

The script reads `git remote origin`, uploads `deploy/github-actions-deploy` as `DEPLOY_SSH_KEY`, and sets host/user (defaults: `68.233.112.68` / `opc`). Override:

```powershell
$env:DEPLOY_HOST = 'your.vm.ip'; $env:DEPLOY_USER = 'opc'; .\tools\set-github-actions-secrets.ps1
```

For **environment** secrets (matches the Environments UI), create the **`production`** environment on GitHub first, then:

```powershell
.\tools\set-github-actions-secrets.ps1 -Environment production
```

Verify: `gh secret list -R basheerbk/skyrover` or `gh secret list -R basheerbk/skyrover --env production`.

### Add secrets in the browser (manual)

Paste the **private** key including `-----BEGIN ... KEY-----` and `-----END ... KEY-----` lines.

On Windows, open `deploy/github-actions-deploy` in a text editor, copy the entire file into the `DEPLOY_SSH_KEY` secret (the file is listed in `.gitignore` and must never be committed).

## One-time: deploy SSH key

From the project root (do **not** commit the private key):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy/github-actions-deploy -N ""
```

Append the **public** key to the server:

```bash
type deploy\github-actions-deploy.pub | ssh -i YOUR_ORACLE_KEY opc@YOUR_HOST "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Copy the contents of `deploy/github-actions-deploy` into GitHub as `DEPLOY_SSH_KEY`.

## One-time: sudo for service restart

On the Oracle VM:

```bash
echo "opc ALL=(ALL) NOPASSWD: /bin/systemctl restart skyrover" | sudo tee /etc/sudoers.d/skyrover-deploy
sudo chmod 440 /etc/sudoers.d/skyrover-deploy
```

## What the pipeline does

1. `npm ci` → `npm run build:bundle` → `npm run smoke:test` (with `SMOKE_SKIP_SERVER=1`)
2. `rsync` project to `/opt/skyrover/app/` (excludes `node_modules`, `backend/data`, `.git`)
3. On the server: `npm ci --omit=dev`, `sudo systemctl restart skyrover`, `curl` `/healthz`

## Local smoke with server

```bash
npm run dev
# other terminal:
npm run smoke:test
```

## First push: verify Actions is green

1. Add secrets `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER` (see above).
2. `git push -u origin main`.
3. Open **GitHub → Actions → Build & Deploy** and confirm the workflow succeeds (build, smoke, rsync, restart, `curl` `/healthz`).

If the deploy step fails with SSH errors, confirm the deploy public key is in `~/.ssh/authorized_keys` on the VM and that `DEPLOY_SSH_KEY` is the **private** key (full PEM text).
