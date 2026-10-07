import type { ProjectsCopy } from "./types";

export const enUS: ProjectsCopy = {
  metrics: {
    legacyYears: "years of legacy",
    stack: "stack",
    cloud: "cloud",
    monthlyVisits: "visits per month",
    peakVisits: "peak visits",
    linesOfCode: "lines of code",
    automatedTests: "automated tests",
    backendModules: "back-end modules integrated",
    frontendStack: "on the front end",
    role: "and co-founder",
    platforms: "SaaS products",
  },
  snapshot: {
    legacyYears: "years of legacy modernized",
    monthlyVisits: "visits per month",
    backendModules: "integrated modules",
    automatedTests: "automated tests",
  },
  projects: {
    "pravaler-discovery": {
      title: "Discovery modernization",
      summary:
        "Migration of a 20+ year-old WordPress/PHP ecosystem to Next.js, Node.js and TypeScript, with a BFF architecture for the portal and the marketplace.",
      case: {
        context:
          "On Pravaler's Acquisition and Discovery team, the focus was customer acquisition, user experience, performance and SEO. The portal and the marketplace ran on a WordPress/PHP ecosystem more than 20 years old.",
        challenge:
          "Replace that legacy with a modern architecture on a channel with 400K+ visits per month (peaking at 650K), keeping performance, SEO and user experience in sight.",
        role: [
          "Migrated the WordPress/PHP legacy to Next.js, Node.js and TypeScript, with SPA, SSR and SSG pages.",
          "Built the new BFF architecture for the portal and the marketplace, including microservice and integration studies.",
          "400+ unit and integration tests with Jest, React Testing Library and Cypress.",
          "Moved applications to Google Cloud Platform, Docker and CI/CD.",
          "Took part in the new portal/rebrand and in the team's TypeScript adoption.",
        ],
        architecture: [
          { label: "WordPress/PHP", detail: "20+ year-old legacy", legacy: true },
          { label: "Next.js + React", detail: "SPA · SSR · SSG" },
          { label: "Node.js BFF", detail: "portal and marketplace" },
          { label: "Services and APIs", detail: "integrations" },
          { label: "Google Cloud Platform", detail: "Docker · CI/CD" },
        ],
        result: "Portal and marketplace migrated to Next.js, Node.js and TypeScript, on the new BFF architecture and with a new portal/rebrand.",
        decisions: [
          {
            title: "A BFF between screens and services",
            description: "A Node.js layer centralizes integrations and hands the portal and the marketplace data shaped the way each screen needs it.",
          },
          {
            title: "Rendering chosen per page",
            description: "SPA, SSR and SSG live in the same codebase: each page uses the strategy that serves the team's focus on performance and SEO.",
          },
          {
            title: "Layered testing",
            description: "Jest and React Testing Library for units and integrations, Cypress for in-browser flows — 400+ tests in total.",
          },
          {
            title: "Containerized infrastructure",
            description: "Applications moved to Google Cloud Platform with Docker and CI/CD pipelines.",
          },
        ],
      },
    },
    "pravaler-canais-epa": {
      title: "Legacy rebuild — EPA channels",
      summary:
        "On the “Strategy for Action” team, rebuilt the legacy system: simulation, pre-simulation, sign-up, credit, customer service, website and forms.",
      case: {
        context:
          "In 2025, on Pravaler's “Strategy for Action” (EPA) team, the mission was to rebuild the company's legacy system — the simulation, pre-simulation, sign-up, credit, customer service, website and forms channels.",
        challenge:
          "Rebuild business-critical flows that depended on a 20+ year-old legacy, with an architecture that scales and stays easy to maintain.",
        role: [
          "Rebuilt the simulation, pre-simulation, sign-up, credit and customer service flows.",
          "Interfaces and services with Next.js and Node.js, using shadcn/ui, Tailwind CSS and Material UI.",
          "Front-end to API integration and architecture evolution.",
          "Applications on Google Cloud Platform, gradually replacing the legacy structures.",
          "Unit and integration tests with Jest to reduce regressions.",
        ],
        architecture: [
          { label: "Legacy system", detail: "20+ years", legacy: true },
          { label: "EPA channels", detail: "simulation · sign-up · credit · service" },
          { label: "Next.js + shadcn/ui", detail: "interfaces with Tailwind CSS" },
          { label: "Node.js", detail: "services and API integration" },
          { label: "Google Cloud Platform" },
        ],
        result: "Business-critical flows rebuilt and running on Google Cloud Platform, gradually replacing the legacy structures.",
        decisions: [
          {
            title: "Gradual replacement",
            description: "Instead of a single cutover, the new applications took the legacy's place step by step, flow by flow.",
          },
          {
            title: "Standardized interface",
            description: "shadcn/ui and Tailwind CSS as the visual foundation to keep the rebuilt channels consistent.",
          },
          {
            title: "Tests against regressions",
            description: "Unit and integration tests with Jest alongside the rebuild of the critical flows.",
          },
        ],
      },
    },
    inoa: {
      title: "Capital markets platform",
      summary: "Front end in AngularJS, TypeScript and React integrated with 16 back-end modules built by different teams.",
      case: {
        context:
          "At Inoa, I worked as a senior engineer on the front end of a capital markets platform integrated with 16 back-end modules maintained by different teams.",
        challenge: "Evolve an AngularJS front end that talks to 16 services from different teams, keeping the interface and the services consistent.",
        role: [
          "New features, business flows and integrations with the APIs of the 16 back-end modules.",
          "Built and maintained reusable components in AngularJS, TypeScript and React.",
          "Technical alignment with multiple back-end teams.",
          "Code reviews, technical decisions and front-end architecture evolution.",
          "Automated tests with Jest and React Testing Library; components documented in Storybook.",
        ],
        architecture: [
          { label: "Front end", detail: "AngularJS + React · TypeScript" },
          { label: "Reusable components", detail: "documented in Storybook" },
          { label: "API integrations", detail: "business flows" },
          { label: "16 back-end modules", detail: "different teams" },
        ],
        decisions: [
          {
            title: "Reusable, documented components",
            description: "Components in AngularJS, TypeScript and React documented in Storybook, to reuse them and keep the interface consistent.",
          },
          {
            title: "Alignment across teams",
            description: "Integrating 16 modules requires constant technical alignment with the back-end teams on contracts and flows.",
          },
          {
            title: "Automated tests",
            description: "Jest and React Testing Library covering front-end components and flows.",
          },
        ],
      },
    },
    qualicloud: {
      title: "SaaS products",
      summary: "As partner and tech lead, I turned business needs into web and mobile SaaS products, from architecture to delivery.",
      case: {
        context: "I co-founded QualiCloud, a SaaS solutions company, where I was a partner and the tech lead of the team building web and mobile products.",
        challenge: "Turn business needs into viable technical solutions and take products from concept to delivery.",
        role: [
          "Technical leadership: alignment, task distribution and delivery follow-up.",
          "Translated business needs into viable technical solutions.",
          "Defined and evolved the architecture of the web and mobile applications.",
          "APIs and integrations with Node.js, NestJS, PHP and Laravel; apps with React and React Native.",
        ],
        architecture: [
          { label: "Business needs" },
          { label: "Architecture and stack", detail: "technical definition" },
          { label: "APIs and integrations", detail: "Node.js · NestJS · PHP · Laravel" },
          { label: "SaaS products", detail: "web (React) · mobile (React Native)" },
        ],
        decisions: [
          {
            title: "Technical leadership close to the business",
            description: "Alignment, task distribution and delivery follow-up, translating business needs into technical solutions.",
          },
          {
            title: "React on web and mobile",
            description: "React for the web applications and React Native for mobile, with APIs in NestJS and Laravel.",
          },
        ],
      },
    },
    "godzilla-erp": {
      title: "GODZILLA ERP",
      summary:
        "A grocery-store mini-ERP with a NestJS REST API, MongoDB and Swagger: immutable stock ledger, orders confirmed in a transaction, multi-tenant demo companies and role-based access control.",
      case: {
        context: "A personal project to show real management-system back-end work, not just screens: a grocery-store mini-ERP with products, stock, customers, orders and a dashboard, backed by a NestJS API that is public and documented in Swagger.",
        challenge: "Let any visitor use the whole system — register products, sell, confirm orders — without signing up, without touching anyone else's data and at zero infrastructure cost (Vercel and MongoDB Atlas free tiers). All while keeping real ERP rules: stock that never goes negative, history that is never erased and money without rounding errors.",
        role: [
          "NestJS REST API on MongoDB: products, customers, stock movements, orders and a dashboard built with aggregation pipelines, documented in Swagger.",
          "One demo company per visitor, with deterministically generated store data (40 products, 12 customers and 6 months of orders) that deletes itself after 24 hours.",
          "Per-company JWT authentication, with Admin and Seller roles enforced by the API.",
          "Point of sale (POS): EAN and scale-label scanning, the \"3*code\" multiplier, keyboard shortcuts, Pix, card and cash with change, and a printable receipt.",
          "Next.js 16 screens with Server Components and server actions, using the portfolio's Design System, with input masks and form validation.",
          "Tests: API E2E with in-memory Mongo (including concurrent confirmations and tenant isolation), BFF unit tests and the full flow in Cypress, all in CI.",
        ],
        architecture: [
          { label: "Browser", detail: "React screens" },
          { label: "Next.js (BFF)", detail: "server actions · httpOnly cookie" },
          { label: "NestJS API", detail: "JWT · rate limit · Swagger" },
          { label: "MongoDB Atlas", detail: "transactions · TTL index" },
        ],
        result: "Live at /erp, with the public API in Swagger. Each visitor creates their own company in seconds and goes through the full flow: register, sell, confirm and watch stock and the dashboard change.",
        decisions: [
          {
            title: "Stock deducted in a transaction",
            description: "Confirming an order deducts every item inside a MongoDB transaction, and each deduction is a conditional update (only if there is enough stock). Two simultaneous orders never drive stock negative: either all items go out, or none do.",
          },
          {
            title: "Immutable ledger",
            description: "Stock is never edited directly: purchases, removals, adjustments, sales and cancellations become movements carrying the resulting balance. Money is stored as integer cents, with no floating-point errors.",
          },
          {
            title: "Multi-tenant with expiration",
            description: "Every document carries its company and expiration date, and every query filters by the token's company. A TTL index deletes the whole demo after 24 hours, with no cleanup job.",
          },
          {
            title: "Shared contracts",
            description: "Zod schemas live in a monorepo package: the same schema validates the form in Next.js, the request in NestJS and generates the Swagger docs.",
          },
          {
            title: "BFF between browser and API",
            description: "The browser never talks to the API: the token lives in an httpOnly cookie and calls leave the Next.js server with their own key and the visitor's real IP, so rate limiting applies per person.",
          },
          {
            title: "Serverless at zero cost",
            description: "The API runs as a Vercel function, with Nest initialized once per instance, on Atlas's free tier. A cap on simultaneous companies protects the plan.",
          },
          {
            title: "Idempotent checkout",
            description:
              "Each POS sale carries an idempotency key. A double click or a network drop after the write returns the same sale from the API, without charging or deducting stock twice — enforced by a unique index, even for simultaneous requests.",
          },
          {
            title: "Barcodes and scales",
            description:
              "EAN with check digit for packaged goods and PLU for weighed ones: the scale label (prefix 2) carries the weight, and the POS adds the quantity in kg. The same parser runs in the browser and is tested in the API.",
          },
        ],
      },
    },
    "godzilla-pay": {
      title: "GODZILLA Pay",
      summary:
        "A demo Pix payment gateway with a NestJS + PostgreSQL API: charges with BR Codes in the Brazilian Central Bank standard, a double-entry ledger enforced by the database, idempotency and signed webhooks with retries.",
      case: {
        context: "After the ERP, the portfolio was missing a system where the back end is the main character, on a topic that comes up in every fintech interview: payments. GODZILLA Pay is a demo Pix gateway — every visitor gets a test store with an API key and integrates the way a merchant would.",
        challenge: "Moving money calls for guarantees that can't rely on application code alone: no Pix paid twice, no refund above what was paid, no negative balance — even with concurrent requests, flaky networks and double clicks. And reliably notifying the merchant when the webhook endpoint is down. All on free tiers (Vercel and Neon).",
        role: [
          "NestJS REST API on PostgreSQL with hand-written SQL, no ORM: stores, API keys, charges, refunds, ledger and webhooks, documented in Swagger.",
          "Pix in the Central Bank EMV standard: BR Code (copy and paste) with CRC16 and a server-rendered QR code.",
          "Double-entry ledger: the balance is computed from entries, and the database rejects any unbalanced transaction at COMMIT.",
          "Webhooks queued in Postgres itself, HMAC signatures, retries with growing backoff, manual resend and an inspector that verifies the signature.",
          "Next.js screens (BFF) with the API key in an httpOnly cookie, to try the whole flow without writing code.",
          "Tests against a real embedded PostgreSQL, no Docker, including concurrency — 15 simultaneous confirmations of the same Pix and 10 concurrent refunds — running in CI.",
        ],
        architecture: [
          { label: "Browser", detail: "React screens" },
          { label: "Next.js (BFF)", detail: "server actions · httpOnly cookie" },
          { label: "NestJS API", detail: "API key · idempotency · Swagger" },
          { label: "PostgreSQL (Neon)", detail: "ledger · webhook queue" },
        ],
        result: "Live at /pay, with the public API in Swagger. Visitors create a store in seconds, generate a Pix, simulate the payment, refund it and follow every ledger entry and webhook — including simulating the endpoint being down.",
        decisions: [
          {
            title: "Double entry enforced by the database",
            description: "Payments and refunds become debit and credit entries. A deferred constraint trigger checks at COMMIT that every transaction sums to zero, and entries can't be updated or deleted. Not even an application bug can write crooked money.",
          },
          {
            title: "Concurrency without deadlocks",
            description: "Paying and refunding lock rows with FOR NO KEY UPDATE, always in the same order (store, then charge). FOR UPDATE deadlocked against the lock the idempotency foreign key had already taken — the concurrency test caught it before production.",
          },
          {
            title: "Idempotency in the same transaction",
            description: "The Idempotency-Key is written in the same transaction as the work. A concurrent retry waits, finds the stored response and returns it unchanged; if the work fails, the ROLLBACK takes the key with it. The same key with a different body is rejected.",
          },
          {
            title: "Outbox and SKIP LOCKED",
            description: "The event is queued in the same transaction that changes the charge: if it was paid, the webhook exists. Several workers take deliveries with FOR UPDATE SKIP LOCKED and never the same one; on failure, retries after 30 s, 2 min, 10 min, 1 h and 6 h.",
          },
          {
            title: "Signed webhooks",
            description: "Each delivery carries a Godzilla-Signature header with a timestamp and the HMAC-SHA256 of the body. The receiver checks it in constant time and rejects stale signatures — protecting against forged or replayed events.",
          },
          {
            title: "SSRF protection",
            description: "Webhook URLs must be public https on port 443. The IP is checked after DNS resolution, on the connection itself: domains pointing to the internal network or cloud metadata are rejected, DNS rebinding included.",
          },
          {
            title: "API keys treated like passwords",
            description: "The gz_test_ key is shown only once; the database keeps the prefix and a SHA-256. Rate limiting counts per key, and the test store disappears after 24 hours, cascading everything it owns.",
          },
          {
            title: "Real PostgreSQL in tests",
            description: "Tests start an embedded PostgreSQL, no Docker, in CI too: concurrency, database rules and the full Cypress flow of the site run on the same engine as production.",
          },
        ],
      },
    },
    "kaiju-stocks": {
      title: "Kaiju Stocks",
      summary:
        "B3 and crypto quotes, price history charts and a portfolio tracker with average price, dividends, a CDI benchmark and B3 spreadsheet import.",
    },
    "spotify-stats": {
      title: "GODZILLA Spotify Stats",
      summary: "Music stats with Spotify OAuth, Last.fm and a live showcase: top artists, tracks, genres and what's playing right now.",
    },
    "godzilla-ui": {
      title: "GODZILLA UI",
      summary: "The Design System behind every app: tokens, accessible components, i18n and documentation in Storybook.",
    },
  },
};
