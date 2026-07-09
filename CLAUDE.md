# TACbot Project

## Understanding the Codebase

Read `graphify-out/GRAPH_REPORT.md` to understand project structure before making changes. It contains the knowledge graph, community clusters, and key abstractions.

## Project Overview (from graph)

TACbot is a marketing/product landing page with:

- **Globe visualization** — dotted world map with trade routes, D3.js + TopoJSON, city coordinates, animated packets
- **Network canvas** — hub-spoke SVG topology showing vendor integrations (AWS, Azure, ServiceNow, Jira, Datadog, PagerDuty) with animated data packets
- **Scroll reveal animations** — GSAP ScrollTrigger drives entrance animations site-wide (calendar demo, scorecard, CTA, edge reveals)
- **Stars background** — canvas animation (`initStars`, `resize`)
- **Nav scroll tint** — navbar changes on scroll
- **Brand** — TACbot white SVG wordmark, chip/circuit icon

## Key Files

- `script.js` — main logic (globe, network canvas, GSAP animations, scroll triggers)
- `Assets/Logo-white.svg` — brand wordmark

## Core Abstractions

1. `Ecosystem Hub & Spoke — SVG Lines + Node Reveal` — central feature, bridges scroll reveal + hub-spoke communities
2. `GSAP ScrollTrigger` — drives all scroll-based reveals
3. `Globe Manager` — dotted world map with routes
4. `Network Canvas — Feature A` — vendor hub-spoke with animated packets

## Architecture Notes

- Hub-spoke pattern + animated packet flow used in both Network Canvas and Ecosystem section
- GSAP ScrollTrigger is the scroll reveal mechanism across: calendar demo, scorecard, CTA, ecosystem, edge reveals
