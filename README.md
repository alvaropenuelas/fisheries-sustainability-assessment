# North Atlantic Fisheries Sustainability Assessment

Dual-track sustainability assessment of 24 commercial fish stocks across ICES Areas 21 & 27 (1990–2023). Combines ICES formal stock assessments with FAO catch-based proxy indicators to classify stock status across six categories from Collapsed to Recovering.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-1D9E75?style=flat-square)](https://alvaropenuelas.github.io/fisheries-sustainability-assessment/)
[![License: MIT](https://img.shields.io/badge/License-MIT-1a2e3a?style=flat-square)](LICENSE)

> **Scope.** This is an educational data-synthesis and visualization project
> combining published **ICES Stock Assessment Graphs (SAG)** reference points
> with **FAO FishStat** capture data. It is **not** a formal stock assessment and
> does not follow the ICES Transparent Assessment Framework (TAF), which governs
> official ICES advisory products. For authoritative stock status and management
> advice, consult [ICES Advice](https://www.ices.dk/advice) and
> [ICES SAG](https://standardgraphs.ices.dk).

---

## Research Question

North Atlantic commercial fish stocks are assessed under two independent frameworks: ICES formal stock assessments and FAO catch-based proxy indicators. This project asks whether both methods agree on which stocks are in trouble.

---

## Methods

### Track 1 — ICES Direct Assessment (N=12, Area 27)

Uses F/F<sub>MSY</sub> and SSB/MSY B<sub>trigger</sub> from the ICES Stock Assessment Graph (SAG) database (2025 assessments; two stocks use SAG 2023 fallback values — see Limitations). These are model-derived indices of fishing mortality relative to the maximum sustainable yield proxy and spawning stock biomass relative to the precautionary biomass trigger, respectively. Classification follows the ICES two-dimensional precautionary approach framework [10].

Visualised as a Kobe plot: F/F<sub>MSY</sub> on the x-axis, SSB/MSY B<sub>trigger</sub> on the y-axis, with reference lines at 1.0 on both axes defining the four management quadrants.

### Track 2 — Catch-Based Proxy Method (N=12, Areas 21 & 27)

Applied to stocks outside ICES scope or lacking formal assessments. Two indicators derived from FAO FishStat annual catch series:

1. **Depletion ratio** (C/C<sub>max</sub>): ratio of the most recent three-year mean catch to the historical maximum three-year mean catch. Used as a relative biomass proxy following Kleisner & Pauly [4] and Martell & Froese [5].
2. **Mann-Kendall τ** [8, 9]: non-parametric trend statistic applied to the 1990–2023 subseries. Detects monotonic increase or decrease; p < 0.05 indicates a significant trend.

### FAO Proxy Pipeline

**Data source:** `fishstat` R package v2026.1.0.0 (Magnusson & Sharma; FAO copyright), which bundles FAO Global Capture Production data 1950–2024. No external download required. Species identified by ASFIS 3-alpha code; area by FAO major fishing area code.

**Species × FAO major area definitions:**

| Stock | Scientific name | ASFIS code(s) | FAO area |
|---|---|---|---|
| Atlantic horse mackerel | *Trachurus trachurus* | HOM | 27 |
| Atlantic redfishes | *Sebastes marinus* + *S. mentella* | REG + REB | 27 |
| Sandeels | *Ammodytes* spp. | SAN | 27 |
| European sprat | *Sprattus sprattus* | SPR | 27 |
| Atlantic herring | *Clupea harengus* | HER | 27 |
| Atlantic cod | *Gadus morhua* | COD | 21 |
| Atlantic mackerel | *Scomber scombrus* | MAC | 27 |
| Blue whiting | *Micromesistius poutassou* | WHB | 27 |
| Haddock | *Melanogrammus aeglefinus* | HAD | 27 |
| American plaice | *Hippoglossoides platessoides* | PLA | 21 |
| Yellowtail flounder | *Limanda ferruginea* | YEL | 21 |
| Atlantic wolffish | *Anarhichas lupus* | CAA | 27 |

Atlantic redfishes catches are summed across both codes before computing any indicator.

**Depletion formula:** Let S[t] = trailing 3-year moving average of annual catch (tonnes live weight). Then:

> D = mean(S[T−2], S[T−1], S[T]) / max(S)

where T is the last available year and max(S) is computed over the full 1950–present series.

**Trend formula:** Mann-Kendall τ and two-sided p computed on S[t] restricted to 1990–2023, using `Kendall::MannKendall()` in R (Kendall package). Stocks with fewer than 20 data years are flagged Data-limited and excluded from trend analysis.

**Re-run the pipeline:**

```bash
# requires R ≥ 4.0 with packages: dplyr, tidyr, readr, Kendall, fishstat
npm run fetch-fao

# requires Node ≥ 18 (uses npx tsx — no global install needed)
npm run generate-proxy
```

`fetch-fao` loads data from the `fishstat` package, filters to the 12 stocks, and writes `data/processed/fao_proxy_metrics.csv`. `generate-proxy` reads that CSV and overwrites `src/data/proxyStocksGenerated.ts`. Neither script is wired into the build step; the app ships with the last committed generated file.

---

## Status Classification

### ICES Track (applied in order — first match wins)

| Status | F/F<sub>MSY</sub> | SSB/MSY B<sub>trigger</sub> | Color |
|---|---|---|---|
| Collapsed | > 1.5 | < 0.5 | `#B33A3A` |
| Overexploited | > 1.2 | < 0.8 | `#C77D2E` |
| Depleted | any | < 0.8 | `#D9A856` |
| Declining | > 1.1 | any | `#6B8FAE` |
| Recovering | < 0.9 | > 1.2 | `#2C6E4F` |
| Stable | all other | all other | `#4A8B6F` |
| Data-limited | assessmentType = escapement (sprat only) | — | `#8A8A82` |

### Proxy Track (applied in order — first match wins)

Collapsed threshold (C/C<sub>max</sub> < 0.10) follows Kleisner & Pauly (2011) SSplots stock-status methodology. The 0.50 band boundary derives from Martell & Froese (2013). The |τ| > 0.20 cutoff for Declining/Recovering is grounded in Carruthers et al. (2012) sensitivity analysis.

| Status | Depletion ratio | τ | p |
|---|---|---|---|
| Collapsed | < 0.10 | — | — |
| Overexploited | 0.10 – 0.50 | < 0 | < 0.05 |
| Depleted | 0.10 – 0.50 | any | any |
| Declining | ≥ 0.50 | < −0.20 | < 0.05 |
| Recovering | ≥ 0.50 | > 0.20 | < 0.05 |
| Stable | all other | — | — |

> **Note on "Declining".** This label carries a different meaning in each track.
> In the **ICES track** it reflects fishing *pressure* (F/F_MSY > 1.1) and is an
> early warning of overfishing — the stock's biomass may still be healthy
> (e.g. North Sea herring: F/F_MSY ≈ 1.26 but SSB/MSY B_trigger ≈ 1.38). In the
> **proxy track** it reflects a statistically significant downward *catch-volume*
> trend (Mann-Kendall τ < −0.20, p < 0.05). The two are not directly comparable:
> an ICES "Declining" stock may be abundant but currently overfished, whereas a
> proxy "Declining" stock shows a sustained drop in landings of unknown absolute
> cause. Compare within a track, not across tracks.

### Threshold sensitivity

Proxy thresholds follow the SSplots/Sea Around Us classification logic (Kleisner & Pauly 2011) and the two-indicator framework of Branch et al. (2011), with the |τ| > 0.20 boundary grounded in Carruthers et al. (2012). ICES thresholds are anchored to F<sub>MSY</sub> and MSY B<sub>trigger</sub> reference points per ICES CM 2004/ACFM:22.

To test threshold robustness, all 24 stocks were classified under three proxy/ICES threshold sets: baseline (as above), stricter (all thresholds ×0.8), and looser (all thresholds ×1.2). A stock is "robust" if it never flips between stressed (Collapsed/Overexploited/Depleted/Declining) and not-stressed across all three sets. Script: `scripts/threshold_sensitivity.ts`.

**13 of 22 assessable stocks are robust** (2 Data-limited excluded). The 9 sensitive stocks are borderline cases: European sprat, Atlantic herring, Haddock, and Blue whiting in the proxy track, and Atlantic mackerel, Common sole, Saithe, Arctic cod, and Norwegian spring herring in the ICES track. Core findings — severe depletion of Atlantic cod (FAO 21), American plaice, and persistent overfishing of Blue whiting — are threshold-invariant. Among proxy stocks, European sprat, Atlantic herring, and Common sole are the three most threshold-sensitive: all are quota-managed North Sea stocks where catch trends are a poor biomass proxy, consistent with Branch et al. (2011).

---

## Key Findings

- **7 of 10 assessable ICES stocks** (70%) have SSB/MSY B<sub>trigger</sub> < 1 or F/F<sub>MSY</sub> > 1 (sprat and capelin excluded — no applicable F/F<sub>MSY</sub> reference point; stocks flagged: NS cod, NS herring, NE Atlantic mackerel, blue whiting, saithe, Norwegian spring herring, Arctic cod)
- **North Sea cod** (cod.27.46a7d20, Southern Substock): F/F<sub>MSY</sub> = 2.567, SSB/MSY B<sub>trigger</sub> = 0.448 — classified Collapsed; heavily overfished (F well above F<sub>MSY</sub>) with biomass well below the precautionary trigger
- **European plaice** (ple.27.420): SSB/MSY B<sub>trigger</sub> = 1.908 — the only stock well above its biomass trigger, classified Recovering
- **5 of 11 assessable proxy stocks** are Collapsed or Overexploited (FAO pipeline, new threshold C/C<sub>max</sub> < 0.10 for Collapsed per Kleisner & Pauly 2011): Atlantic cod FAO 21 (D = 0.024, τ = −0.287), American plaice (D = 0.013, τ = −0.900), Atlantic horse mackerel (D = 0.175, τ = −0.807), Sandeels (D = 0.190, τ = −0.601), Atlantic wolffish (D = 0.441, τ = −0.469)
- **4 additional proxy stocks** (European sprat, Atlantic herring, Haddock, Yellowtail flounder) are Depleted (D = 0.10–0.50); Haddock has a significant positive trend (τ = +0.373, p = 0.002) but depletion ratio is below 0.50 — consistent with catch-based proxy bias documented in Branch et al. (2011)
- **2 proxy stocks** show strong recovery signals: Atlantic mackerel (D = 0.848, τ = +0.408, p < 0.001) and Blue whiting (D = 0.593, τ = +0.251, p = 0.038)
- Atlantic redfishes (FAO 27) are flagged Data-limited: a pre-2000 reporting discontinuity in REG+REB catches makes the depletion ratio uninterpretable
- **ICES formal assessments and FAO catch-based proxies show zero directional agreement** across all four valid geographic pairs (n=4: NS herring, mackerel, haddock, blue whiting; cod excluded — geographic mismatch FAO 21 vs Area 27; sprat excluded — ICES Data-limited). Spearman ρ between proxy depletion and ICES SSB/MSY B<sub>trigger</sub> = 0.00 (n=4). This empirically confirms catch-only proxy limitations for actively quota-managed stocks described in Branch et al. (2011) and Carruthers et al. (2012). Full analysis: see Method comparison section and `scripts/method_concordance.ts`.

---

## Method comparison (ICES vs proxy)

Six species overlap between the two tracks. Statistics are computed for four geographically comparable pairs. Atlantic cod is listed but excluded from statistics: ICES covers Area 27 (NE Atlantic) while the proxy covers FAO 21 (NW Atlantic / Grand Banks) — different ocean basin and population. Atlantic herring uses North Sea stock only (her.27.3a47d); Norwegian spring herring (her.27.1-24a514a, ICES Declining) excluded — opposite classification and distinct management unit. European sprat excluded — ICES Data-limited (escapement-managed). Script: `scripts/method_concordance.ts`.

| Species | ICES category | Proxy category | ICES str | Proxy str | Geo match | In stats |
|---|---|---|---|---|---|---|
| Atlantic cod | Depleted¹ | Collapsed | S | S | NO | — |
| Atlantic herring | Recovering² | Depleted | N | S | PARTIAL | YES |
| Atlantic mackerel | Declining | Recovering | S | N | YES | YES |
| Haddock | Recovering | Depleted | N | S | YES | YES |
| Blue whiting | Declining | Recovering | S | N | YES | YES |
| European sprat | Data-limited³ | Depleted | — | S | YES | — |

¹ North Sea cod only (cod.27.47d20). Aggregating with NE Arctic cod (cod.27.1-2) was misleading — Barents Sea stock has different population dynamics and its higher SSB dominates the weighted average, masking North Sea depletion.  
² North Sea herring only (her.27.3a47d). Norwegian spring herring (her.27.1-24a514a) excluded — ICES classifies it as Declining, the opposite of North Sea herring (Recovering).  
³ ICES classifies European sprat as Data-limited (escapement-managed; no F/F<sub>MSY</sub> reference point).

**Valid pairs (n=4):** NS herring, Atlantic mackerel, Haddock, Blue whiting

| Metric | Result |
|---|---|
| Exact category agreement | 0/4 |
| Directional agreement (stressed vs not-stressed) | 0/4 |
| Spearman ρ (proxy depletion vs ICES SSB/MSY B<sub>trigger</sub>) | 0.00 |

n=4 is too small for statistical inference. This is a descriptive finding, not a hypothesis test.

**ICES 2025 GNS ecoregion cross-check [12]** (categorical flags from Figure 12 and Annex Table A1; no numerical values in PDF):

| Metric | Result |
|---|---|
| Stressed/not-stressed agreement vs ICES 2025 categorical status | 5/7 |
| Excluded | NS cod (stock code restructured — see Limitations); European sprat (Data-limited) |
| Mismatches | Common sole (SAG 2023 SSB below trigger; 2025 shows recovery above trigger); Saithe (SAG 2023 F below F<sub>MSY</sub>; 2025 shows F above) |

Both mismatches reflect data-vintage differences (SAG 2023 vs 2025 assessment year), not methodological error. Script: `scripts/ices_official_status_check.ts`.

The systematic disagreement is consistent with theoretical predictions for catch-based stock status methods applied to quota-managed fisheries (Branch et al. 2011; Carruthers et al. 2012). The pattern runs in opposite directions for different failure modes:

- **Atlantic mackerel and blue whiting**: rising catches during active fishing pressure (depletion ratios 0.85 and 0.59, positive Mann-Kendall trends) interpreted as recovery by the proxy → Recovering. ICES F/F<sub>MSY</sub> = 1.17 and 1.61 confirm overfishing → both Declining. The proxy cannot distinguish biomass rebuilding from quota-driven catch increases.
- **Haddock**: post-2013 catch reduction (likely TAC-driven, ~30% drop) interpreted as biomass depletion by the proxy → Depleted. ICES SSB/MSY B<sub>trigger</sub> = 4.016 shows the stock is well above its biomass trigger → Recovering. The proxy misclassifies stocks whose catches decline because of management, not population collapse.
- **North Sea herring**: stable recent catches at ~42% of historical peak read as depleted by the proxy → Depleted. ICES SSB/MSY B<sub>trigger</sub> = 1.377 confirms the stock is above its biomass trigger → Recovering. Flat catch at quota reflects managed restraint, not low abundance.

Cod excluded from statistics (geographic mismatch). Sprat excluded (Data-limited). See Methods section for full pair definitions.

---

## Tech Stack

![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22b5bf?style=flat-square)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=flat-square&logo=greensock&logoColor=black)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-black?style=flat-square&logo=framer&logoColor=white)

Deployed to GitHub Pages via GitHub Actions. All data hardcoded in `src/data/stocks.ts` — no external API calls at runtime.

---

## Run Locally

```bash
git clone https://github.com/alvaropenuelas/fisheries-sustainability-assessment.git
cd fisheries-sustainability-assessment
npm install
npm run dev
```

---

## Data Sources & Licensing

| Source | Coverage | License |
|---|---|---|
| ICES Stock Assessment Database [1] | Area 27, 12 stocks, 2025 assessments (SAG 2023 fallback for cap.27.1-2 and cod.27.1-2) | CC BY 4.0 |
| FAO FishStat [3] | Areas 21 & 27, catch series 1950–2023 | CC BY-NC-SA 3.0 IGO |

### Data provenance

- **ICES track** (12 stocks): F, SSB, F<sub>MSY</sub>, and MSY B<sub>trigger</sub>
  are pulled from the ICES SAG web services by `scripts/fetch_ices_sag.R` and
  converted to TypeScript by `scripts/generate_ices_stocks.ts` (assessment year
  2025, terminal data through 2024), and written to
  `src/data/icesStocksGenerated.ts`. Two stocks not published via the SAG API
  (cap.27.1-2 and cod.27.1-2 — joint Norwegian-Russian assessments) use hardcoded
  SAG 2023 fallback values. Values were cross-checked against
  [ICES SAG](https://standardgraphs.ices.dk) on 2026-06-07.
- **Proxy track** (12 stocks): FAO FishStat capture data (bundled in the
  `fishstat` R package) processed by `scripts/fetch_fao.R` and
  `scripts/generate_proxy_stocks.ts`, written to
  `src/data/proxyStocksGenerated.ts`.
- **Regeneration is manual**, not part of the build: run `npm run fetch-ices-sag`
  + `npm run generate-ices` (ICES) and `npm run fetch-fao` +
  `npm run generate-proxy` (proxy) to refresh data. The committed `*Generated.ts`
  files reflect the last manual run.

---

## Limitations

**North Sea cod stock code restructured.** The legacy aggregate stock `cod.27.47d20` was restructured in ICES 2023 advice into three substocks: Northern (`cod.27.46a7d20NW`), Southern (`cod.27.46a7d20`), and Viking (`cod.27.46a7d20V`). This assessment uses the Southern North Sea substock (`cod.27.46a7d20`, ICES 2025 advice [12]): F/F<sub>MSY</sub> = 2.567, SSB/MSY B<sub>trigger</sub> = 0.448, classified Collapsed. The Northern and Viking substocks are not included; their exclusion means the aggregate stock-level picture is not represented.

**ICES data vintage (SAG 2023).** Two stocks show discrepancies between our SAG 2023 values and ICES 2025 [12] categorical status: Common sole (our SSB/B<sub>trigger</sub> = 0.746 from SAG 2023 indicates below trigger; 2025 assessment shows recovery to above B<sub>trigger</sub>) and Saithe (our F/F<sub>MSY</sub> = 0.901 was below F<sub>MSY</sub> in 2023; 2025 assessment indicates F slightly above F<sub>MSY</sub>). Cross-check script: `scripts/ices_official_status_check.ts`.

**Catch ≠ biomass.** The depletion ratio uses catch series as a relative biomass proxy. Catch trends reflect fishing effort, quota management, market dynamics, and reporting changes — not stock biomass directly. This ambiguity is explicitly documented in Branch et al. [6] and Carruthers et al. [7], who show that catch-based methods can misclassify stock status relative to formal assessments.

**Mann-Kendall detects only monotonic trends.** Non-linear stock trajectories — collapse followed by partial recovery, or recovery interrupted by a new decline — may be misclassified. A stock with a U-shaped catch series over 1990–2023 could return τ ≈ 0 and be classified Stable despite having collapsed and partially rebuilt.

**ICES assessments are authoritative.** Where both tracks cover the same species (cod, herring, mackerel, haddock, blue whiting, sprat), the ICES direct assessment supersedes the proxy estimate. The proxy track is applied only where ICES data are unavailable.

---

## References

1. ICES Stock Assessment Database. Copenhagen, Denmark: ICES; 2023. Accessed May 2026. <https://standardgraphs.ices.dk>
2. Millar C, Large S, Magnusson A, Pinto C, Petre LA. icesSAG: Stock Assessment Graphs Database Web Services. R package v1.6.1. CRAN. <https://cran.r-project.org/package=icesSAG>
3. FAO. FishStat: Global Capture Production [database]. Rome: FAO; 2025. <https://www.fao.org/fishery/statistics/software/fishstat>
4. Kleisner K, Pauly D. Stock-status plots of fisheries for regional seas. In: The State of Biodiversity and Fisheries in Regional Seas. Vancouver: Sea Around Us Project; 2011.
5. Martell S, Froese R. A simple method for estimating MSY from catch and resilience. *Fish Fisheries*. 2013;14(4):504–514. [doi:10.1111/j.1467-2979.2012.00485.x](https://doi.org/10.1111/j.1467-2979.2012.00485.x)
6. Branch TA, Jensen OP, Ricard D, Ye Y, Hilborn R. Contrasting global trends in marine fishery status obtained from catches and from stock assessments. *Conserv Biol*. 2011;25(4):777–786. [doi:10.1111/j.1523-1739.2011.01687.x](https://doi.org/10.1111/j.1523-1739.2011.01687.x)
7. Carruthers TR, Punt AE, Walters CJ, MacCall A, McAllister MK, Dick EJ, Cope J. Evaluating methods that classify fisheries stock status using only fisheries catch data. *Fish Res*. 2012;119–120:66–79. [doi:10.1016/j.fishres.2011.12.011](https://doi.org/10.1016/j.fishres.2011.12.011)
8. Mann HB. Nonparametric tests against trend. *Econometrica*. 1945;13(3):245–259. [doi:10.2307/1907187](https://doi.org/10.2307/1907187)
9. Kendall MG. *Rank Correlation Methods*. 4th ed. London: Charles Griffin; 1975.
10. ICES. The ICES approach to MSY. ICES CM 2004/ACFM:22. Copenhagen: ICES; 2004.
11. European Commission. Regulation (EU) No 1380/2013 of the European Parliament and of the Council on the Common Fisheries Policy. *OJ L* 354/22; 2013.
12. ICES. 2025. Greater North Sea ecoregion – fisheries overview. In Report of the ICES Advisory Committee, 2025. ICES Advice 2025, section 9.2. [doi:10.17895/ices.advice.30710897](https://doi.org/10.17895/ices.advice.30710897)

---

## Author

Álvaro Peñuelas Sánchez

[github.com/alvaropenuelas](https://github.com/alvaropenuelas)

