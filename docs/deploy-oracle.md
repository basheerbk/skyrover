# Deploy on Oracle Cloud (Ubuntu + nginx + Node)

Single-VPS setup: HTTPS on **nginx**, Node listens on **127.0.0.1** only, **arduino-cli** compiles on the same machine.

## 1. Oracle Cloud

1. Create a **Compute** instance (Always Free if eligible):
   - Image: **Ubuntu 22.04** or **24.04** (x86 or ARM both work; prefer **2+ GB RAM** and **≥50 GB** boot volume for ESP32 toolchains).
2. **Networking:** allow **SSH (22)** and **HTTP (80)** / **HTTPS (443)** in the **VNIC** security rules (and subnet ingress if you use a custom NSG).
3. Point **DNS** A record (optional for first test): `ide.example.com` → instance **public IP**.

## 2. SSH and base packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx build-essential
```

## 3. Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

## 4. Arduino CLI + ESP32 core

Install the **Linux** binary for your CPU (x86_64 or aarch64) from [Arduino CLI releases](https://github.com/arduino/arduino-cli/releases).

Check CPU arch (`uname -m`): **`x86_64`** → 64bit tarball below; **`aarch64`** → use `Linux_ARM64` in the filename instead.  
See current files on [Arduino CLI releases](https://github.com/arduino/arduino-cli/releases/latest) if these URLs change.

**x86_64:**

```bash
curl -fsSL -o /tmp/arduino-cli.tar.gz "https://github.com/arduino/arduino-cli/releases/download/v1.4.1/arduino-cli_1.4.1_Linux_64bit.tar.gz"
sudo tar xzf /tmp/arduino-cli.tar.gz -C /usr/local/bin arduino-cli
arduino-cli version
```

**aarch64 (Ampere):**

```bash
curl -fsSL -o /tmp/arduino-cli.tar.gz "https://github.com/arduino/arduino-cli/releases/download/v1.4.1/arduino-cli_1.4.1_Linux_ARM64.tar.gz"
sudo tar xzf /tmp/arduino-cli.tar.gz -C /usr/local/bin arduino-cli
arduino-cli version
```

Configure and install ESP32:

```bash
arduino-cli config init
arduino-cli core update-index
arduino-cli core install esp32:esp32
```

(Optional) Libraries you need:

```bash
arduino-cli lib install "DHT sensor library"
```

## 5. App user and code

```bash
sudo useradd -r -s /bin/bash -m -d /opt/skyrover skyrover
sudo mkdir -p /opt/skyrover/app
sudo chown -R skyrover:skyrover /opt/skyrover
```

As `skyrover`, clone or upload the project to `/opt/skyrover/app`, then:

```bash
cd /opt/skyrover/app
npm ci
npm run build:bundle
```

## 6. systemd service

`/etc/systemd/system/skyrover.service`:

```ini
[Unit]
Description=Skyrover Block IDE
After=network.target

[Service]
Type=simple
User=skyrover
WorkingDirectory=/opt/skyrover/app
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=5005
# Optional: Environment=BLOCKIDE_AUDIT_LOG_DIR=/opt/skyrover/audit
ExecStart=/usr/bin/node backend/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now skyrover
sudo systemctl status skyrover
```

## 7. nginx reverse proxy

Replace `ide.example.com` with your real hostname. **You cannot get a normal Let’s Encrypt certificate for a bare IP** — you need a **domain** with an **A record** pointing at the VM.

**Full HTTPS checklist:** see **§11** below.

**nginx site file** (Ubuntu/Debian path; Oracle Linux uses `conf.d` — see §11):

`/etc/nginx/sites-available/skyrover`:

```nginx
server {
    listen 80;
    server_name ide.example.com;

    location / {
        proxy_pass http://127.0.0.1:5005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }
}
```

Enable and reload (Ubuntu/Debian):

```bash
sudo ln -sf /etc/nginx/sites-available/skyrover /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

**TLS (after DNS works):**

```bash
sudo certbot --nginx -d ide.example.com
```

Certbot will install the certificate and usually add **HTTPS** + **HTTP→HTTPS** redirect.

Users must open the site over **HTTPS** (except `localhost`) for **Web Serial** in Chrome/Edge.

### Web Serial and “I’m already on Chrome”

Chrome **intentionally** hides `navigator.serial` when the page is **`http://` + a public or LAN IP**. That is not a bug in the IDE — it is a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts) rule.

**Fix (pick one):**

