<div align="center">

# Campaign Management Platform

<img src="https://img.shields.io/badge/-React_19.2.4-61DAFB?style=flat&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/-Node.js_Express-339933?style=flat-&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/-SQLite_better--sqlite3-003B57?style=flat-&logo=sqlite&logoColor=white" />
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
- [Core Concepts](#core-concepts)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Complete Workflow](#complete-workflow)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [How Scraping Works](#how-scraping-works)
- [How Image Generation Works](#how-image-generation-works)

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

## Core Concepts

### Brand DNA

A Brand DNA is a reusable brand profile. It stores:

| Field | Description |
|-------|-------------|
| **Name** | Brand name |
| **Website** | Brand's website URL |
| **Fonts** | Typefaces used by the brand |
| **Colors** | Hex color palette (up to 5) |
| **Tagline** | Brand slogan |
| **Brand Values** | Strategic values (e.g. "ROI-focused", "data-driven") |
| **Aesthetic** | Visual style & imagery preferences |
| **Tone of Voice** | Communication style (formal/casual, energetic/calm) |
| **Business Overview** | What the brand does and who it serves |
| **Logo** | Auto-extracted or manually set logo image |

One Brand DNA can power multiple campaigns.

### Campaigns

A campaign belongs to one Brand DNA. It scopes a specific advertising effort:
- Ad type (social, banner, product, print, promo)
- A name and description
- Multiple generated image outputs

### Generations

Each generation inside a campaign is one AI-produced image. Every generation stores:
- The **full prompt** used (auto-built or manually written)
- The **image file path** on disk
- A timestamp

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (localhost:5173)                 │
│                                                                 │
│   BrandList ──► BrandForm ──► BrandDetail ──► CampaignPage     │
│      (list)    (create/edit)  (view+manage)  (generate images) │
└─────────────────────────────┬───────────────────────────────────┘
                              │  REST API (proxied to :3001)
┌─────────────────────────────▼───────────────────────────────────┐
│                     Express Server (localhost:3001)             │
│                                                                 │
│  /api/brands   ──►  brands.js   ──►  scraper.js + logo-extractor│
│  /api/campaigns ──► campaigns.js                               │
│  /api/generate  ──► generations.js ──► prompt-builder.js       │
│                                    ──► huggingface.js          │
│                                                                 │
│  /static/generated  (serves images from disk)                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
   ┌─────────────▼──────────────────────────────┐
   │            SQLite (campaign.db)            │
   │  brands | campaigns | generations          │
   └────────────────────────────────────────────┘
                 │
   ┌─────────────▼──────────────────────────────┐
   │         /generated/  (disk storage)        │
   │  logos/                                    │
   │  [brand-slug]/[campaign-slug]/[ts].png     │
   └────────────────────────────────────────────┘
```

---

## Project Structure

```
Campaign Management (NEW)/
│
├── .env.example                   # Template for required environment variables
├── package.json                   # Root package (server deps + run scripts)
├── campaign.db                    # SQLite database (auto-created on first run)
│
├── server/                        # Express backend
│   ├── index.js                   # Server entry point (port 3001)
│   ├── db/
│   │   ├── index.js               # Database instantiation
│   │   └── schema.js              # Table definitions + initialization
│   ├── routes/
│   │   ├── brands.js              # Brand CRUD + /scrape endpoint
│   │   ├── campaigns.js           # Campaign CRUD
│   │   └── generations.js         # Image generation + gallery endpoints
│   └── services/
│       ├── prompt-builder.js      # Constructs AI prompts from Brand DNA
│       ├── huggingface.js         # FLUX.1-schnell API client (with retry)
│       ├── scraper.js             # Playwright + Gemini Vision orchestrator
│       └── logo-extractor.js      # 3-tier logo extraction (DOM/Gemini/OWL-ViT)
│
├── client/                        # React frontend (Vite)
│   ├── package.json
│   ├── vite.config.js             # Vite + API proxy (/api → :3001)
│   ├── index.html
│   └── src/
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # Router + navbar
│       ├── index.css              # Tailwind + glass morphism styles
│       └── pages/
│           ├── brand-list.jsx     # Homepage: brand card grid
│           ├── brand-form.jsx     # Create/edit brand DNA + scraper UI
│           ├── brand-detail.jsx   # Brand info + campaign management
│           └── campaign-page.jsx  # Image generation + gallery
│
└── generated/                     # Auto-created; git-ignored
    ├── logos/                     # Extracted brand logos
    └── [brand-slug]/
        └── [campaign-slug]/
            └── [timestamp].png    # Generated ad images
```

> **Note:** `generated/`, `campaign.db`, `.env`, and `node_modules/` are all git-ignored and will be created automatically when you run the app.

---

## Complete Workflow

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  STEP 1: Create Brand DNA                                       │
   │                                                                 │
   │  Option A — Manual:  Fill in brand details in the form         │
   │  Option B — Scrape:  Paste website URL → AI extracts:          │
   │             • Brand name, tagline, values, aesthetic, tone      │
   │             • Color palette (from screenshot)                   │
   │             • Fonts (from DOM computed styles)                  │
   │             • Logo (DOM → Gemini bbox crop → OWL-ViT fallback) │
   └───────────────────────────────┬─────────────────────────────────┘
                                   │
   ┌───────────────────────────────▼─────────────────────────────────┐
   │  STEP 2: Create a Campaign                                      │
   │                                                                 │
   │  • Assign to a Brand DNA                                        │
   │  • Set: name, description, ad type                             │
   │    (social / banner / product / print / promo)                 │
   └───────────────────────────────┬─────────────────────────────────┘
                                   │
   ┌───────────────────────────────▼─────────────────────────────────┐
   │  STEP 3: Generate Ad Images                                     │
   │                                                                 │
   │  Option A — Brief Mode:                                         │
   │    Write a short description of what you want.                  │
   │    → Prompt auto-built from Brand DNA + campaign + brief        │
   │                                                                 │
   │  Option B — Custom Prompt:                                      │
   │    Toggle to full-prompt mode and write the exact prompt.       │
   │                                                                 │
   │  → POST to FLUX.1-schnell (HuggingFace)                         │
   │  → PNG saved to disk + record saved to DB                       │
   │  → Image appears in gallery                                     │
   └───────────────────────────────┬─────────────────────────────────┘
                                   │
   ┌───────────────────────────────▼─────────────────────────────────┐
   │  STEP 4: Manage Outputs                                         │
   │                                                                 │
   │  • Browse generated images in the gallery grid                  │
   │  • Click to expand in a lightbox modal                          │
   │  • Download as PNG                                              │
   │  • Delete individual images                                     │
   └─────────────────────────────────────────────────────────────────┘
```

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

## API Reference

All routes are prefixed with `/api`.

### Brands

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/brands` | — | List all brands |
| `GET` | `/api/brands/:id` | — | Get a single brand |
| `POST` | `/api/brands` | Brand fields | Create a brand |
| `PUT` | `/api/brands/:id` | Brand fields (partial) | Update a brand |
| `DELETE` | `/api/brands/:id` | — | Delete brand (cascades to campaigns + generations) |
| `POST` | `/api/brands/scrape` | `{ url }` | Scrape a website and extract brand DNA |

**Brand object fields:**
```json
{
  "name": "string (required)",
  "website": "string",
  "fonts": "string",
  "colors": ["#hex", "#hex"],
  "tagline": "string",
  "brand_values": ["string"],
  "aesthetic": "string (required)",
  "tone": "string (required)",
  "overview": "string (required)",
  "logo_path": "string (relative path)"
}
```

### Campaigns

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/brands/:brandId/campaigns` | — | List campaigns for a brand |
| `GET` | `/api/campaigns/:id` | — | Get a campaign (with brand data joined) |
| `POST` | `/api/brands/:brandId/campaigns` | Campaign fields | Create a campaign |
| `PUT` | `/api/campaigns/:id` | Campaign fields (partial) | Update a campaign |
| `DELETE` | `/api/campaigns/:id` | — | Delete campaign (cascades to generations) |

**Campaign object fields:**
```json
{
  "name": "string (required)",
  "description": "string",
  "ad_type": "social | banner | product | print | promo"
}
```

### Generations

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/campaigns/:campaignId/generate` | `{ brief?, customPrompt? }` | Generate an image |
| `GET` | `/api/campaigns/:campaignId/images` | — | List all generated images for a campaign |
| `DELETE` | `/api/images/:id` | — | Delete an image (disk + DB) |

**Generate request:**
```json
{
  "brief": "A summer sale banner with bold text",
  "customPrompt": "optional — overrides auto-built prompt if provided"
}
```

**Generate response:**
```json
{
  "id": 1,
  "prompt": "Full prompt used for generation",
  "imageUrl": "/static/generated/brand-slug/campaign-slug/1710000000000.png",
  "created_at": "2026-04-13T10:00:00.000Z"
}
```

---

## Database Schema

```sql
-- Brand DNA profiles
CREATE TABLE brands (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  website     TEXT,
  fonts       TEXT,
  colors      TEXT,          -- JSON array of hex strings
  tagline     TEXT,
  brand_values TEXT,         -- JSON array of value strings
  aesthetic   TEXT NOT NULL,
  tone        TEXT NOT NULL,
  overview    TEXT NOT NULL,
  logo_path   TEXT,          -- relative path to extracted logo
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Campaign workspaces (belong to a brand)
CREATE TABLE campaigns (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_id    INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  ad_type     TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Generated images (belong to a campaign)
CREATE TABLE generations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id  INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  prompt       TEXT NOT NULL,
  image_path   TEXT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- WAL mode enabled for better concurrent read performance
- Foreign key constraints enforced
- Cascading deletes: brand → campaigns → generations

---

## How Scraping Works

When you paste a website URL and click **Scrape**, the backend runs a multi-stage pipeline:

```
Website URL
    │
    ▼
┌──────────────────────────────────┐
│  Stage 1: Playwright Browser     │
│  • Headless Chromium             │
│  • Navigate to URL               │
│  • Wait for network idle         │
│  • Capture 1280×800 screenshot   │
│  • Extract fonts (computed CSS)  │
│  • Extract page text (≤15k chars)│
└───────────────┬──────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│  Stage 2: Gemini Vision          │
│  • Input: screenshot + text      │
│  • Model: gemini-2.5-flash       │
│  • Extracts:                     │
│    - Brand name, tagline         │
│    - Values, aesthetic, tone     │
│    - Business overview           │
│    - Color palette (3–5 colors)  │
│    - Logo bounding box (0–1000)  │
└───────────────┬──────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│  Stage 3: Logo Extraction        │
│                                  │
│  Tier 1 — DOM parsing:           │
│    schema.org LD+JSON, og:image, │
│    apple-touch-icon, img[logo]   │
│                                  │
│  Tier 2 — Gemini bbox crop:      │
│    Crop logo from screenshot     │
│    using Gemini's coordinates     │
│    (Sharp for image processing)  │
│                                  │
│  Tier 3 — OWL-ViT detection:     │
│    Zero-shot object detection    │
│    via HuggingFace inference     │
│    ("company logo", "brand mark")│
└───────────────┬──────────────────┘
                │
                ▼
   Form auto-filled with all data
   (user can review & edit before saving)
```

---

## How Image Generation Works

```
User writes a brief (or custom prompt)
              │
              ▼
┌──────────────────────────────────────────┐
│  Prompt Builder (if brief mode)          │
│                                          │
│  "A professional [ad_type] advertisement │
│   for [brand_name].                      │
│   [brief]                                │
│   Style: [aesthetic].                    │
│   Color scheme: [colors].               │
│   Mood and tone: [tone].                │
│   Brand values: [values].               │
│   Tagline: "[tagline]".                 │
│   High quality, professional advertising │
│   photography, clean composition,        │
│   visually striking."                    │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│  HuggingFace FLUX.1-schnell API          │
│                                          │
│  POST https://router.huggingface.co/     │
│       hf-inference/models/               │
│       black-forest-labs/FLUX.1-schnell   │
│                                          │
│  • Auth: Bearer HF_API_TOKEN             │
│  • Retry: 3 attempts, backoff on 429/503 │
│  • Response: PNG image buffer            │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│  Storage                                 │
│                                          │
│  • Save PNG to:                          │
│    /generated/[brand]/[campaign]/ts.png  │
│  • Insert record into generations table  │
│  • Return imageUrl to frontend           │
└──────────────────────────────────────────┘
                    │
                    ▼
        Image appears in gallery
```

---

<div align="center">

Built with React, Express, SQLite, FLUX.1-schnell, and Gemini Vision.

</div>
