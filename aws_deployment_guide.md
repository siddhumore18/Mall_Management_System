# 🚀 MegaMart AWS Deployment Guide

## Architecture Overview

```
GitHub (push to main)
    │
    ▼
GitHub Actions CI/CD
    ├── Build & test backend (Java/Maven)
    ├── Build Docker images
    └── Push to Amazon ECR
            │
            ▼
    AWS EC2 (t3.small)
    ├── megamart-frontend (Nginx → port 80)
    └── megamart-backend  (Spring Boot → port 8080)
            │
            ▼
    Amazon RDS PostgreSQL
    (managed DB, backups, high availability)
```

---

## STEP 1 — Create AWS Account & IAM User

1. Go to **https://aws.amazon.com** → Create account (free tier works)
2. Go to **IAM** → **Users** → **Create user**
   - Username: `megamart-deployer`
   - **Attach policies directly:**
     - `AmazonEC2FullAccess`
     - `AmazonRDSFullAccess`
     - `AmazonECR_FullAccess`
     - `CloudWatchLogsFullAccess`
3. Go to **Security credentials** tab → **Create access key** → **CLI**
4. **Save the Access Key ID and Secret** — you'll need them for GitHub

---

## STEP 2 — Create Amazon ECR Repositories (Docker registry)

Run in AWS Console → **ECR** → **Create repository** (×2):

| Repository Name | Settings |
|-----------------|----------|
| `megamart-backend` | Private, mutable tags |
| `megamart-frontend` | Private, mutable tags |

**Note your ECR URI:** `YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com`

---

## STEP 3 — Create RDS PostgreSQL Database

1. **AWS Console** → **RDS** → **Create database**
2. Settings:
   - Engine: **PostgreSQL 16**
   - Template: **Free tier** (for testing) or **Production**
   - DB instance: `db.t3.micro` (free) or `db.t3.small`
   - DB name: `megamartdb`
   - Master username: `megamartuser`
   - Master password: **Create a strong password (save it!)**
   - **VPC security group:** Allow inbound port 5432 from your EC2 security group
3. After creation, copy the **Endpoint** (looks like `megamart.xxxx.ap-south-1.rds.amazonaws.com`)

---

## STEP 4 — Launch EC2 Instance

1. **AWS Console** → **EC2** → **Launch Instance**
2. Settings:
   - Name: `megamart-server`
   - AMI: **Amazon Linux 2023** (free tier eligible)
   - Instance type: **t3.small** (2 vCPU, 2GB RAM) — recommended
   - **Key pair:** Create new → `megamart-key.pem` → **Download it!**
   - **Security group** → Add rules:
     | Type | Port | Source |
     |------|------|--------|
     | SSH | 22 | My IP |
     | HTTP | 80 | 0.0.0.0/0 |
     | HTTPS | 443 | 0.0.0.0/0 |
   - Storage: 20 GB gp3

3. Launch → **Note the Public IP address**

---

## STEP 5 — Set Up EC2 Server (SSH in once)

```bash
# Connect to your EC2 (replace with your key and IP)
ssh -i megamart-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

Run these commands on the EC2 server:

```bash
# 1. Install Docker
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# 2. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Install AWS CLI (for ECR login)
sudo dnf install -y awscli

# 4. Configure AWS credentials on EC2 (or use IAM Role — better!)
aws configure
# Enter: Access Key ID, Secret, Region (ap-south-1), output format (json)

# 5. Create app directory
sudo mkdir -p /opt/megamart
sudo chown ec2-user:ec2-user /opt/megamart
cd /opt/megamart

# 6. Create production .env file
nano .env
```

Paste this into `.env` (replace with real values):
```env
ECR_REGISTRY=YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
AWS_REGION=ap-south-1
SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR-RDS-ENDPOINT:5432/megamartdb
SPRING_DATASOURCE_USERNAME=megamartuser
SPRING_DATASOURCE_PASSWORD=YOUR_STRONG_PASSWORD
APP_JWT_SECRET=YOUR_64_CHAR_HEX_SECRET
CORS_ALLOWED_ORIGINS=http://YOUR_EC2_IP
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your_secret
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXX
```

Generate JWT secret:
```bash
openssl rand -hex 64
```

Copy `docker-compose.prod.yml` to the server:
```bash
# From your LOCAL machine (not EC2):
scp -i megamart-key.pem docker-compose.prod.yml ec2-user@YOUR_EC2_IP:/opt/megamart/
```

---

## STEP 6 — Add GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | From IAM Step 1 |
| `AWS_SECRET_ACCESS_KEY` | From IAM Step 1 |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS Account ID |
| `AWS_REGION` | `ap-south-1` (Mumbai) |
| `EC2_HOST` | Your EC2 Public IP |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | **Full content** of `megamart-key.pem` |

**To get EC2_SSH_KEY:**
```powershell
# On Windows PowerShell:
Get-Content megamart-key.pem | clip
# Then paste into GitHub secret
```

---

## STEP 7 — Trigger First Deployment

```bash
# Push to main — this triggers the CI/CD pipeline
git add .
git commit -m "feat: add AWS deployment configuration"
git push
```

Watch it run at: `https://github.com/siddhumore18/Mall_Management_System/actions`

**Expected pipeline (takes ~8 min first time):**
1. ✅ Test Backend — runs Java tests
2. ✅ Build & Push to ECR — builds Docker images
3. ✅ Deploy to EC2 — SSH deploys via docker compose

---

## STEP 8 — Access Your Live App

After deployment:
```
Frontend: http://YOUR_EC2_IP
Backend API: http://YOUR_EC2_IP/api/v1/auth/login
```

> **For HTTPS (SSL):** Add a domain name + use AWS ACM certificate with an Application Load Balancer, or use Certbot/Let's Encrypt directly on EC2.

---

## 💡 Free Tier Cost Estimate

| Service | Type | Cost |
|---------|------|------|
| EC2 | t2.micro (750 hrs/month) | **Free** 12 months |
| RDS | db.t3.micro (750 hrs/month) | **Free** 12 months |
| ECR | 500MB storage | **Free** |
| Data transfer | First 1GB/month | **Free** |
| **Total** | | **~₹0 for 12 months** |

After free tier: ~₹1,500-3,000/month for t3.small + RDS

---

## 🔧 Useful Commands on EC2

```bash
# Check running containers
cd /opt/megamart
docker compose -f docker-compose.prod.yml ps

# View backend logs
docker logs megamart-backend -f --tail=100

# View frontend logs
docker logs megamart-frontend -f --tail=50

# Restart services
docker compose -f docker-compose.prod.yml restart

# Manual deploy (without GitHub Actions)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## ⚠️ Security Checklist Before Going Live

- [ ] Change `APP_JWT_SECRET` to a random 64-char hex string
- [ ] Use a strong RDS password (12+ chars, mixed case, numbers, symbols)
- [ ] EC2 SSH port 22 restricted to your IP only
- [ ] RDS only accessible from EC2 security group (not 0.0.0.0/0)
- [ ] `SEED_SAMPLE_DATA=false` in production `.env`
- [ ] Enable RDS automated backups (7-day retention)
- [ ] Set up CloudWatch alarms for CPU > 80%
