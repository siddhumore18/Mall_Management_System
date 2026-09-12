# 🚀 MegaMart Production Operations, Database, Security & Payment Gateway Manual

This manual provides **100% complete, verified step-by-step instructions** for starting your database, configuring security, using free test-mode payment gateways (Razorpay & Stripe), understanding the business logic architecture, and deploying the application.

---

## 🗄️ 1. How to Start & Manage the Database

Your Windows system already has **PostgreSQL 18** installed as a native service (`postgresql-x64-18`), configured on port **`5433`** with user `postgres` and database `megamartdb`.

### Option A: Native Windows Service (Current Setup)

Open **PowerShell** (Run as Administrator if needed):

1. **Check if PostgreSQL is running:**
   ```powershell
   Get-Service -Name postgresql*
   ```
   *Expected Status:* `Running`

2. **Start the database service:**
   ```powershell
   Start-Service postgresql-x64-18
   # Or using net command:
   net start postgresql-x64-18
   ```

3. **Stop the database service:**
   ```powershell
   Stop-Service postgresql-x64-18
   ```

4. **Verify PostgreSQL is listening on port 5433:**
   ```powershell
   Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -eq 5433 }
   ```

5. **Connect using psql CLI to verify database `megamartdb`:**
   ```powershell
   $env:PGPASSWORD='postgres'
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -p 5433 -d megamartdb -c "\dt"
   ```

6. **Create database if starting from scratch on a new machine:**
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -h localhost -p 5433 -U postgres megamartdb
   ```

---

### Option B: 1-Click Docker Database (Alternative for Containers)

If you prefer to run the database inside Docker:
```bash
docker compose -f docker-compose.db.yml up -d
```
This launches a lightweight PostgreSQL 16/18 Alpine container mapped to port `5433` with persistent volume `megamart_pgdata`.

---

## 💳 2. Payment Gateway Integration: Razorpay & Stripe (Free Test Sandbox)

Both **Razorpay** and **Stripe** offer **100% free test sandboxes** that require **NO payment, NO bank account linking, and NO business registration documents**.

---

### A. Razorpay Test Mode Setup (UPI, QR & NetBanking)

1. **Create Free Account**:
   - Go to [https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup).
   - Sign up with your email.
2. **Switch to Test Mode**:
   - On the top header of the Razorpay Dashboard, toggle the switch from **Live** to **Test Mode**.
3. **Generate Test API Keys**:
   - Navigate to **Account & Settings** $\rightarrow$ **API Keys** (under *Website and app settings*).
   - Click **Generate Test Key**.
   - Copy both:
     - **Key ID**: starts with `rzp_test_...` (e.g. `rzp_test_1DP5mmOlF5G5ag`)
     - **Key Secret**: (e.g. `s9Xu9Dk1xNl2fK0`)
4. **Configure in Project**:
   - Open `backend/src/main/resources/application.yml` or your `.env`:
     ```yaml
     app:
       payment:
         razorpay:
           key-id: "rzp_test_YOUR_KEY_ID"
           key-secret: "YOUR_KEY_SECRET"
     ```
5. **How to Test in Application**:
   - Open POS Cashier or checkout, select **Razorpay UPI**.
   - Click **GPay**, **PhonePe**, or **Paytm** buttons, or scan the dynamic UPI QR code.
   - The test order is created and verified via SHA-256 HMAC signature.

---

### B. Stripe Test Mode Setup (Credit & Debit Cards)

1. **Create Free Account**:
   - Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register).
   - Sign up with your email.
2. **Ensure Test Mode is Active**:
   - In the top-right corner of the Stripe Dashboard, verify the **Test mode** toggle is **ON** (orange indicator).
3. **Copy Test API Keys**:
   - Navigate to **Developers** $\rightarrow$ **API Keys**.
   - Copy:
     - **Publishable key**: starts with `pk_test_...`
     - **Secret key**: click *Reveal test key* $\rightarrow$ starts with `sk_test_...`
4. **Configure in Project**:
   - Open `backend/src/main/resources/application.yml` or your `.env`:
     ```yaml
     app:
       payment:
         stripe:
           publishable-key: "pk_test_YOUR_PUBLISHABLE_KEY"
           secret-key: "sk_test_YOUR_SECRET_KEY"
     ```
5. **How to Test in Application**:
   - In the checkout modal, click the **Stripe Cards** tab.
   - Use Stripe's official standard test card:
     - **Card Number**: `4242 4242 4242 4242`
     - **Expiry**: Any future date (e.g., `12/28`)
     - **CVV**: Any 3 digits (e.g., `888`)
   - Click **Pay with Stripe Test Card** $\rightarrow$ Instant authorization and capture!

---

## 🔒 3. Production Security & Data Protection Implementations

The following security enhancements have been implemented and verified:

1. **Brute Force & Credential Stuffing Defense**:
   - `RateLimitingFilter.java`: Limits auth requests (`/login`, `/pin-login`, `/register-tenant`) to 15 requests per minute per IP. Excess attempts receive HTTP 429 Too Many Requests.
2. **Cryptographic Protection & Passwords**:
   - BCrypt hashing with strong salt factors.
   - Password strength enforcement: minimum 8 characters required on registration.
   - Client-side mock tokens (`demo_jwt_token`) completely removed in favor of real JWTs.
3. **Multi-Tenant Boundary Isolation**:
   - Every product lookup, store query, customer record, and transaction now explicitly filters by `tenantId`.
   - Cross-tenant queries are rejected at both Hibernate filter and JPA repository layer.
4. **Hardened HTTP Response Headers**:
   - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking)
   - `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
   - `X-XSS-Protection: 1; mode=block`
   - Configurable CORS allowed origins (prevents arbitrary domain hijacking).

