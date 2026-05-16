#!/usr/bin/env python3
"""
Fetch ICES SAG time series for all assessment stocks.
Uses StockList to resolve AssessmentKey then SummaryTable to get F/SSB per year.
Outputs one JSON per stock to src/data/timeseries/ices/.
"""
import json, re, sys
import urllib.request
import urllib.parse
import os

BASE = "https://sag.ices.dk/SAG_API/api"
OUT  = os.path.join(os.path.dirname(__file__), "../src/data/timeseries/ices")

# Real reference points from ICES advice PDFs (confirmed in session)
REFERENCE_POINTS = {
    "cod.27.47d20":       {"fmsy": 0.310, "msybtrigger": 107765},
    "her.27.3a47d":       {"fmsy": 0.340, "msybtrigger": 900000},
    "mac.27.nea":         {"fmsy": 0.220, "msybtrigger": 2560000},
    "had.27.46a20":       {"fmsy": 0.350, "msybtrigger": 94000},
    "whb.27.1-91214":     {"fmsy": 0.200, "msybtrigger": 1500000},
    "ple.27.420":         {"fmsy": 0.213, "msybtrigger": 230000},
    "sol.27.4":           {"fmsy": 0.226, "msybtrigger": 35000},
    "pok.27.3a46":        {"fmsy": 0.357, "msybtrigger": 220000},
    "cod.27.1-2":         {"fmsy": 0.40,  "msybtrigger": 460000, "fmsy_range": [0.40, 0.60]},
    "her.27.1-24a514a":   {"fmsy": 0.140, "msybtrigger": 5000000},
    # Sprat: escapement-managed, FMSY not defined — store Fcap as reference
    "spr.27.3a4":         {"fmsy": None, "msybtrigger": None, "fcap": 0.69, "msybesc": 125000},
    # Capelin: SSB-only assessment
    "cap.27.1-2":         {"fmsy": None, "msybtrigger": None},
}

# Stock lookup: stock code → (year to query, AK)
# AKs identified from StockList queries in previous session
STOCK_AK = {
    "cod.27.47d20":       (2022, 17652),   # renamed to cod.27.46a7d20 in 2023
    "her.27.3a47d":       (2023, None),    # resolve from 2023 list
    "mac.27.nea":         (2023, None),
    "had.27.46a20":       (2023, 17902),
    "whb.27.1-91214":     (2023, None),
    "ple.27.420":         (2023, None),
    "sol.27.4":           (2023, None),
    "pok.27.3a46":        (2023, None),
    "cod.27.1-2":         (2021, 16825),
    "her.27.1-24a514a":   (2023, None),
    "spr.27.3a4":         (2023, None),
    "cap.27.1-2":         (2021, 16869),
}

def fetch_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read()
    # ICES API returns JSON with embedded control chars — use strict=False
    return json.loads(raw.decode("utf-8", errors="replace"), strict=False)

def get_ak(stock, year):
    url = f"{BASE}/StockList?year={year}"
    data = fetch_json(url)
    for item in data:
        if item.get("StockKeyLabel") == stock and item.get("Purpose") == "Advice":
            return item.get("AssessmentKey")
    return None

def fetch_summary(ak):
    url = f"{BASE}/SummaryTable?assessmentKey={ak}"
    data = fetch_json(url)
    return data.get("Lines", [])

def extract_series(lines, rp):
    """Convert raw Lines to year-indexed ratios."""
    series = []
    fmsy = rp.get("fmsy")
    msybt = rp.get("msybtrigger")
    for line in lines:
        year = line.get("Year")
        if year is None:
            continue
        f_raw = line.get("F")
        ssb_raw = line.get("SSB")
        # Only include years with at least SSB data
        if ssb_raw is None:
            continue
        row = {"year": int(year), "ssb": ssb_raw}
        if f_raw is not None and fmsy:
            row["f"] = f_raw
            row["f_fmsy"] = round(f_raw / fmsy, 4)
        if msybt:
            row["ssb_msybtrigger"] = round(ssb_raw / msybt, 4)
        series.append(row)
    return series

os.makedirs(OUT, exist_ok=True)

results = {}
for stock, (year, known_ak) in STOCK_AK.items():
    print(f"\nProcessing {stock} (year={year})...")
    rp = REFERENCE_POINTS[stock]

    ak = known_ak
    if ak is None:
        ak = get_ak(stock, year)
        if ak is None:
            print(f"  WARNING: could not find AK for {stock} in {year}")
            continue
    print(f"  AK={ak}")

    lines = fetch_summary(ak)
    print(f"  Got {len(lines)} year records")

    series = extract_series(lines, rp)
    print(f"  Extracted {len(series)} usable rows")

    if series:
        last = series[-1]
        print(f"  Terminal year: {last.get('year')}, f_fmsy={last.get('f_fmsy')}, ssb_mbt={last.get('ssb_msybtrigger')}")
        results[stock] = last.get("f_fmsy"), last.get("ssb_msybtrigger")

    # Save individual file
    out_path = os.path.join(OUT, f"{stock}.json")
    with open(out_path, "w") as fh:
        json.dump({"stock": stock, "referencePoints": rp, "series": series}, fh, indent=2)
    print(f"  Saved → {out_path}")

# Save consolidated reference_points.json
rp_path = os.path.join(OUT, "reference_points.json")
with open(rp_path, "w") as fh:
    json.dump(REFERENCE_POINTS, fh, indent=2)
print(f"\nSaved reference_points.json")

# Print summary table
print("\n" + "="*70)
print(f"{'Stock':<25} {'f_fmsy':>8} {'ssb_mbt':>8} {'Status':>14}")
print("="*70)

# Classify inline
def classify(f, ssb, at='standard'):
    if at == 'escapement': return 'Stable*'
    if at == 'ssb_only':
        if ssb is None: return 'Unknown'
        if ssb < 0.5: return 'Collapsed'
        if ssb < 1.0: return 'Depleted'
        return 'Stable'
    if f is None or ssb is None: return 'Unknown'
    if ssb < 0.5 and f > 1.5: return 'Collapsed'
    if ssb < 0.8 and f > 1.2: return 'Overexploited'
    if ssb < 0.8: return 'Depleted'
    if f > 1.1: return 'Declining'
    if ssb > 1.2 and f < 0.9: return 'Recovering'
    return 'Stable'

special = {"spr.27.3a4": "escapement", "cap.27.1-2": "ssb_only"}
for stock, (f, ssb) in results.items():
    at = special.get(stock, 'standard')
    status = classify(f, ssb, at)
    f_str = f"{f:.3f}" if f else "N/A"
    ssb_str = f"{ssb:.3f}" if ssb else "N/A"
    print(f"{stock:<25} {f_str:>8} {ssb_str:>8} {status:>14}")
print("="*70)
