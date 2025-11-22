# FinFinder - Fish Hotspot Prediction Platform

![FinFinder](https://img.shields.io/badge/AI-Powered-blue) ![React](https://img.shields.io/badge/React-18.3-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)

## 🐟 About

FinFinder is an AI-powered fish hotspot prediction platform that uses satellite data and machine learning to identify optimal fishing zones. The platform combines real-time environmental data (SST, chlorophyll levels, depth) with market intelligence to help fishermen maximize their catch efficiency.

## ✨ Features

- **🗺️ Interactive Hotspot Map**: Real-time visualization of high-probability fishing zones using Mapbox
- **📍 Navigation System**: GPS-based route planning with distance calculation in Nautical Miles
- **📊 Dashboard Analytics**: Overview of active hotspots, species tracking, and market trends
- **🐠 Species & Spawning Info**: Detailed information about fish species and spawning patterns
- **⚙️ Gear Management**: Track and manage fishing equipment
- **💹 Market Trends**: Real-time fish market price tracking and analysis
- **🚢 Trip Planner**: Voyage planning with fuel cost estimation and route optimization

## 🛠️ Technologies

This project is built with modern web technologies:

- **Frontend Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS via react-map-gl
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm installed ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Mapbox API token (get one at [mapbox.com](https://www.mapbox.com/))

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd fin-finder-grid

# Install dependencies
npm install

# Create .env file and add your Mapbox token
echo "VITE_MAPBOX_TOKEN=your_mapbox_token_here" > .env

# Start the development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 📁 Project Structure

```
fin-finder-grid/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components (Home, Dashboard, HotspotMap, etc.)
│   ├── services/        # API services and mock data
│   └── main.tsx         # Application entry point
├── public/              # Static assets
└── index.html           # HTML template
```

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here (optional)
```

## 📦 Available Scripts

```sh
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🎨 Features in Detail

### Hotspot Map
- Interactive map showing predicted fishing hotspots
- Click on markers to view detailed environmental conditions
- Real-time navigation with current location tracking
- Distance calculation in Nautical Miles

### Dashboard
- Quick stats on active hotspots and species
- Current monsoon season information
- Market trend indicators
- Quick access to all features

### Trip Planner
- Plan fishing trips with route optimization
- Fuel cost estimation
- Weather and sea condition forecasts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Satellite data from various oceanographic sources
- Map tiles and services by Mapbox
- UI components by shadcn/ui

---

**Built with ❤️ for the fishing community**
