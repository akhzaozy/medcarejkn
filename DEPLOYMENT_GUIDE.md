# Panduan Deployment Server (Production Deployment Guide)
## JKN Integrity Intelligence / Medcare JKN

Proyek ini telah dikonfigurasi penuh dengan **Docker Compose**, sehingga proses instalasi di server (VPS / Cloud VM seperti AWS, GCP, DigitalOcean, Alibaba, IDCloudHost, Niagahoster, dll.) dapat dijalankan hanya dalam beberapa perintah.

---

## Opsi 1: Menggunakan Docker Compose (Sangat Direkomendasikan ⭐⭐⭐⭐⭐)

Metode ini paling mudah, aman, dan langsung mengonfigurasi Database PostgreSQL, Backend Node.js, dan Frontend Nginx secara otomatis.

### Langkah 1: Akses Server via SSH
Buka terminal lokal Anda dan login ke VPS server Anda:
```bash
ssh username@IP_SERVER_ANDA
# Contoh: ssh root@103.187.145.22
```

### Langkah 2: Pastikan Docker & Git Terinstall
Jika di server belum ada Docker, jalankan script instalasi resmi berikut (Ubuntu/Debian):
```bash
# 1. Update package
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Git & curl jika belum ada
sudo apt-get install -y git curl

# 3. Install Docker Engine resmi
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 4. Pastikan Docker Compose plugin terpasang
sudo apt-get install -y docker-compose-plugin

# 5. Cek instalasi
docker --version
docker compose version
```

### Langkah 3: Clone Repository dari GitHub
```bash
# Clone repo
git clone https://github.com/akhzaozy/medcarejkn.git

# Masuk ke direktori proyek
cd medcarejkn
```

### Langkah 4: Buat File Konfigurasi `.env`
Salin template file `.env.example`:
```bash
cp .env.example .env
```
*(Opsional)* Anda dapat mengubah kata sandi database jika diinginkan dengan mengedit `.env`:
```bash
nano .env
```
Contoh isi `.env` standar produksi:
```env
NODE_ENV=production
PORT=3000

DB_HOST=postgres
DB_PORT=5432
DB_NAME=jkn_integrity
DB_USER=jkn_user
DB_PASSWORD=jkn_password_yang_aman

CORS_ORIGIN=*
VITE_API_BASE_URL=/api
```
*(Tekan `CTRL+O` lalu `Enter` untuk menyimpan, `CTRL+X` untuk keluar dari nano).*

### Langkah 5: Jalankan Aplikasi
Jalankan satu perintah ini:
```bash
docker compose up -d --build
```
> Perintah ini akan:
> 1. Mengunduh PostgreSQL 16 dan otomatis menjalankan `schema.sql` serta `seed.sql`.
> 2. Mem-build dan menjalankan Backend Express di background.
> 3. Mem-build Frontend React dan menyajikannya lewat Nginx port 80.

### Langkah 6: Buka Aplikasi di Browser
Buka browser Anda dan akses:
```text
http://IP_SERVER_ANDA
```
*Contoh:* `http://103.187.145.22`

---

## Perintah Penting untuk Pengelolaan Server (Docker)

| Kebutuhan | Perintah |
|---|---|
| **Melihat status container** | `docker compose ps` |
| **Melihat log backend** | `docker compose logs -f backend` |
| **Melihat log database** | `docker compose logs -f postgres` |
| **Restart aplikasi** | `docker compose restart` |
| **Menghentikan aplikasi** | `docker compose down` |
| **Update kode terbaru dari GitHub** | `git pull origin main && docker compose up -d --build` |

---

## Opsi 2: Deploy Native (Tanpa Docker - Menggunakan PM2 & PostgreSQL Lokal)

Gunakan opsi ini jika server Anda sudah memiliki PostgreSQL dan Node.js yang berjalan langsung di OS host:

### 1. Install Node.js 20 & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib
sudo npm install -g pm2
```

### 2. Setup Database PostgreSQL
```bash
sudo -u postgres psql -c "CREATE DATABASE jkn_integrity;"
sudo -u postgres psql -c "CREATE USER jkn_user WITH PASSWORD 'jkn_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE jkn_integrity TO jkn_user;"

# Import skema dan data awal
sudo -u postgres psql -d jkn_integrity -f database/schema.sql
sudo -u postgres psql -d jkn_integrity -f database/seed.sql
```

### 3. Setup Backend
```bash
cd backend
npm install --production
pm2 start src/server.js --name "jkn-backend"
pm2 save
pm2 startup
```

### 4. Build Frontend & Sajikan via Nginx
```bash
cd ../frontend
npm install
npm run build

# Install Nginx host
sudo apt-get install -y nginx
sudo cp -r dist/* /var/www/html/
```
Edit konfigurasi Nginx `/etc/nginx/sites-available/default` untuk proxy reverse `/api/` ke `http://localhost:3000/api/`:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
Lalu restart Nginx:
```bash
sudo nginx -t && sudo systemctl restart nginx
```

---

## Pengamanan Tambahan: Pasang SSL / HTTPS Gratis (Let's Encrypt)
Jika server Anda sudah memiliki domain (contoh: `medcare.namawebsite.com`), pasang SSL gratis dengan:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d medcare.namawebsite.com
```
Certbot akan otomatis memperbarui sertifikat HTTPS setiap 90 hari.
