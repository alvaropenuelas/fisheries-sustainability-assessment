#!/usr/bin/env Rscript
# FAO Global Capture Production pipeline — proxy stock metrics
# Data source: fishstat R package (Magnusson & Sharma, 2026), which bundles
# FAO Global Capture Production data. No external download required.
# Run from project root: Rscript scripts/fetch_fao.R

# ── Package check ──────────────────────────────────────────────────────────────
pkgs <- c("dplyr", "tidyr", "readr", "Kendall", "fishstat")
missing_pkgs <- pkgs[!sapply(pkgs, requireNamespace, quietly = TRUE)]
if (length(missing_pkgs) > 0) {
  stop(
    "Missing R packages: ", paste(missing_pkgs, collapse = ", "), "\n",
    "Install with:\n",
    "  install.packages(c('", paste(missing_pkgs, collapse = "', '"), "'),\n",
    "                   repos = 'https://cloud.r-project.org')"
  )
}
suppressPackageStartupMessages({
  library(dplyr)
  library(tidyr)
  library(readr)
  library(Kendall)
  library(fishstat)
})

if (!file.exists("scripts/fao_species_mapping.csv")) {
  stop("Run from project root: Rscript scripts/fetch_fao.R")
}

# ── Config ─────────────────────────────────────────────────────────────────────
RAW_DIR      <- "data/raw"
PROC_DIR     <- "data/processed"
MAPPING_CSV  <- "scripts/fao_species_mapping.csv"
FILTERED_CSV <- file.path(RAW_DIR, "fao_capture.csv")
OUTPUT_CSV   <- file.path(PROC_DIR, "fao_proxy_metrics.csv")
SMOOTH_WIN   <- 3L   # trailing moving-average window (years)
RECENT_WIN   <- 3L   # window for depletion numerator (years)
TREND_START  <- 1990L
TREND_END    <- 2023L
MIN_YEARS    <- 20L  # minimum data years before marking Data-limited

dir.create(RAW_DIR,  showWarnings = FALSE, recursive = TRUE)
dir.create(PROC_DIR, showWarnings = FALSE, recursive = TRUE)

# ── Load fishstat data ─────────────────────────────────────────────────────────
pkg_ver  <- packageDescription("fishstat")$Version
data_end <- max(capture$year)
message("fishstat v", pkg_ver, " | data years: ", min(capture$year), "–", data_end)
message("capture rows: ", nrow(capture))

# ── Load species mapping ───────────────────────────────────────────────────────
mapping <- read_csv(MAPPING_CSV, show_col_types = FALSE) %>%
  mutate(
    fao_area     = as.character(fao_area),
    fao_area_int = as.integer(fao_area),
    data_limited = as.logical(data_limited)
  )

stocks_expected <- mapping %>%
  select(display_name, fao_area) %>%
  distinct()

message("Expecting ", nrow(stocks_expected), " stocks from ",
        nrow(mapping), " ASFIS code rows")

# ── Filter to target species × area pairs ─────────────────────────────────────
# capture$area is integer; capture$species is ASFIS 3-alpha code
target <- mapping %>%
  select(asfis_code, fao_area_int, display_name)

filtered <- capture %>%
  filter(measure == "Q_tlw") %>%              # tonnes live weight only
  inner_join(target,
             by = c("species" = "asfis_code", "area" = "fao_area_int")) %>%
  rename(asfis_code = species)

write_csv(filtered, FILTERED_CSV)
message("Filtered subset → ", FILTERED_CSV,
        " (", nrow(filtered), " rows across ",
        n_distinct(filtered$asfis_code), " ASFIS codes)")

# ── Diagnostic: missing stocks ─────────────────────────────────────────────────
found <- filtered %>%
  mutate(fao_area = as.character(area)) %>%
  select(display_name, fao_area) %>%
  distinct()

missing <- anti_join(stocks_expected, found, by = c("display_name", "fao_area"))

if (nrow(missing) > 0) {
  for (i in seq_len(nrow(missing))) {
    sp  <- missing$display_name[i]
    ar  <- missing$fao_area[i]
    cds <- mapping %>% filter(display_name == sp, fao_area == ar) %>% pull(asfis_code)
    message("\nWARNING: no data for '", sp, "' (area ", ar,
            ", code(s): ", paste(cds, collapse = "+"), ")")
    if ("CAA" %in% cds) {
      stop(
        "Atlantic wolffish (CAA) returned zero rows from fishstat FAO ", ar, ".\n",
        "The ASFIS code may have changed — verify against the fishstat species table:\n",
        "  library(fishstat); species[grep('wolffish|catfish|Anarhichas', species$species_name, ignore.case=TRUE),]"
      )
    }
  }
  message("Stocks above will be marked Data-limited in output.\n")
}

# ── Helper: trailing n-year moving average ─────────────────────────────────────
ma <- function(x, w) {
  out <- rep(NA_real_, length(x))
  for (i in w:length(x)) out[i] <- mean(x[(i - w + 1L):i], na.rm = TRUE)
  out
}

# ── Compute metrics per stock ──────────────────────────────────────────────────
message("\nComputing metrics...")
results <- vector("list", nrow(stocks_expected))

