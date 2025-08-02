# 🎓 FLIP - NOVA FCT Student Dashboard

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

**A lightning-fast wrapper for NOVA FCT's CLIP platform - because your time is valuable**

*Web scraper that eliminates CLIP's 20+ click workflows and gives you instant access to everything*

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage)

</div>

---

## 🎯 What is FLIP?

FLIP is a **lightning-fast web scraper and wrapper** for NOVA FCT's CLIP platform. CLIP is painfully slow and requires 20+ clicks for simple tasks. FLIP solves this by:

- ⚡ **One-click access** to what takes 20+ slow clicks on CLIP
- 🚀 **Instant loading** - no more waiting for CLIP's sluggish pages
- 🔄 **Smart data scraping** that bypasses CLIP's terrible navigation
- 📱 **Actually works on mobile** (CLIP completely fails on phones)

## 🔥 Why FLIP Exists

**Because waiting 5 minutes to download a single PDF or check your schedule in CLIP's maze of endless clicks is not just time-consuming — it's soul-crushing.** 

We built FLIP because in 2025, students shouldn't have to:
- ⏱️ Watch loading spinners for half their study session
- 🖱️ Click through 20+ nested menus for basic information
- 🚫 Deal with "server unavailable" errors every other minute
- 📱 Be completely unable to access academic resources on mobile
- 🔙 Experience a user interface that feels like a time capsule from 1995
FLIP exists because your academic journey should be about learning, not fighting with outdated technology.

## ✨ Features

### 🗓️ **Smart Weekly Schedule**
- **Instant schedule view**: See your entire week in 2 seconds vs 2+ minutes on CLIP
- **One-click Google export**: Export your schedule vs impossible on CLIP
- **No navigation maze**: Direct access vs clicking through 10+ menu levels
- **Mobile-friendly**: Check schedule on your phone vs CLIP's mobile impossibility

### 📅 **Google Calendar Integration**
- **One-click export**: Your entire schedule exported instantly vs CLIP's zero export options
- **Smart scheduling**: Automatic recurring events vs manual calendar entry hell
- **Time-saving**: 5 seconds vs hours of manual calendar work

### 📚 **Course Materials & File Downloads**
- **⚡ Instant access**: All course materials in one place vs CLIP's buried menu system
- **Actually works**: Reliable downloads vs CLIP's 50% failure rate
- **One-click download**: Direct PDF access vs navigating through 6+ slow-loading pages
- **Batch operations**: Download multiple files vs one-by-one clicking torture on CLIP

### 🎨 **Modern UI/UX**
- **Professional Design**: Clean, modern interface with Google-inspired styling
- **Responsive Layout**: Fully responsive design for all devices
- **Smooth Animations**: Elegant transitions and micro-interactions
- **Accessibility**: Built with accessibility best practices

### 🔄 **CLIP Integration & Web Scraping**
- **Seamless Authentication**: Uses your existing CLIP credentials
- **Real-time Data**: Scrapes schedules, files, and course information from CLIP
- **Background Processing**: Handles CLIP's slow responses in the background
- **Error Recovery**: Robust handling of CLIP's frequent timeouts and errors
- **Session Management**: Maintains login state across the application

### 🚀 **What FLIP Does Better Than CLIP**
- **⚡ SPEED**: One click vs 20+ slow CLIP clicks for basic tasks
- **🏃‍♂️ Navigation**: Direct access vs CLIP's maze of nested menus
- **📱 Mobile**: Actually works on phones (CLIP is completely broken on mobile)
- **💾 Downloads**: Reliable file downloads (CLIP fails constantly)
- **⏱️ Time Saving**: Get your schedule in 2 seconds vs 2 minutes on CLIP
- **🔄 No Timeouts**: Background processing vs CLIP's constant "server unavailable" errors
- **📤 Export**: Google Calendar integration vs CLIP's zero export options

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React Framework | 14.x |
| **TypeScript** | Type Safety | 5.x |
| **Tailwind CSS** | Styling | 3.x |
| **Cheerio** | Web Scraping CLIP | Latest |

## 🏫 About NOVA FCT CLIP

[CLIP](https://clip.unl.pt/) is the official academic platform of NOVA School of Science and Technology. The main problems students face daily:

- 🐌 **Painfully slow** - Every page takes 10-30 seconds to load
- 🖱️ **Click hell** - Need 20+ clicks through nested menus for simple tasks
- ⏰ **Constant timeouts** - "Server unavailable" errors happen multiple times per session
- 📱 **Zero mobile support** - Completely unusable on phones (2025!)
- 💾 **Broken downloads** - PDF downloads fail 50% of the time
- 🔍 **Impossible navigation** - Finding anything requires memorizing complex menu paths

**Real example**: To download course materials on CLIP:
1. Login (30s loading) → 2. Navigate to "Academic" (15s) → 3. Click "Courses" (20s) → 4. Find your course (scroll through unorganized list) → 5. Click course (25s loading) → 6. Navigate to "Documents" → 7. Hope the download works

**With FLIP**: Login → Done. Everything is there instantly.

**FLIP eliminates the pain** while keeping full CLIP compatibility.

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

**Stop wasting hours every week fighting with CLIP!**

FLIP is **made by students who were fed up with CLIP's slowness**, for students who value their time.

- ✅ **Save 20+ minutes per session** - No more click marathons
- ✅ **Actually works on mobile** - Check your schedule anywhere
- ✅ **Instant everything** - No more 30-second page loads
- ✅ **Reliable downloads** - Files that actually download
- ✅ **One-click exports** - Google Calendar integration
- ✅ **Zero timeouts** - Background processing handles CLIP's instability

**Time comparison:**
- **CLIP**: 2-5 minutes to check schedule, 20+ clicks, multiple timeouts
- **FLIP**: 5 seconds, one click, always works

**Join thousands of students** who stopped suffering with CLIP's 2005-era slowness! 🚀

---

<div align="center">

**Made with ❤️ by NOVA FCT students tired of waiting for CLIP**

*Because your time is too valuable to waste on 30-second page loads*

[⭐ Star this repo](https://github.com/miguelflor/FLIP) if FLIP saved you hours of CLIP frustration!

</div>
