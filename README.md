# North Atlantic Fisheries Sustainability Assessment

Dual-track sustainability assessment of 24 commercial fish stocks across ICES Areas 21 & 27 (1990–2023). Combines ICES formal stock assessments with FAO catch-based proxy indicators to classify stock status across six categories from Collapsed to Recovering.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-1D9E75?style=flat-square)](https://alvaropenuelas.github.io/fisheries-sustainability-assessment/)
[![License: MIT](https://img.shields.io/badge/License-MIT-1a2e3a?style=flat-square)](LICENSE)

---

## Research Question

North Atlantic commercial fish stocks are assessed under two independent frameworks: ICES formal stock assessments and FAO catch-based proxy indicators. This project asks whether both methods agree on which stocks are in trouble.

---

## Methods

### Track 1 — ICES Direct Assessment (N=12, Area 27)

Uses F/F<sub>MSY</sub> and SSB/MSY B<sub>trigger</sub> from the ICES Stock Assessment Graph (SAG) database (2023 assessments). These are model-derived indices of fishing mortality relative to the maximum sustainable yield proxy and spawning stock biomass relative to the precautionary biomass trigger, respectively. Classification follows the ICES two-dimensional precautionary approach framework [10].

Visualised as a Kobe plot: F/F<sub>MSY</sub> on the x-axis, SSB/MSY B<sub>trigger</sub> on the y-axis, with reference lines at 1.0 on both axes defining the four management quadrants.

### Track 2 — Catch-Based Proxy Method (N=12, Areas 21 & 27)

Applied to stocks outside ICES scope or lacking formal assessments. Two indicators derived from FAO FishStat annual catch series:

1. **Depletion ratio** (C/C<sub>max</sub>): ratio of the most recent three-year mean catch to the historical maximum three-year mean catch. Used as a relative biomass proxy following Kleisner & Pauly [4] and Martell & Froese [5].
2. **Mann-Kendall τ** [8, 9]: non-parametric trend statistic applied to the 1990–2023 subseries. Detects monotonic increase or decrease; p < 0.05 indicates a significant trend.

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

| Status | Depletion ratio | τ | p |
|---|---|---|---|
| Collapsed | < 0.25 | — | — |
| Overexploited | < 0.50 | < 0 | < 0.05 |
| Depleted | < 0.50 | any | any |
| Declining | ≥ 0.50 | < −0.2 | < 0.05 |
| Recovering | ≥ 0.50 | > 0.2 | < 0.05 |
| Stable | all other | — | — |

---

## Key Findings

- **6 of 10 assessable ICES stocks** (60%) are below MSY B<sub>trigger</sub> or subject to overfishing (sprat and capelin excluded — no F/F<sub>MSY</sub> reference point)
- **North Sea cod** (cod.27.47d20): F/F<sub>MSY</sub> = 0.882, SSB/MSY B<sub>trigger</sub> = 0.554 — classified Depleted; biomass remains below MSY B<sub>trigger</sub> despite fishing mortality below F<sub>MSY</sub>
- **European plaice** (ple.27.420): SSB/MSY B<sub>trigger</sub> = 1.885 — the only stock well above its biomass trigger, classified Recovering
- **7 of 12 proxy stocks** are Collapsed or Overexploited, including Atlantic horse mackerel (D = 0.04, τ = −0.79), Atlantic redfishes (D = 0.10, τ = −0.83), and American plaice (D = 0.08, τ = −0.71)
- **3 proxy stocks** show significant positive trends: Atlantic mackerel (τ = 0.45, p < 0.001), Haddock (τ = 0.31, p = 0.028), Blue whiting (τ = 0.28, p = 0.038)
- Both tracks agree on direction for overlapping species (cod, herring, mackerel, haddock, blue whiting, sprat) in 5 of 6 cases
- **Atlantic mackerel and blue whiting diverge between tracks**: Declining under ICES assessment (F/F<sub>MSY</sub> > 1.1) but Recovering under FAO proxy — consistent with the catch-based proxy bias documented in Branch et al. (2011)

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
| ICES Stock Assessment Database [1] | Area 27, 12 stocks, 2023 assessments | CC BY 4.0 |
| FAO FishStat [3] | Areas 21 & 27, catch series 1950–2023 | CC BY-NC-SA 3.0 IGO |

Values were manually transcribed at time of writing (May 2026). Verify against primary sources before citing.

---

## Limitations

**Catch ≠ biomass.** The depletion ratio uses catch series as a relative biomass proxy. Catch trends reflect fishing effort, quota management, market dynamics, and reporting changes — not stock biomass directly. This ambiguity is explicitly documented in Branch et al. [6] and Carruthers et al. [7], who show that catch-based methods can misclassify stock status relative to formal assessments.

**Mann-Kendall detects only monotonic trends.** Non-linear stock trajectories — collapse followed by partial recovery, or recovery interrupted by a new decline — may be misclassified. A stock with a U-shaped catch series over 1990–2023 could return τ ≈ 0 and be classified Stable despite having collapsed and partially rebuilt.

**ICES assessments are authoritative.** Where both tracks cover the same species (cod, herring, mackerel, haddock, blue whiting, sprat), the ICES direct assessment supersedes the proxy estimate. The proxy track is applied only where ICES data are unavailable.

**Atlantic cod (FAO 21) caveat.** The proxy method classifies Newfoundland cod as Stable (depletion = 0.55, τ = −0.12, p = 0.31). The non-significant trend and depletion ratio above 0.5 technically meet the Stable criteria, but a depletion ratio of 0.55 represents a stock at roughly half its historical peak catch — far from recovered. This stock should not be interpreted as healthy.

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

---

## Author

Álvaro Peñuelas Sánchez

[github.com/alvaropenuelas](https://github.com/alvaropenuelas)

