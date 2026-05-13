# Changelog

All notable changes to this project will be documented in this file.

## [1.3.1] - 2026-05-13

### Added
- **Native "Save As" Dialog**: CSV exports now trigger a native file picker dialog in supported browsers, allowing users to choose the destination folder and filename.

## [1.3.0] - 2026-05-13

### Added
- **Power-Follower Identification**: Instantly find the top 10 influencers in the overlap, sorted by their follower count.
- **Bot-Wave Forensic Analysis**: Enhanced temporal analysis with stacked bars (Normal vs. Suspicious) to spot coordinated bot registration waves.
- **Integrated Help System**: A comprehensive in-app documentation modal explaining all visualization modes and forensic features.
- **Influencer Reach Enrichment**: Automated batch fetching of follower counts and creation dates for mutual followers.

### Changed
- Refined dashboard layout for better readability of the "Match List" and "WordCloud".
- Improved "Suspicious Account" heuristics (Age < 72h + No Avatar + Short/No Bio).
- Updated README with new forensic features and Power-Follower tracking.

### Fixed
- Fixed a bug where the application would crash if certain Lucide icons were missing from imports.
- Corrected alignment issues in the navigation bar.

---

## [1.2.0] - 2026-05-13
- Initial release of the "Forensics Edition" with Bio-Mining and Temporal Analysis.
- Added Venn, Euler, Edwards-Venn, UpSet, Mosaic, Johnston, and KV diagrams.
- Added Network Graph for interactions.
