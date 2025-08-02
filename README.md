# 🎓 FLIP - NOVA FCT Student Dashboard

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

**A modern, elegant wrapper for NOVA FCT's CLIP platform - because students deserve better UX**

*Web scraper and wrapper that transforms the outdated CLIP interface into a beautiful, functional student dashboard*

[Live Demo](#) • [Features](#-features) • [Installation](#-installation) • [Usage](#-usage)

</div>

---

## 🎯 What is FLIP?

FLIP is a **modern web scraper and wrapper** for NOVA FCT's CLIP platform. The original CLIP interface is outdated, slow, and difficult to use. FLIP solves this by:

- 🔄 **Scraping data** from CLIP's backend
- 🎨 **Presenting it** in a beautiful, modern interface  
- ⚡ **Adding features** that CLIP should have had from the beginning
- 📱 **Making it responsive** and accessible on all devices

**Why FLIP exists**: Because NOVA FCT students deserve a platform that doesn't feel like it's from 2005.

## 📱 Preview

<div align="center">
  <img src="https://via.placeholder.com/800x500/f8fafc/334155?text=FLIP+Dashboard+Preview" alt="FLIP Dashboard Preview" />
</div>

## ✨ Features

### 🗓️ **Smart Weekly Schedule**
- **Clean Calendar View**: Beautifully designed weekly schedule (Monday-Friday)
- **Class Type Indicators**: Visual distinction between theoretical, practical, and laboratory classes
- **Today Highlighting**: Current day automatically highlighted with blue accent
- **Room & Time Info**: Complete class information with location and duration

### 📅 **Google Calendar Integration**
- **One-Click Export**: Export individual classes or entire schedule to Google Calendar
- **Recurring Events**: Automatically creates weekly recurring events
- **Smart Scheduling**: Calculates next occurrence dates correctly
- **Batch Export**: Export all classes with staggered timing to avoid overwhelming

### 📚 **File Management**
- **Course Materials**: Download PDFs and course materials by subject
- **Smart Notifications**: Beautiful toast notifications for download status
- **Error Handling**: Robust error handling with user-friendly messages
- **Portuguese Support**: Full support for Portuguese characters and encoding

### 🎨 **Modern UI/UX**
- **Professional Design**: Clean, modern interface with Google-inspired styling
- **Responsive Layout**: Fully responsive design for all devices
- **Smooth Animations**: Elegant transitions and micro-interactions
- **Accessibility**: Built with accessibility best practices

### � **CLIP Integration & Web Scraping**
- **Seamless Authentication**: Uses your existing CLIP credentials
- **Real-time Data**: Scrapes schedules, files, and course information from CLIP
- **Background Processing**: Handles CLIP's slow responses in the background
- **Error Recovery**: Robust handling of CLIP's frequent timeouts and errors
- **Session Management**: Maintains login state across the application

### 🚀 **What FLIP Does Better Than CLIP**
- **Actually Works**: Reliable file downloads (CLIP's often fail)
- **Modern Design**: Clean, intuitive interface vs CLIP's confusing layout
- **Mobile Friendly**: Responsive design (CLIP doesn't work on mobile)
- **Fast Loading**: Optimized performance vs CLIP's slow page loads
- **Better UX**: Logical navigation and clear information hierarchy
- **Export Features**: Google Calendar integration (CLIP has none)

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React Framework | 14.x |
| **TypeScript** | Type Safety | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Lucide React** | Icons | Latest |
| **Cheerio** | Web Scraping CLIP | Latest |

## 🏫 About NOVA FCT CLIP

[CLIP](https://clip.unl.pt/) is the official academic platform of NOVA School of Science and Technology. While functional, it suffers from:

- 🐌 **Slow performance** and frequent timeouts
- 📱 **No mobile support** - completely unusable on phones
- 🎨 **Outdated UI** that feels like early 2000s web design
- ❌ **Broken features** like unreliable file downloads
- 🤷 **Poor UX** with confusing navigation and information architecture

**FLIP fixes all of these issues** while maintaining full compatibility with CLIP's data and authentication.

## 🚀 Installation

### Prerequisites
- Node.js 18.x or higher
- npm, yarn, pnpm, or bun

### Quick Start

```bash
# Clone the repository
git clone https://github.com/miguelflor/FLIP.git
cd FLIP/flip

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Run the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📖 Usage

### 🏠 **Dashboard Access**
1. Navigate to FLIP's login page
2. Enter your **CLIP credentials** (same username/password)
3. FLIP authenticates with CLIP and scrapes your data
4. Access your improved dashboard with all CLIP data

### 📅 **Schedule Management**
- View your weekly schedule in a **clean, readable format** (vs CLIP's messy tables)
- Click the **Google Export** button to export all classes
- Hover over individual classes to export them separately
- Classes are automatically color-coded by type (CLIP doesn't do this)

### 📄 **File Downloads**
- Browse course materials with **actually working downloads** 
- Get notifications when downloads succeed (CLIP gives no feedback)
- Files organized clearly by subject (vs CLIP's confusing structure)
- **Reliable downloads** - no more CLIP timeout errors

### 🔧 **Customization**
The application supports Portuguese localization and could be adapted for other universities with similar outdated platforms.

## ⚠️ **Important Notes**

- **FLIP is not affiliated with NOVA FCT** - it's a student-made improvement project
- **Your CLIP credentials are secure** - authentication happens directly with CLIP's servers
- **All data comes from CLIP** - FLIP doesn't store or modify your academic information
- **Use responsibly** - Don't overload CLIP's servers with excessive requests

## 🏗️ Project Structure

```
flip/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API routes
│   │   ├── dashboard/       # Dashboard pages
│   │   └── layout.tsx       # Root layout
│   ├── components/          # React components
│   │   ├── Chair.tsx        # Course chair component
│   │   ├── Navbar.tsx       # Navigation bar
│   │   ├── Sidebar.tsx      # Sidebar navigation
│   │   ├── ScheduleCard.tsx # Weekly schedule
│   │   └── ...
│   ├── lib/                 # Utility functions
│   │   ├── scrappers/       # Web scraping logic
│   │   └── sessions.ts      # Session management
│   └── utils/               # Helper utilities
├── public/                  # Static assets
└── ...config files
```

## 🎨 Design Philosophy

FLIP follows modern design principles:

- **Minimalism**: Clean, uncluttered interface
- **Consistency**: Unified design language throughout
- **Accessibility**: WCAG compliant design
- **Performance**: Optimized for speed and efficiency
- **User-Centric**: Designed with student needs in mind

## 🌟 Key Components

### ScheduleCard
The heart of the application - displays weekly schedules with:
- Color-coded class types
- Google Calendar export functionality
- Responsive grid layout
- Today highlighting

### Sidebar Navigation
Professional sidebar featuring:
- Course chair listings
- Download functionality
- Modern gradient design
- Lucide React icons

### Notification System
Elegant toast notifications with:
- Smooth fade animations
- Progress indicators
- Success/error states
- Auto-dismissal

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NOVA FCT students** who inspired this project by complaining about CLIP
- Built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- **Special thanks** to everyone who tested FLIP and provided feedback

## 💡 **For NOVA FCT Students**

Tired of CLIP's terrible interface? FLIP is **made by students, for students**. 

- ✅ **Same data** as CLIP, but actually usable
- ✅ **Mobile-friendly** - check your schedule on your phone
- ✅ **Fast and reliable** - no more waiting for pages to load
- ✅ **Modern features** - export to Google Calendar, proper notifications
- ✅ **Actually works** - download files without errors

**Join the revolution** - stop suffering with CLIP's 2005 interface! 🚀

---

<div align="center">

**Made with ❤️ by NOVA FCT students, for NOVA FCT students**

*Because everyone deserves better than CLIP's interface*

[⭐ Star this repo](https://github.com/miguelflor/FLIP) if FLIP saved you from CLIP's suffering!

</div>
