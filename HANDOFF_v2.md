# Handoff — Fisheries Sustainability Assessment

## Session 2026-05-17 — FAO Pipeline Phase 1

**Completed:** Full FAO catch-based proxy pipeline (Phase 1).

- `scripts/fetch_fao.R` — fetches FAO Global Capture Production via `fishstat` R package, filters 12 species × area combinations, computes depletion ratio and Mann-Kendall τ/p, writes `data/processed/fao_proxy_metrics.csv`
- `scripts/generate_proxy_stocks.ts` — reads the CSV and overwrites `src/data/proxyStocksGenerated.ts`
- Atlantic redfishes flagged `Data-limited` via `FLAG_OVERRIDES` in the generator (pre-2000 REG+REB discontinuity)
- Haddock gets a `note` about the 2013 catch break and proxy bias
- `npm run fetch-fao` + `npm run generate-proxy` to re-run pipeline

Committed: `feat: add FAO catch-based proxy pipeline (Phase 1)`

---

## Session 2026-05-19 — Thresholds + Sensitivity + Concordance (Phases 2 & 3)

### Phase 2A — classifyProxy threshold update (`src/data/stocks.ts`)

Collapsed threshold changed **0.25 → 0.10**, grounded in Kleisner & Pauly (2011) SSplots methodology. Each rule now has inline citation:
- Collapsed < 0.10: Kleisner & Pauly 2011
- Overexploited band top 0.50: Martell & Froese 2013
- |τ| > 0.20 for Declining/Recovering: Carruthers et al. 2012

Effect on proxy classifications (from proxyStocksGenerated.ts data):
- Atlantic horse mackerel (d=0.175): was Collapsed → now Overexploited
- Sandeels (d=0.19): was Collapsed → now Overexploited
- Yellowtail flounder (d=0.135): was Collapsed → now Depleted
- Atlantic cod (d=0.024), American plaice (d=0.013): still Collapsed
- New summary: 5 Collapsed/Overexploited, 4 Depleted, 2 Recovering, 1 Data-limited

### Phase 2B — classifyIces comment (`src/data/stocks.ts`)

Added top-of-function comment: "These 6 categories are a custom visualization overlay, not an official ICES taxonomy. ICES uses the precautionary approach framework directly. See ICES CM 2004/ACFM:22." Added inline comments on each threshold.

### Phase 2C — Threshold sensitivity script

`scripts/threshold_sensitivity.ts` — runs all 24 stocks through 3 threshold sets (baseline, ×0.8 stricter, ×1.2 looser), reports stressed/not-stressed flips.

Output summary:
- **13/22 assessable stocks robust** (never flip stressed ↔ not-stressed)
- **9/22 sensitive** (flip under at least one threshold set)
- Sensitive proxy stocks: European sprat, Atlantic herring, Haddock, Blue whiting
- Sensitive ICES stocks: Atlantic mackerel, Common sole, Saithe, Arctic cod, Norwegian spring herring

Run: `./node_modules/.bin/tsx scripts/threshold_sensitivity.ts`

### Phase 2D — README + Methods.tsx updates

README changes:
- Status Classification proxy table: Collapsed threshold updated 0.25 → 0.10, added literature note
- Key Findings: rewritten with actual FAO pipeline values (removed stale pre-Phase-1 numbers)
- Added "Threshold sensitivity" subsection with 13/22 robustness count, citing Branch 2011 & Carruthers 2012; names European sprat, Atlantic herring, and Common sole as most sensitive (all quota-managed North Sea stocks)

Methods.tsx: FAO Proxy Track body updated with threshold citation sentence referencing the sensitivity script.

### Phase 3A — Concordance script

`scripts/method_concordance.ts` — compares ICES and proxy for 6 overlapping species.

**Key design decisions:**
- Atlantic cod: North Sea stock only (cod.27.47d20) displayed; excluded from statistics — geographic mismatch (ICES Area 27 vs FAO 21 / NW Atlantic, different ocean basin). Aggregating with NE Arctic cod (cod.27.1-2) was misleading: Barents Sea stock has higher SSB and dominates the weighted average.
- Atlantic herring: North Sea only (her.27.3a47d); Norwegian spring herring excluded — ICES Declining (opposite to NS Recovering), distinct management unit.
- Stats computed over **n=4**: NS herring, mackerel, haddock, blue whiting.

Results:
- Exact category agreement: **0/4**
- Directional agreement (stressed vs not-stressed): **0/4**
- Spearman ρ (proxy depletion vs ICES SSB/Btrigger): **0.00**

Run: `./node_modules/.bin/tsx scripts/method_concordance.ts`

### Phase 3B — README + Methods.tsx concordance sections

README:
- Added "Method comparison (ICES vs proxy)" section with 6-row table including geographic match column and footnotes
- Stats reported at n=4 with explicit "descriptive only, not a hypothesis test" disclaimer
- Failure mode bullets for each disagreeing pair (mackerel/blue whiting, haddock, NS herring)
- Key Findings concordance bullet updated to reflect n=4, ρ=0.00

Methods.tsx:
- New "Method Concordance (ICES vs Proxy, n=4)" block with inline table (6 rows, 6 columns)
- Paragraph explaining proxy still informative for non-ICES stocks despite bias

### Data values note

The user provided SSB/Btrigger values of 2.08 (haddock) and 1.34 (herring) in the session. These do NOT match the hardcoded data in `icesStocks` (haddock = 2.790, NS herring = 1.201). The README uses the actual data values. If these are from the ICES 2024 GNS Ecoregion Overview PDF (not yet placed in data/raw/), a cross-check task was raised but the PDF was absent. Verify haddock and herring SSB/Btrigger values against ICES SAG 2023/2024 before next session.

---

## Open tasks / next session

- [ ] ICES 2024 GNS Ecoregion Overview PDF cross-check (PDF not present at data/raw/ during this session — user placed request but file absent). When available: extract F/FMSY and SSB/Btrigger for Area 27 stocks, flag deviations > 0.05 from hardcoded values, populate `icesOfficialStatus2024` object in method_concordance.ts.
- [ ] Update Methods.tsx ICES section citation from "ICES SAG data" to ICES 2024 GNS Ecoregion Overview figshare DOI (per user's instruction, pending PDF).
- [ ] Verify haddock SSB/Btrigger = 2.790 and NS herring SSB/Btrigger = 1.201 against ICES SAG 2023 primary source.