1. **Production:** Put the app behind **nginx on 443** with a real certificate (**Let’s Encrypt** needs a **hostname**, not a bare IP). Open **`https://your-domain`**. Allow **TCP 443** in Oracle ingress; bind Node to **`127.0.0.1:5005`** and proxy from nginx (as above).
2. **Quick test without a domain:** From your PC, SSH port-forward then use **localhost** (Chrome treats that as secure enough for Web Serial):

   ```bash
   ssh -i YOUR_KEY -L 5005:127.0.0.1:5005 opc@YOUR_PUBLIC_IP
   ```

   Then in Chrome open **`http://127.0.0.1:5005`** (or `http://localhost:5005`) while the tunnel is running.

## 8. Firewall on the VM

If **ufw** is enabled:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Do **not** publish port **5005** to the internet when Node is bound to `127.0.0.1` (recommended).

## 9. Oracle **Ingress Rules**

In the Oracle console, the instance’s subnet / NSG must allow **TCP 80** and **443** from `0.0.0.0/0` (or your office IP only, if you prefer).

## 10. Verify

- Open `https://ide.example.com`
- Blockly → **Verify** (compile)
- ESP32 **Upload** (Web Serial): connect ESP32, approve the port when prompted

Audit log (on server): `/opt/skyrover/app/backend/data/compile_audit.jsonl` unless `BLOCKIDE_AUDIT_LOG_DIR` is set.

## 11. How to set up HTTPS (step-by-step)

### 1. Domain and DNS

1. Buy or use a domain (any registrar is fine).
2. In the registrar’s **DNS** panel, add an **A record**:
   - **Name:** e.g. `ide` (full name → `ide.yourdomain.com`)
   - **Value:** your Oracle VM **public IPv4** (same as you use for SSH)
3. Wait until it resolves from your PC:

   ```bash
   nslookup ide.yourdomain.com
   ```

   It should show your instance IP.

### 2. Oracle Cloud ingress

In the **subnet security list** (and any **NSG** on the VNIC), allow:

- **TCP 80** (HTTP — needed for Let’s Encrypt validation)
- **TCP 443** (HTTPS)

You can **remove TCP 5005** from the public internet once nginx is in front (recommended).

### 3. Run Node on localhost only

So the app is not exposed except through nginx:

- In `skyrover.service`, set `Environment=HOST=127.0.0.1` and `Environment=PORT=5005`.
- Then:

  ```bash
  sudo systemctl daemon-reload
  sudo systemctl restart skyrover
  ```

On the VM, confirm:

```bash
ss -tlnp | grep 5005
```

You want `127.0.0.1:5005`, not `0.0.0.0:5005`.

### 4. Install nginx + Certbot

**Ubuntu / Debian:**

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

**Oracle Linux:**

```bash
sudo dnf install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

**firewalld (Oracle Linux / RHEL-style):**

```bash
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```

### 5. Create the nginx site

Use your real hostname instead of `ide.example.com`.

**Ubuntu / Debian:** put the server block from **§7** into `/etc/nginx/sites-available/skyrover`, then enable it (commands in §7).

**Oracle Linux** (uses `conf.d/`):

```bash
sudo tee /etc/nginx/conf.d/skyrover.conf <<'EOF'
server {
    listen 80;
    server_name ide.example.com;

    location / {
        proxy_pass http://127.0.0.1:5005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }
}
EOF
sudo nginx -t && sudo systemctl reload nginx
```

**SELinux (Oracle Linux):** if nginx cannot connect to Node:

```bash
sudo setsebool -P httpd_can_network_connect 1
```

### 6. Get the certificate

When `http://ide.yourdomain.com` already loads the app (via port 80):

```bash
sudo certbot --nginx -d ide.yourdomain.com
```

Follow the prompts (email, agree to terms). Certbot will configure TLS and renewal.

### 7. Use the site

Open **`https://ide.yourdomain.com`** in Chrome. **Web Serial** should be available for upload/monitor.

Renewals are usually installed as a **cron**/**systemd timer** by certbot; check with:

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

- **`journalctl -u skyrover -f`** — app logs  
- **`sudo tail -f /var/log/nginx/error.log`** — nginx  
- **Web Serial / USB upload missing in Chrome:** you must use **HTTPS** or **`http://localhost`** (see *Web Serial and “I’m already on Chrome”* above). Plain **`http://68.x.x.x:5005`** will not work.
- **Compile fails:** run `arduino-cli compile` manually as `skyrover` with a tiny sketch; ensure cores and tools installed.  
- **Out of memory:** increase instance shape or add swap (last resort).
