# 🎓 FLIP

**File List and Information Portal** - A modern desktop application for NOVA FCT students to access CLIP quickly and efficiently.

<div align="center">

![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

*Because accessing CLIP shouldn't require 20 clicks and 5 minutes of your time*

</div>

---

## ✨ Features

### 📚 **Course Materials**
- Browse all your course files by semester/trimester
- One-click download for all materials from a course
- Automatic file organization
- Fast and reliable downloads

### 🗓️ **Weekly Schedule**
- Clean, color-coded weekly schedule view
- Export individual classes to Google Calendar
- Export entire schedule with one click
- Automatic recurring event creation

### 🚀 **Fast & Native**
- Native desktop application built with Rust
- Lightning-fast performance
- Cross-platform (Windows, macOS, Linux)
- Minimal memory footprint

### 🔐 **Secure**
- Direct authentication with CLIP servers
- No data stored externally
- Session management for seamless access

---

## 🛠️ Tech Stack

Built with modern, performant technologies:

- **Frontend**: Vue 3 + TypeScript + Tailwind CSS 4
- **Desktop**: Tauri 2 (Rust-based)
- **Build Tool**: Vite 8
- **Icons**: Lucide Vue
- **Routing**: Vue Router

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/) (latest stable)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/miguelflor/FLIP.git
   cd FLIP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri:dev
   ```

4. **Build for production**
   ```bash
   npm run tauri:build
   ```

   Installers will be created in `src-tauri/target/release/bundle/`

---

## 📁 Project Structure

```
FLIP/
├── vue-app/              # Vue 3 frontend application
│   ├── src/
│   │   ├── components/   # Reusable Vue components
│   │   ├── views/        # Page components (Login, Dashboard)
│   │   ├── lib/          # Utilities and helpers
│   │   └── router/       # Vue Router configuration
│   └── dist/             # Production build output
├── src-tauri/            # Tauri backend (Rust)
│   ├── src/              # Rust source code
│   └── Cargo.toml        # Rust dependencies
└── package.json          # Root scripts and dependencies
```

---

## 💡 Why FLIP?

CLIP is slow and requires too many clicks to access basic information. FLIP solves this by:

- ⚡ **Instant Access** - No more navigating through endless menus
- 🎯 **One-Click Actions** - Download files or export schedules instantly
- 💻 **Native Performance** - Desktop app built with Rust for maximum speed
- 🎨 **Modern UI** - Clean, intuitive interface with smooth animations
- 📱 **Always Available** - Quick access from your desktop

**Time Comparison:**
- **CLIP**: 2-5 minutes to check schedule, 20+ clicks, frequent timeouts
- **FLIP**: 5 seconds, one click, always works ✨

---

## 🎨 Design Philosophy

FLIP follows modern design principles:

- **Native Experience** - True desktop app with Rust backend
- **Minimalism** - Clean, uncluttered interface
- **Performance First** - Lightning-fast with Tauri
- **User-Centric** - Designed with student needs in mind
- **Accessibility** - Proper labels and keyboard navigation

---

## 📝 Available Scripts

```bash
# Development
npm run tauri:dev      # Run Tauri with Vue dev server

# Production
npm run tauri:build    # Build desktop app for your OS

# Vue only (without Tauri)
cd vue-app
npm run dev           # Run Vue dev server (port 1420)
npm run build         # Build Vue app
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⚠️ Important Notes

- **Not affiliated with NOVA FCT** - This is a student-made improvement project
- **Credentials are secure** - Authentication happens directly with CLIP servers
- **No data storage** - All data comes from CLIP in real-time
- **Use responsibly** - Don't overload CLIP servers

---

## 📄 License

This project is private. All rights reserved.

---

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/), [Vue.js](https://vuejs.org/), and [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Made with ❤️ by NOVA FCT students

---

<div align="center">

**FLIP - Because your time is valuable** ⚡

*Stop wasting time on CLIP's slow interface. Start using FLIP.*

</div>
