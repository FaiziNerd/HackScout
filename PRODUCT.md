# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Pakistani tech students, early-career developers, indie hackers, and founders. They are actively hunting for upcoming hackathons, tech conferences, workshops, developer meetups, and grant opportunities across Pakistan (Karachi, Lahore, Islamabad/Rawalpindi, Peshawar, Faisalabad, and nationwide/online). Secondary users are local event organizers seeking visibility in the tech ecosystem.

## Product Purpose

HackScout solves the extreme fragmentation of tech event discovery in Pakistan. Instead of missing deadlines across scattered WhatsApp groups, Facebook pages, university portals, Luma, Devfolio, and Unstop, users get a single, aggregated, verified pulse of every tech opportunity in Pakistan with actionable deadline tracking.

## Positioning

The only comprehensive, automated event aggregator specifically tuned to Pakistan's technology and university ecosystem (FAST, NUST, LUMS, GIKI, tech hubs, major platforms) with relentless focus on registration deadlines, countdown timers, and city-level filtering.

## Operating Context

- Mobile and desktop web browsers.
- Fast, high-density scanning: users often want to see "What is happening this weekend?" or "Which hackathon deadlines close this week?".
- Direct off-ramps to external registrations (Devfolio, Luma, Google Forms, Eventbrite) as well as native submission and RSVP capture.

## Capabilities and Constraints

- **Aggregation & Ingestion**: Scrapers pull from multi-source platforms (Devfolio, Devpost, Luma, Eventbrite, Unstop, university portals) into PostgreSQL via Prisma. Production runs once daily on GitHub Actions (`npm run scrape:all`).
- **Geographic Focus**: Pakistan-centric taxonomy (Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Faisalabad, Multan, Quetta, Online / Nationwide).
- **Time-sensitivity**: Strict deadline management, urgent tags (<48h left), status tracking (Upcoming, Ongoing, Passed).
- **Authentication & Personalization**: Supabase Auth for saved events, custom deadline alerts, and community submissions.
- **Admin Review**: Curated verification queue for user-submitted community events.

## Brand Commitments

- **Name**: HackScout (Event Finder)
- **Tone & Voice**: Editorial, high-utility, sharp, urgent, and technically astute. Not a generic festive event directory; tailored for builders, makers, and students.
- **Identity & Aesthetics**: Deep dark-mode editorial palette with purposeful contrast, refined typography, crisp metadata badging, and fluid micro-interactions.

## Evidence on Hand

- Next.js 16.3 + React 19 + Tailwind CSS v4 + Motion setup.
- Seeded Pakistan city taxonomy and Prisma database schema.
- Curated marketing landing page (`/`), nationwide feed structure (`/events`), city-filtered views (`/cities/[slug]`), event submissions (`/submit`), and administrative portal (`/admin`).

## Product Principles

1. **Deadlines Over Fluff**: Prioritize registration cutoffs, countdowns, and eligibility so builders never miss an opportunity.
2. **Exhaustive Discovery, Zero Noise**: Aggregated comprehensively across grassroots communities and global platforms, deduplicated and verified.
3. **Frictionless Off-ramps**: Surface the direct registration link immediately with no intermediate capture walls.
4. **Density & Scanability**: High-information architecture designed for quick triage by city, category, prize pool, and date.
5. **Community-Powered Accuracy**: Fast-track community submissions with administrative oversight.

## Accessibility & Inclusion

Targeting WCAG 2.1 AA standards: fully keyboard-navigable filter grids, high-contrast text ratios for dark backgrounds, explicit ARIA state on countdowns and modal dialogs, and robust responsiveness on mobile data networks across Pakistan.
