## 🐟 About

Ocylin is a comprehensive AI-powered fish hotspot prediction platform that combines satellite data, machine learning, and advanced vessel management to maximize fishing efficiency. The platform integrates real-time environmental data (SST, chlorophyll levels, depth) with intelligent vessel maintenance tracking, trip planning, and market analytics to provide fishermen with a complete operational solution.

## ✨ Features

### 🗺️ Core Platform

- **Interactive Hotspot Map**: Real-time visualization of high-probability fishing zones using Mapbox
- **GPS Navigation System**: Route planning with distance calculation in Nautical Miles
- **AI-Powered Predictions**: Machine learning models using XGBoost for fish hotspot prediction
- **Environmental Data Integration**: Real-time SST, chlorophyll, and depth analysis

### 📊 Analytics & Intelligence

- **Dashboard Analytics**: Overview of active hotspots, species tracking, and market trends
- **Species & Spawning Intelligence**: Detailed information about fish species and spawning patterns
- **Market Trends**: Comprehensive market intelligence with real-time pricing, demand forecasting, and profit optimization
- **Weather Integration**: Current and forecast weather conditions with API integration

### 🚢 Vessel Management

- **Advanced Trip Planner**: Voyage planning with fuel cost estimation and route optimization
- **Maintenance Tracking System**: Rules-based maintenance scheduling with automated calculations
- **Fuel Consumption API**: Detailed fuel cost analysis and consumption tracking
- **Gear Management**: Track and manage fishing equipment inventory

### 🔧 Technical Features

- **RESTful API Backend**: FastAPI-powered backend with comprehensive endpoints
- **MongoDB Integration**: Scalable document-based data storage
- **Real-time Data Processing**: Automated data fetching and processing scripts
- **Comprehensive Testing**: Full API testing suite with integration tests

## 🛠️ Architecture

This platform consists of two main components:

### Frontend (fin-finder-grid)

- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **UI Components**: shadcn/ui with Radix UI
- **Styling**: Tailwind CSS
- **Maps**: Mapbox GL JS via react-map-gl
- **State Management**: React Query (TanStack Query) + Redux Toolkit
- **Routing**: React Router v6
- **Icons**: Lucide React

### Backend (fishspot-backend)

