<div align="center">
<img src="./bluesky_overlap_banner.png" width="100%" alt="Bluesky Overlap Analyzer Banner">

# 🌌 Bluesky Overlap Analyzer

**Advanced OSINT and Social Network Analysis Tool for Bluesky.**

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 📝 Overview

The **Bluesky Overlap Analyzer** is a powerful web-based application designed for deep forensic analysis of social connections on the Bluesky network. It allows researchers, journalists, and OSINT analysts to visualize intersections between follower sets of multiple accounts, identify coordinated behavior, and explore community structures through advanced mathematical diagrams.

## ✨ Features

### 🚀 Advanced Visualizations
Switch between 7 different diagram types to gain unique insights into your data:
- **Venn Diagram**: The classic representation of set overlaps.
- **Euler Diagram**: Optimized layout showing only non-empty relationships for cleaner visuals.
- **Edwards-Venn**: Symmetrical, gear-shaped representation ideal for complex multi-set analysis.
- **UpSet Plot**: Matrix-based visualization for large-scale set intersections (remains readable with 5+ accounts).
- **Mosaic Plot**: Area-proportional rectangles showing the relative size of follower segments.
- **Johnston Diagram**: Logical visualization focused on set-theoretic properties.
- **Karnaugh-Veitch (KV) Diagram**: Tabular matrix representing every logical combination of followers.

### 🔍 Forensic Capabilities
- **Mutual Follower Identification**: Instantly find users who follow *all* target accounts.
- **Network Interactions**: Visualize if target accounts follow each other through an interactive graph.
- **Full Profile Insights**: View avatars, display names, and descriptions of overlapping followers.
- **CSV Export**: Export your findings for further analysis in external tools.

## 🛠️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Gemini API Key](https://aistudio.google.com/) for AI-enhanced features.

### Quick Start
1. **Clone the repository:**
   ```bash
   git clone https://github.com/kolkrabeofdoom/Bluesky-Overlap.git
   cd Bluesky-Overlap
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Usage

1. Enter the Bluesky handles (e.g., `handle.bsky.social`) you want to analyze.
2. Click **"Follower Analysieren"**.
3. Use the **Visualization Selector** to switch between different diagram types.
4. Explore the **"Gemeinsame Follower"** list at the bottom for detailed user data.

## 📜 License

This project is licensed under the **GNU General Public License v3.0**. See the [LICENSE](./LICENSE) file for the full text.

---

<div align="center">
Created with ❤️ by <b>Kolkrabe of Doom</b>
</div>
