# Crypto Portfolio Tracker - Frontend

The frontend application for the AI-Powered Crypto Portfolio Tracker - a React-based dashboard to track, analyze, and manage cryptocurrency investments with AI-driven insights.

![Dashboard Preview](https://via.placeholder.com/800x450/3498db/FFFFFF?text=Crypto+Portfolio+Dashboard)

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Key Features](#-key-features)
- [Component Overview](#-component-overview)
- [API Integration](#-api-integration)
- [Environment Variables](#-environment-variables)
- [Development Guidelines](#-development-guidelines)
- [Build and Deployment](#-build-and-deployment)
- [Troubleshooting](#-troubleshooting)

## 🚀 Quick Start

1. **Prerequisites**
   - Node.js >= 16.x
   - npm >= 8.x
   - Backend services running ([see backend README](../backend/README.md))

2. **Installation**
   ```bash
   # Install dependencies
   npm install
   ```

3. **Running Development Server**
   ```bash
   # Start the development server
   npm start
   ```
   This will launch the application on [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
frontend/
├── public/                # Static assets
├── src/
│   ├── api/               # API client and endpoints
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable UI components
│   │   ├── AI/            # AI-related components (chat, insights)
│   │   ├── Layout/        # Layout components
│   │   ├── News/          # News feed components
│   │   ├── Portfolio/     # Portfolio components
│   │   └── common/        # Generic UI components
│   ├── contexts/          # React context providers
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Main application pages
│   ├── services/          # Service integrations
│   ├── utils/             # Utility functions
│   ├── App.js             # Main application component
│   └── index.js           # Application entry point
├── .env                   # Environment variables (local)
├── .env.development       # Development environment variables
└── package.json           # Project dependencies and scripts
```

## 🔧 Technology Stack

- **Framework**: React 18
- **UI Library**: Mantine 7.x
- **Styling**: Emotion (used by Mantine)
- **Routing**: React Router 6
- **Charts**: Chart.js, Recharts
- **HTTP Client**: Axios
- **Date Handling**: date-fns, dayjs
- **Development**: TypeScript (partial integration)

## 🌟 Key Features

- **Portfolio Dashboard**: Visualize holdings, performance, and allocation
- **AI Assistant**: Natural language interaction for portfolio insights
- **Market Data**: Real-time cryptocurrency price and market information
- **News Aggregation**: Crypto and macro economic news feed
- **Risk Assessment**: Portfolio risk analysis and visualization
- **Responsive Design**: Works on desktop and mobile devices

## 🧩 Component Overview

### Layout Components
- `AppLayout.js`: The main layout wrapper with navigation
- `Column.js`: Responsive column component for dashboard layout

### Portfolio Components
- `AssetList.js`: Displays portfolio holdings in a table
- `PortfolioSummary.js`: Portfolio overview with key metrics
- `PerformanceChart.js`: Historical performance visualization

### AI Components
- `ChatInterface.js`: Main AI assistant chat interface
- `QuerySuggestions.js`: Suggested queries for the AI assistant
- `InsightsPanel.js`: AI-generated portfolio insights

### News Components
- `NewsFeed.js`: Combined news feed from various sources
- `CryptoNewsFeed.js`: Cryptocurrency-specific news
- `MacroNewsFeed.js`: Macro economic news feed

## 🔌 API Integration

The frontend connects to the backend API running on `http://localhost:8000`. Key API integrations include:

```javascript
// Example API calls
import client from '../api/client';

// Fetch portfolio data
const getPortfolio = async () => {
  const response = await client.get('/api/v1/portfolio/data');
  return response.data;
};

// Submit AI query
const submitQuery = async (query) => {
  const response = await client.post('/api/v1/ai/query', { query });
  return response.data;
};
```

## 🔐 Environment Variables

Create a `.env.local` file in the frontend directory with these variables:

```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_AI_API_URL=http://localhost:8000
REACT_APP_WEBHOOK_SERVER_URL=http://localhost:8000
```

## 🛠 Development Guidelines

1. **Code Style**
   - Use functional components with hooks
   - Follow the Mantine component API patterns
   - Implement proper error handling for API calls

2. **Component Structure**
   - Create small, focused components
   - Use props for configuration
   - Implement proper PropTypes or TypeScript types

3. **State Management**
   - Use React Context for global state
   - Use local state for component-specific data
   - Implement custom hooks for reusable state logic

4. **Styling**
   - Use Mantine's styling system (sx prop, createStyles)
   - Avoid inline styles
   - Follow the established color scheme and spacing

## 📦 Build and Deployment

### Production Build
```bash
# Create optimized production build
npm run build
```

This creates a `build` folder with production-ready files.

### Deployment
The frontend can be deployed to any static hosting service (Netlify, Vercel, AWS S3, etc.).

Example Netlify deployment:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=build
```

## 🔍 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure backend server is running on port 8000
   - Check environment variables are set correctly
   - Verify network connectivity and CORS settings

2. **Component Rendering Issues**
   - Check browser console for errors
   - Verify props are being passed correctly
   - Check for missing dependencies

3. **Build Failures**
   - Clear node_modules and reinstall dependencies
   - Check for TypeScript errors
   - Verify package.json for conflicting dependencies

## 🤝 Contributing

Please follow these steps for contributions:

1. Create a feature branch from main
2. Implement your feature or fix
3. Test thoroughly
4. Submit a pull request with detailed description

---

For more information about the overall project, check the [main README](../README.md). 