- **API Framework**: FastAPI 0.95+
- **Database**: MongoDB with Motor (async driver)
- **ML Framework**: XGBoost + Scikit-learn for predictions
- **Authentication**: JWT with PassLib
- **Data Processing**: Pandas for oceanographic data analysis
- **API Documentation**: Auto-generated OpenAPI/Swagger docs

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18+ with npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **Python**: 3.8+ for backend services
- **MongoDB**: Local installation or cloud instance
- **API Keys**:
  - Mapbox API token ([mapbox.com](https://www.mapbox.com/))
  - Optional: Google Maps API key

### Full System Setup

#### 1. Backend Setup

```powershell
# Navigate to backend directory
cd Backend/fishspot-backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
copy .env.example .env
# Edit .env with your MongoDB connection and other settings

# Start the FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`

#### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd fin-finder-grid

# Install dependencies
npm install

# Create environment file
echo "VITE_MAPBOX_TOKEN=your_mapbox_token_here" > .env
echo "VITE_API_BASE_URL=http://localhost:8000" >> .env

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
Fish-Full/
├── Backend/
│   └── fishspot-backend/           # FastAPI Backend
│       ├── app/
│       │   ├── api/               # API routes (v1)
│       │   ├── core/              # Core configuration
│       │   ├── db/                # Database models & connection
│       │   ├── ml/                # Machine learning models
│       │   ├── models/            # Data models
│       │   ├── schemas/           # Pydantic schemas
│       │   └── services/          # Business logic
│       ├── data/                  # Oceanographic data
│       ├── scripts/               # Data processing scripts
│       └── requirements.txt       # Python dependencies
│
├── fin-finder-grid/               # React Frontend
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── store/               # Redux store
│   │   ├── hooks/               # Custom React hooks
│   │   └── lib/                 # Utility functions
│   ├── public/                  # Static assets
│   └── package.json             # Node.js dependencies
│
├── Integration Documentation/
│   ├── IMPLEMENTATION_COMPLETE.md    # Maintenance system docs
│   ├── WEATHER_API_INTEGRATION.md   # Weather integration guide
│   ├── TRIP_PLANNER_INTEGRATION.md  # Trip planning docs
│   └── QUICK_START.md               # Quick setup guide
│
└── README.md                     # This file
```

## 🔑 Environment Variables

### Frontend (.env in fin-finder-grid/)

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here (optional)
```

### Backend (.env in Backend/fishspot-backend/)

```env
MONGODB_URL=mongodb://localhost:27017/fishspot
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
COPERNICUS_USERNAME=your_copernicus_username
COPERNICUS_PASSWORD=your_copernicus_password
```

## 📦 Available Scripts

### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Commands

```powershell
# With virtual environment activated
uvicorn app.main:app --reload                    # Start development server
python -m pytest                                # Run tests
python scripts/fetch_and_predict_bbox.py        # Run ML predictions
python test_fuel_api.py                         # Test fuel API
```

## 🎨 Key Features in Detail

### Interactive Hotspot Map

- **Real-time Predictions**: AI-powered fish hotspot identification using satellite data
- **Environmental Overlays**: SST, chlorophyll levels, and depth visualization
- **GPS Navigation**: Current location tracking with nautical mile distance calculation
- **Interactive Markers**: Click for detailed environmental conditions and catch probability

### Advanced Trip Planning

- **Route Optimization**: Calculate optimal fishing routes based on hotspots
- **Fuel Cost Estimation**: Integrated fuel consumption API with real-time calculations
- **Weather Integration**: Current and forecast weather conditions
- **Vessel Performance**: Track engine hours, trips, and operational efficiency

### Maintenance Management System

- **Rules-Based Tracking**: Dynamic maintenance scheduling based on engine hours, trips, and dates
- **Automated Calculations**: Real-time status updates (OK, due soon, overdue)
- **Maintenance Logs**: Complete service history with automatic counter resets
- **Vessel State Tracking**: Monitor engine hours, trip counts, and operational parameters

### Market Intelligence

- **Real-time Pricing**: Current fish market prices and trends across multiple markets
- **Species Analytics**: Track species abundance and spawning patterns with market correlation
- **Economic Optimization**: Maximize catch value based on market conditions and demand forecasting
- **Regional Insights**: Location-specific market data and fishing regulations
- **Profit Analysis**: Advanced analytics for ROI calculation and revenue optimization
- **Market Alerts**: Automated notifications for price changes and market opportunities

### Data Processing & ML

- **Oceanographic Data**: Integration with CMEMS, ERDDAP, and other satellite data sources
- **XGBoost Models**: Advanced machine learning for accurate fish hotspot predictions
- **Automated Scripts**: Background data fetching and processing pipelines
- **Performance Monitoring**: Model accuracy tracking and continuous improvement

## 🚀 API Documentation

The backend provides a comprehensive REST API with the following key endpoints:

- **`/api/v1/maintenance-rules`** - Complete maintenance management system
- **`/api/v1/predictions`** - Fish hotspot predictions and analysis
- **`/api/v1/fuel`** - Fuel consumption calculations and cost estimation
- **`/api/v1/weather`** - Weather data and forecasting
- **`/api/v1/vessels`** - Vessel management and tracking
- **`/api/v1/trips`** - Trip planning and history

View complete API documentation at `http://localhost:8000/docs` when running the backend.

## 📚 Additional Resources

- **[Quick Start Guide](QUICK_START.md)** - Rapid setup and deployment guide
- **[Implementation Details](IMPLEMENTATION_COMPLETE.md)** - Complete feature implementation docs
- **[Weather Integration](WEATHER_API_INTEGRATION.md)** - Weather API integration guide
- **[Trip Planner Integration](TRIP_PLANNER_INTEGRATION.md)** - Advanced trip planning features
- **[Maintenance System Guide](Backend/fishspot-backend/MAINTENANCE_API.md)** - Maintenance tracking documentation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Satellite Data Sources**: CMEMS, ERDDAP, and various oceanographic institutions
- **Map Services**: Mapbox for interactive mapping capabilities
- **UI Framework**: shadcn/ui for beautiful, accessible components
- **ML Framework**: XGBoost team for powerful machine learning capabilities
- **Weather Data**: Various meteorological services and APIs

---

**Built with ❤️ for the global fishing community - Making sustainable fishing more efficient and profitable**
