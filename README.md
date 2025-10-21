# Offline Microwave Link Simulator (Phase A)

A lightweight, zero-dependency, offline web app for quickly estimating a microwave point-to-point link budget based on distance. Open the index.html file in any modern browser and it just works — no build step, no internet connection required.


## Features

- 100% offline, single-page app — no external network calls or dependencies
- Distance-based link budget calculator (Phase A)
- Real-time calculations as you type and a Compute action for explicit runs
- Clear, responsive UI with dark theme
- Input validation and accessible error summary
- Sensible defaults and unit hints for all inputs
- Results update instantly with two-decimal precision
- Works on desktop and mobile (responsive layout)
- Privacy-friendly: no tracking, analytics, or data collection

### Inputs
- Frequency (GHz)
- Link distance (km)
- Tx power (dBm)
- Tx antenna gain (dBi)
- Rx antenna gain (dBi)
- Tx feeder loss (dB)
- Rx feeder loss (dB)
- Misc losses (dB)
- Rx threshold (dBm)

### Outputs
- FSPL (Free-Space Path Loss) [dB]
- EIRP (Equivalent Isotropically Radiated Power) [dBm]
- Rx power at receiver [dBm]
- Total additional losses [dB] (placeholder in Phase A)
- Fade margin [dB]


## How it works

Formulas used (GHz and km units):
- FSPL = 92.45 + 20·log10(Frequency_GHz) + 20·log10(Distance_km)
- EIRP = Tx power + Tx antenna gain − Tx feeder loss
- Rx power = EIRP + Rx antenna gain − Rx feeder loss − FSPL − Misc losses − Additional losses
- Fade margin = Rx power − Rx threshold

In Phase A, Additional losses are set to 0.00 dB by design. Future phases can introduce rain attenuation, atmospheric absorption, multipath fading, and other impairments.


## Quick start

Option 1 — Open directly (recommended):
1. Download or clone this repository
2. Double-click index.html to open it in your browser

Option 2 — Serve locally (useful during development):
- Python 3: `python3 -m http.server` then visit http://localhost:8000
- Node (serve): `npx serve .` then visit the printed URL


## Example

With the default values:
- Frequency: 18 GHz
- Distance: 10 km
- Tx power: 20 dBm
- Tx antenna gain: 30 dBi
- Rx antenna gain: 30 dBi
- Tx feeder loss: 2 dB
- Rx feeder loss: 2 dB
- Misc losses: 0 dB
- Rx threshold: −75 dBm

You should see results close to:
- FSPL ≈ 137.56 dB
- EIRP ≈ 48.00 dBm
- Rx power ≈ −61.56 dBm
- Fade margin ≈ 13.44 dB


## Project structure

- index.html — Application shell and UI
- assets/css/styles.css — Styling (responsive dark theme)
- assets/js/app.js — Core logic and UI wiring (no dependencies)


## Accessibility

- Error summary uses `aria-live="polite"` for screen readers
- Numeric inputs with proper `inputmode`, `step`, `min`, and placeholders
- Clear error highlighting for invalid fields


## Browser support

Works on all modern evergreen browsers (Chrome, Edge, Firefox, Safari). Internet Explorer is not supported.


## Roadmap ideas (beyond Phase A)

- Additional losses modeling (rain fade, atmospheric gases, multipath)
- Environment-specific models and terrain/Fresnel clearance helpers
- Link availability and reliability estimations
- Throughput, modulation, and SNR calculations
- Save/load scenarios to/from local files (still offline)


## Contributing

Contributions are welcome. Please follow the existing code style:
- Keep it dependency-free (vanilla HTML/CSS/JS)
- Prefer small, readable functions and clear naming
- Maintain accessibility considerations
- Update this README when features are added


## License

No explicit license is provided. If you plan to use this in a commercial or open-source project, please open an issue to discuss licensing.
