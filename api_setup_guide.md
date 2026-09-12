# 🔌 ProERP Mega-Mall API & Production Integration Guide

This guide details all API services integrated into your **ProERP Mall Management System**, how they work out-of-the-box with **ZERO setup costs**, and step-by-step instructions for attaching production API keys when scaling your system.

---

## ⚡ 1. Summary of System API Status

| API / Service | Current Out-of-the-Box Mode | Required API Key? | Production Upgrade Option |
| :--- | :--- | :--- | :--- |
| **Barcode Product Enrichment** | **Open Food Facts API v3** + GS1 Master Registry | **NO KEY NEEDED** (100% Free Open API) | BarcodeLookup.com API |
| **Spring AI Copilot & Demand Engine** | Built-in Spring AI Decision & Caching Engine | **NO KEY NEEDED** (Embedded Fallback) | OpenAI GPT-4o / Azure OpenAI |
| **POS Payment Gateway & UPI QR** | Dynamic UPI QR Generator + Card Authorization | **NO KEY NEEDED** (Simulated Gateway) | Razorpay / Stripe Live API |
| **WebRTC Live Camera Barcode Scanner** | `html5-qrcode` Browser Camera Stream | **NO KEY NEEDED** (Runs locally in browser) | Google ML Kit (Android Native) |

---

## 📋 2. Step-by-Step API Setup Instructions

---

### A. Barcode External Lookup API (Product Onboarding)

#### How it works now:
When a barcode is scanned on the **Product Onboarding Screen**:
1. Checks **Local Mall Database** first.
2. If missing, automatically queries **Open Food Facts API v3** (`https://world.openfoodfacts.org/api/v3/product/{code}.json`).
3. If non-food or offline, falls back to the **GS1 CPG Registry Engine**.

#### How to attach BarcodeLookup.com (Optional Production Upgrade):
If you want to add non-food retail products (electronics, clothing, cosmetics) from a commercial database:
1. **Sign Up**: Go to [BarcodeLookup Developer Portal](https://www.barcodelookup.com/api).
2. **Get API Key**: Copy your `API Key` from the dashboard.
3. **Configure Backend**: Open `backend/src/main/resources/application.yml` and add:
   ```yaml
   megamart:
     barcode:
       api-key: "YOUR_BARCODE_LOOKUP_KEY_HERE"
       provider: "barcodelookup"
   ```

---

### B. Spring AI Engine (LLM Copilot, Demand Forecast & Loss Audit)

#### How it works now:
The system includes an embedded **Spring AI Decision & Demand Forecasting Engine** with a thread-safe `ConcurrentHashMap` response cache. You do not need to pay for any cloud AI keys to test or run full AI features.

#### How to attach Live OpenAI GPT-4o / ChatGPT (Optional Production Upgrade):
If you want the ProERP Copilot to generate custom natural language answers using live OpenAI LLMs:
1. **Sign Up**: Go to [OpenAI Platform](https://platform.openai.com/).
2. **Create Secret Key**: Navigate to **API Keys** $\rightarrow$ Click **Create new secret key** (`sk-proj-...`).
3. **Configure Backend**: Open `backend/src/main/resources/application.yml` and add:
   ```yaml
   spring:
     ai:
       openai:
         api-key: "sk-proj-YOUR_OPENAI_KEY_HERE"
         chat:
           options:
             model: "gpt-4o-mini"
             temperature: 0.7
   ```

---

### C. POS Payment Gateway & Instant UPI QR Payments

#### How it works now:
The POS terminal generates real dynamic **UPI Payment QR Codes** (`upi://pay?pa=...&pn=MegaMart&am=...`) printable on customer receipts, with instant payment authorization simulation for UPI, Cards, and Cash.

#### How to attach Live Razorpay Gateway (Optional Production Upgrade):
1. **Sign Up**: Register a merchant account at [Razorpay Merchant Dashboard](https://dashboard.razorpay.com/).
2. **Generate Keys**: Go to **Settings** $\rightarrow$ **API Keys** $\rightarrow$ Click **Generate Test/Live Key**.
3. **Copy Credentials**: Note your `Key ID` (`rzp_live_...`) and `Key Secret`.
4. **Configure Frontend**: Create `frontend/.env` and add:
   ```env
   VITE_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID_HERE
   ```
5. **Configure Backend**: Open `backend/src/main/resources/application.yml`:
   ```yaml
   razorpay:
     key-id: "rzp_live_YOUR_KEY_ID_HERE"
     key-secret: "YOUR_RAZORPAY_SECRET_HERE"
   ```

---

## 🛠️ 3. Quick Checklist to Run the Project Right Now

You **do NOT need to install or buy anything** to test the entire application right now!

1. **Frontend Dev Server**: Running on `http://localhost:5173` (`npm run dev`).
2. **Spring Boot API**: Running on `http://localhost:8080/api/v1`.
3. **Camera Barcode Scan**: Click **`Scan with Camera`** on Cashier POS or Inventory Onboarding page.
4. **0-Manual Intake Test**: Paste `(01)8901234567891(17)260914(10)BATCH-B11` into the GS1 box.