for (i in seq_len(nrow(stocks_expected))) {
  sp_name <- stocks_expected$display_name[i]
  area_s  <- stocks_expected$fao_area[i]       # character "27" or "21"
  codes   <- mapping %>%
    filter(display_name == sp_name, fao_area == area_s) %>%
    pull(asfis_code)

  # Aggregate annual catch across all ASFIS codes and all reporting countries
  ts_data <- filtered %>%
    filter(display_name == sp_name, as.character(area) == area_s) %>%
    group_by(year) %>%
    summarise(catch = sum(value, na.rm = TRUE), .groups = "drop") %>%
    arrange(year)

  n_years      <- nrow(ts_data)
  is_dl_map    <- any(mapping$data_limited[mapping$display_name == sp_name &
                                            mapping$fao_area == area_s], na.rm = TRUE)
  flag         <- if (is_dl_map || n_years < MIN_YEARS) "Data-limited" else ""

  if (n_years == 0) {
    results[[i]] <- tibble(
      species_name = sp_name, species_code = paste(codes, collapse = "+"),
      fao_area = paste0("FAO ", area_s),
      year_start = NA_integer_, year_end = NA_integer_,
      smoothing_window = SMOOTH_WIN, recent_window = RECENT_WIN,
      cmax = NA_real_, depletion = NA_real_,
      tau = NA_real_, p = NA_real_,
      n_years = 0L, flag = "Data-limited"
    )
    next
  }

  # Smoothed series (trailing SMOOTH_WIN-year MA over full series)
  ts_data  <- ts_data %>% mutate(smooth = ma(catch, SMOOTH_WIN))
  cmax     <- max(ts_data$smooth, na.rm = TRUE)
  recent   <- tail(ts_data$smooth[!is.na(ts_data$smooth)], RECENT_WIN)
  depletion <- mean(recent, na.rm = TRUE) / cmax

  # Mann-Kendall on smoothed series restricted to TREND_START–TREND_END
  trend_data <- ts_data %>%
    filter(year >= TREND_START, year <= TREND_END, !is.na(smooth))

  mk_tau <- NA_real_
  mk_p   <- NA_real_
  if (nrow(trend_data) >= 4) {
    mk     <- Kendall::MannKendall(trend_data$smooth)
    mk_tau <- as.numeric(mk$tau)
    mk_p   <- as.numeric(mk$sl)
  }

  results[[i]] <- tibble(
    species_name     = sp_name,
    species_code     = paste(codes, collapse = "+"),
    fao_area         = paste0("FAO ", area_s),
    year_start       = min(ts_data$year),
    year_end         = max(ts_data$year),
    smoothing_window = SMOOTH_WIN,
    recent_window    = RECENT_WIN,
    cmax             = round(cmax),
    depletion        = round(depletion, 3),
    tau              = round(mk_tau, 3),
    p                = round(mk_p, 4),
    n_years          = n_years,
    flag             = flag
  )
}

metrics <- bind_rows(results)
write_csv(metrics, OUTPUT_CSV)
message("Metrics saved → ", OUTPUT_CSV, "\n")

# ── OLD vs NEW comparison table ────────────────────────────────────────────────
old <- tribble(
  ~species_name,              ~fao_area, ~old_dep, ~old_tau, ~old_p,
  "Atlantic horse mackerel",  "FAO 27",   0.04, -0.79, 0.0001,
  "Atlantic redfishes",       "FAO 27",   0.10, -0.83, 0.0001,
  "Sandeels",                 "FAO 27",   0.08, -0.58, 0.0020,
  "European sprat",           "FAO 27",   0.47, -0.28, 0.0430,
  "Atlantic herring",         "FAO 27",   0.52, -0.28, 0.0510,
  "Atlantic cod",             "FAO 21",   0.55, -0.12, 0.3100,
  "Atlantic mackerel",        "FAO 27",   0.65,  0.45, 0.0008,
  "Blue whiting",             "FAO 27",   0.76,  0.28, 0.0380,
  "Haddock",                  "FAO 27",   0.71,  0.31, 0.0280,
  "American plaice",          "FAO 21",   0.08, -0.71, 0.0001,
  "Yellowtail flounder",      "FAO 21",   0.13, -0.62, 0.0004,
  "Atlantic wolffish",        "FAO 27",   0.27, -0.44, 0.0090
)

cmp <- metrics %>%
  select(species_name, fao_area, new_dep = depletion, new_tau = tau) %>%
  inner_join(old, by = c("species_name", "fao_area")) %>%
  mutate(
    d_dep = round(new_dep - old_dep, 3),
    d_tau = round(new_tau - old_tau, 3)
  )

cat(strrep("=", 84), "\n")
cat(sprintf("  %-26s  %7s %7s %7s | %7s %7s %7s\n",
    "Stock", "OLD_D", "NEW_D", "ΔD", "OLD_τ", "NEW_τ", "Δτ"))
cat(strrep("-", 84), "\n")
for (j in seq_len(nrow(cmp))) {
  r <- cmp[j, ]
  cat(sprintf("  %-26s  %7.3f %7.3f %7.3f | %7.3f %7.3f %7.3f\n",
      trimws(r$species_name), r$old_dep, r$new_dep, r$d_dep,
      r$old_tau, r$new_tau, r$d_tau))
}
cat(strrep("=", 84), "\n\n")
message("Done. Run: npm run generate-proxy")
