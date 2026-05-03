<img width="1500" height="599" alt="Campaign-Manager" src="https://github.com/user-attachments/assets/a0b0fb64-ecca-457e-a2c8-339e334b2ca5" />


<div align="center">

# Campaign Management Platform

<img src="https://img.shields.io/badge/-Vite_8.0-646CFF?style=flat-&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/-Tailwind_CSS_4.2-38B2AC?style=flat-&logo=tailwind-css&logoColor=white" />
<img src="https://img.shields.io/badge/-FLUX.1--schnell_HuggingFace-ff9a1e?style=flat-&logo=huggingface&logoColor=white" />
<img src="https://img.shields.io/badge/-Gemini_Vision_2.5_Flash-4285F4?style=flat-&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/-Playwright_Scraping-2EAD33?style=flat-&logo=playwright&logoColor=white" />

<br />
<br />

> **A localhost-first platform for creating brand-aligned ad images using AI.** <br>
> Define your brand's DNA, build campaigns, and generate professional ad creatives - automatically.


</div>

---

## Table of Contents

- [What Is This?](#what-is-this)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## What Is This?

The **Campaign Management Platform** is a fully local web application that lets you:

1. **Define a Brand DNA** — capture the complete identity of any brand (name, colors, fonts, values, aesthetic, tone of voice, business overview).
2. **Auto-scrape brand data** — paste a website URL and the platform uses Playwright + Gemini Vision to automatically extract brand DNA, including logo detection.
3. **Create Campaigns** — build campaign workspaces tied to a Brand DNA (social ads, banners, product shots, promo graphics, print).
4. **Generate Ad Images** — write a brief, and the platform builds a rich, brand-aligned prompt that it sends to HuggingFace's FLUX.1-schnell model to generate a high-quality ad image.
5. **View, Download & Manage** — browse all generated images in a gallery, expand them in a lightbox, and download or delete.

Everything runs **locally** — no cloud accounts, no deployment, no auth required.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 8 | UI framework + dev server |
| Styling | Tailwind CSS 4 | Utility-first styling + glass morphism |
| Backend | Node.js + Express | REST API server |
| Database | SQLite (better-sqlite3) | Local, file-based persistence |
| Image Generation | HuggingFace FLUX.1-schnell | AI image synthesis |
| AI Vision | Google Gemini 2.5 Flash | Brand attribute extraction from screenshots |
| Web Scraping | Playwright | Headless browser automation |
| Image Processing | Sharp | Logo cropping from bounding boxes |
| Object Detection | HuggingFace OWL-ViT | Zero-shot logo detection (fallback) |
| Routing | React Router DOM 7 | Client-side SPA navigation |

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- A **HuggingFace account** with an API token — [huggingface.co](https://huggingface.co/settings/tokens)
- A **Google Cloud API key** with Gemini API enabled — [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/campaign-management.git
cd campaign-management

# Install ALL dependencies (root + client)
npm run install:all
```

> If `install:all` is not defined, run these manually:
> ```bash
> npm install
> cd client && npm install && cd ..
> ```

### Install Playwright Browsers

The scraper requires a Playwright browser binary:

```bash
npx playwright install chromium
```

### Configure Environment

Copy the example env file and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
HF_API_TOKEN=hf_your_huggingface_token_here
GOOGLE_API_KEY=your_google_api_key_here
```

### Run the App

Open **two terminal windows**:

**Terminal 1 — Backend (port 3001):**
```bash
npm run server
```

**Terminal 2 — Frontend (port 5173):**
```bash
npm run dev
```

Open your browser and go to:

```
http://localhost:5173
```

The SQLite database (`campaign.db`) and the `generated/` folder will be created automatically on first run.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `HF_API_TOKEN` | Yes | HuggingFace API token. Used for FLUX.1-schnell image generation and OWL-ViT logo detection. Get one at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| `GOOGLE_API_KEY` | Yes | Google Gemini API key. Used for brand attribute extraction and logo bounding box detection during scraping. Get one at [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

## Architecture Diagram

<img width="1200" height="1225" alt="ai-campaign-manager-architecture" src="https://github.com/user-attachments/assets/5c22d92e-6c0c-432b-a6c8-e4f5c4631562" />


