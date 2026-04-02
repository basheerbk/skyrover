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

## Secrets (repository → Settings → Secrets and variables → Actions)

| Secret | Example | Description |
|--------|---------|-------------|
| `DEPLOY_SSH_KEY` | *(full private key)* | PEM from `deploy/github-actions-deploy` (see below) |
| `DEPLOY_HOST` | `68.233.112.68` | Oracle VM public IP or hostname |
| `DEPLOY_USER` | `opc` | SSH user with write access to `/opt/skyrover/app` |

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