---

## 🧹 4. Dummy Data Removal & Clean Slate

1. **Database Bootstrap**:
   - `DataInitializer.java` now accepts `app.seed.sample-data=false` (default for production).
   - Only fundamental subscription plans (`Starter Boutique`, `Standard Chain`, `Enterprise Hyper-Scale`) and 1 Super Admin account are initialized.
   - All fake products (Amul, Britannia, Blue Tokai), fake stores, fake customer records, and fake transactions have been removed from default initialization.
2. **Frontend State**:
   - `useRetailStore.ts` starts with zero mock products and zero mock outlets.
   - All catalog data is retrieved directly from the PostgreSQL database via `/api/v1/products` and `/api/v1/stores`.
3. **Master Super Admin Credentials**:
   - **Email**: `superadmin@megamart.com`
   - **Password**: `SuperAdmin@2026!`
   - **Role**: `SUPER_ADMIN` (Access to all SaaS controls, subscriptions, and system metrics).

---

## 📊 5. Enhanced Admin Dashboard Analytics

The Tenant Admin Dashboard has been overhauled with real-time enterprise metrics:

- **Today's Sales vs Yesterday**: Displays today's gross revenue and percentage growth/decline rate compared to yesterday.
- **Average Order Value (AOV)**: Real mathematical average spend per invoice basket.
- **Payment Method Distribution**: Breakdown of revenue across UPI, Razorpay, Stripe Cards, Cash, and Gift Vouchers with percentage contribution.
- **Top 5 Best-Selling Catalog Products**: Dynamically aggregated from invoice line items, ranked by units sold and gross revenue.
- **Inventory Health & FEFO Expiry Alerts**: Real-time counter of items below reorder levels and batches expiring within 7 days.
- **Store Performance Leaderboard**: Visual revenue ranking of all operational supermarket branches.

---

## 🧪 6. Verified Business Logic & Automated Test Results

Automated test suites were run and passed:

1. **`TenantIsolationTest`**: Verifies that Tenant 1 and Tenant 2 data cannot leak into each other's queries.
2. **`ProductionBusinessLogicTest`**:
   - `testRazorpayPaymentOrderAndVerification`: Passed.
   - `testStripePaymentIntentAndConfirmation`: Passed.
   - `testProductOnboardingAndInventoryLinkage`: Passed (validates product creation, store inventory link, and duplicate barcode rejection).
   - `testAnalyticsCalculations`: Passed (verifies AOV, growth rate, and payment method maps).

---

## 🚢 7. Running & Deploying the Application

### Running Locally for Development

**Terminal 1 (Backend - Spring Boot):**
```powershell
cd backend
mvn spring-boot:run
```
*API runs on `http://localhost:8080/api/v1`*

**Terminal 2 (Frontend - React/Vite):**
```powershell
cd frontend
npm run dev
```
*UI runs on `http://localhost:5173`*

---

### Running in Production via Docker Compose

Run the entire unified stack (PostgreSQL + Backend + Nginx Frontend) with one command:
```bash
docker compose up -d --build
```
- **Frontend**: Available at `http://localhost` (Port 80)
- **Backend API**: Available at `http://localhost:8080/api/v1`
- **PostgreSQL**: Available at `localhost:5433`
