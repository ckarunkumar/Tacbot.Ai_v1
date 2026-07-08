# Graph Report - d:/Claude/Tacbot  (2026-04-22)

## Corpus Check
- Corpus is ~6,020 words - fits in a single context window. You may not need a graph.

## Summary
- 40 nodes · 47 edges · 11 communities detected
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Scroll Reveal Animations|Scroll Reveal Animations]]
- [[_COMMUNITY_Hub-Spoke Packet Flow|Hub-Spoke Packet Flow]]
- [[_COMMUNITY_Globe Core Functions|Globe Core Functions]]
- [[_COMMUNITY_Globe Geo Visualization|Globe Geo Visualization]]
- [[_COMMUNITY_TACbot Brand Identity|TACbot Brand Identity]]
- [[_COMMUNITY_Globe Draw Utilities|Globe Draw Utilities]]
- [[_COMMUNITY_Stars Background|Stars Background]]
- [[_COMMUNITY_Globe Loop & Geometry|Globe Loop & Geometry]]
- [[_COMMUNITY_Patch Script|Patch Script]]
- [[_COMMUNITY_Stars Canvas|Stars Canvas]]
- [[_COMMUNITY_Nav Scroll Tint|Nav Scroll Tint]]

## God Nodes (most connected - your core abstractions)
1. `Ecosystem Hub & Spoke — SVG Lines + Node Reveal` - 7 edges
2. `GSAP ScrollTrigger (External Library)` - 6 edges
3. `Scroll-triggered Reveal Pattern` - 6 edges
4. `Globe Manager — Dotted World Map with Routes` - 5 edges
5. `Network Canvas — Feature A (Vendor Hub-Spoke)` - 5 edges
6. `initGlobeInstance()` - 3 edges
7. `resize()` - 3 edges
8. `draw()` - 3 edges
9. `GSAP Entrance Animations` - 3 edges
10. `TACbot Logo — White SVG Wordmark` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Ecosystem Hub & Spoke Replacement Block` --semantically_similar_to--> `Ecosystem Hub & Spoke — SVG Lines + Node Reveal`  [INFERRED] [semantically similar]
  patch.js → script.js
- `TAC Hub Node (Central Orchestrator in Network Canvas)` --conceptually_related_to--> `TACbot Logo — White SVG Wordmark`  [INFERRED]
  script.js → Assets/Logo-white.svg
- `patch.js — Script Patcher` --implements--> `Ecosystem Hub & Spoke — SVG Lines + Node Reveal`  [EXTRACTED]
  patch.js → script.js

## Hyperedges (group relationships)
- **Hub-Spoke + Animated Packet Flow Pattern** — concept_hubspoke, concept_animatedpackets, script_networkcanvas, script_ecosystemhubspoke [INFERRED 0.88]
- **Scroll Reveal via GSAP ScrollTrigger (Site-wide Pattern)** — concept_scrollreveal, script_scrolltrigger, script_gsapentrance, script_ecosystemhubspoke, script_calendardemo, script_scorecardanim [EXTRACTED 0.95]
- **Patch.js Replaces Ecosystem Section in Script.js** — patch_patchscript, patch_ecosystemhubspoke_replacement, script_ecosystemhubspoke [EXTRACTED 1.00]

## Communities

### Community 0 - "Scroll Reveal Animations"
Cohesion: 0.39
Nodes (8): Scroll-triggered Reveal Pattern, Calendar Demo — Feature B, CTA Section — Particles & Reveal, TACbot Edge — Praha Scroll Reveal, GSAP Animation Library (External), GSAP Entrance Animations, Scorecard Animation — Feature C, GSAP ScrollTrigger (External Library)

### Community 1 - "Hub-Spoke Packet Flow"
Cohesion: 0.38
Nodes (7): Animated Data Packet / Moving Dot Pattern, Hub-and-Spoke Topology Pattern, Ecosystem Hub & Spoke Replacement Block, patch.js — Script Patcher, Ecosystem Hub & Spoke — SVG Lines + Node Reveal, Network Canvas — Feature A (Vendor Hub-Spoke), Vendor Nodes (AWS, Azure, ServiceNow, Jira, Datadog, PagerDuty)

### Community 2 - "Globe Core Functions"
Cohesion: 0.33
Nodes (0): 

### Community 3 - "Globe Geo Visualization"
Cohesion: 0.4
Nodes (5): D3.js (External — geo projection & interpolation), Globe City Coordinates (12 Cities), Globe Manager — Dotted World Map with Routes, Globe Trade Routes (10 Cross-Continental Arcs), TopoJSON (External — world atlas parsing)

### Community 4 - "TACbot Brand Identity"
Cohesion: 0.5
Nodes (4): Chip/Circuit Board Icon (Left portion of logo), TACbot Logo — White SVG Wordmark, TACbot Wordmark Text (TAC + bot lettering), TAC Hub Node (Central Orchestrator in Network Canvas)

### Community 5 - "Globe Draw Utilities"
Cohesion: 0.67
Nodes (3): draw(), initGlobeInstance(), spawnPacket()

### Community 6 - "Stars Background"
Cohesion: 1.0
Nodes (2): initStars(), resize()

### Community 7 - "Globe Loop & Geometry"
Cohesion: 1.0
Nodes (2): drawLoop(), getCenter()

### Community 8 - "Patch Script"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Stars Canvas"
Cohesion: 1.0
Nodes (1): Stars Canvas Animation

### Community 10 - "Nav Scroll Tint"
Cohesion: 1.0
Nodes (1): Nav Scroll Tint

## Knowledge Gaps
- **12 isolated node(s):** `patch.js — Script Patcher`, `Ecosystem Hub & Spoke Replacement Block`, `Stars Canvas Animation`, `Nav Scroll Tint`, `GSAP Animation Library (External)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Stars Background`** (2 nodes): `initStars()`, `resize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Globe Loop & Geometry`** (2 nodes): `drawLoop()`, `getCenter()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Patch Script`** (1 nodes): `patch.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Stars Canvas`** (1 nodes): `Stars Canvas Animation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Nav Scroll Tint`** (1 nodes): `Nav Scroll Tint`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Ecosystem Hub & Spoke — SVG Lines + Node Reveal` connect `Hub-Spoke Packet Flow` to `Scroll Reveal Animations`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Why does `Network Canvas — Feature A (Vendor Hub-Spoke)` connect `Hub-Spoke Packet Flow` to `TACbot Brand Identity`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `Animated Data Packet / Moving Dot Pattern` connect `Hub-Spoke Packet Flow` to `Globe Geo Visualization`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `Ecosystem Hub & Spoke — SVG Lines + Node Reveal` (e.g. with `Ecosystem Hub & Spoke Replacement Block` and `Hub-and-Spoke Topology Pattern`) actually correct?**
  _`Ecosystem Hub & Spoke — SVG Lines + Node Reveal` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `Scroll-triggered Reveal Pattern` (e.g. with `GSAP Entrance Animations` and `Calendar Demo — Feature B`) actually correct?**
  _`Scroll-triggered Reveal Pattern` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Network Canvas — Feature A (Vendor Hub-Spoke)` (e.g. with `Hub-and-Spoke Topology Pattern` and `Animated Data Packet / Moving Dot Pattern`) actually correct?**
  _`Network Canvas — Feature A (Vendor Hub-Spoke)` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `patch.js — Script Patcher`, `Ecosystem Hub & Spoke Replacement Block`, `Stars Canvas Animation` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._