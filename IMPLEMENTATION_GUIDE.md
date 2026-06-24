# Admin Marketplace Dashboard - Implementation Guide

## 📋 Project Overview

This is a production-ready **Admin Dashboard** for the Market Place platform, built with React 18, TypeScript, Vite, and Tailwind CSS. The implementation is pixel-perfect based on the Figma design and optimized for enterprise use.

## 🏗️ Project Structure

```
src/
├── assets/                 # Static assets (images, icons)
├── components/
│   ├── layout/            # Layout components
│   │   ├── Sidebar.tsx    # Main navigation sidebar with responsive mobile menu
│   │   ├── Topbar.tsx     # Header with search and notifications
│   │   ├── DashboardLayout.tsx  # Main layout wrapper
│   │   └── index.ts       # Barrel export
│   │
│   ├── dashboard/         # Dashboard-specific components
│   │   ├── StatsCard.tsx  # KPI statistics cards
│   │   ├── BusinessOverview.tsx  # Category distribution with progress bars
│   │   ├── RecentReviews.tsx     # Latest review/verification list
│   │   ├── MarketMap.tsx  # Market zones grid visualization
│   │   └── index.ts       # Barrel export
│   │
│   └── index.ts           # Barrel export for all components
│
├── pages/
│   ├── Dashboard.tsx      # Main dashboard page
│   └── index.ts           # Barrel export
│
├── hooks/
│   ├── useDashboard.ts    # Custom hooks for dashboard logic
│   └── index.ts
│
├── utils/
│   ├── helpers.ts         # Utility functions
│   └── index.ts
│
├── services/              # API services (for future backend integration)
├── types/
│   └── index.ts           # TypeScript type definitions
│
├── data/
│   ├── mockData.ts        # Mock data for development
│   └── index.ts
│
├── App.tsx                # Root component
├── main.tsx               # Application entry point
├── index.css              # Global styles with Tailwind
└── vite-env.d.ts          # Vite environment types
```

## 🎨 Design Implementation

### Color Palette
- **Primary Blue**: `#0052CC` - Used for active navigation items and primary actions
- **Secondary Teal**: `#00B4A6` - Used for success states and beverage category
- **Accent Orange**: `#FFA500` - Used for warning states and dessert category
- **Accent Purple**: `#9B59B6` - Used for services category
- **Status Red**: `#E74C3C` - Used for errors and unavailable zones
- **Status Pink**: `#E89BB5` - Used for notifications
- **Neutral Gray**: `#F5F5F5` (backgrounds), `#333333` (text)

### Typography
- **Font Family**: Inter or system sans-serif (optimized via Tailwind CSS)
- **Headings**: Bold, dark text (24-28px for titles)
- **Body Text**: Regular weight, gray text (14px)
- **Thai Language**: Full support via UTF-8 encoding

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1279px
- **Desktop**: ≥ 1280px

## 🧩 Component Reference

### Layout Components

#### Sidebar
- Fixed left panel with white background
- Logo section with "Market Place Admin"
- Navigation items with icons (7 menu items)
- Active state styling (blue background, white text, rounded)
- User profile section at bottom
- Responsive mobile drawer navigation
- Settings and logout buttons

**Key Props:**
```typescript
interface SidebarProps {
  navItems: NavItem[];
  activeItemId: string;
  onNavigate: (itemId: string) => void;
  userAvatar?: string;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}
```

#### Topbar
- Sticky header with page title
- Search input with icon
- Notifications bell with badge count
- User profile quick access
- Height: 72px (80px on desktop with padding)

**Key Props:**
```typescript
interface TopbarProps {
  title: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onSearch?: (query: string) => void;
}
```

#### DashboardLayout
- Combines Sidebar + Topbar
- Main content area with proper padding and max-width
- Responsive grid layout
- Background color: `#F5F5F5`

### Dashboard Components

#### StatsCard
- 4-column grid layout (responsive)
- Icon + Title + Large Value Display
- Optional unit (e.g., "/100")
- Optional trend indicator (up/down/neutral)
- Optional badge with color
- Hover effect with shadow transition
- Color variants: blue, green, orange, pink, purple

**Data Structure:**
```typescript
interface StatsCardData {
  id: string;
  title: string;
  value: string | number;
  unit?: string;
  icon?: 'star' | 'check' | 'alert' | 'bell';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  badge?: {
    label: string;
    color: 'success' | 'warning' | 'error' | 'info';
  };
  color?: 'blue' | 'green' | 'orange' | 'pink' | 'purple';
}
```

#### BusinessOverview
- Displays category distribution with progress bars
- 4 categories with icons and percentages
- Shows count and percentage for each category
- Color-coded bars
- Footer summary grid
- Subtotal of items

**Sample Data:**
- อาหาร (Food) - 45% - Blue
- เครื่องดื่ม (Beverage) - 25% - Teal
- ขนม (Dessert) - 20% - Orange
- บริการและอื่นๆ (Services) - 10% - Purple

#### RecentReviews
- Shows latest verification/review items
- User avatars with store information
- Status badges (success, warning, error, info)
- Relative time display
- Optional "View All" button
- Truncated store names
- Empty state handling

#### MarketMap
- 5-column grid of market zones
- Zone codes (A1, A2, B1, etc.)
- Color-coded status badges:
  - Green: Available (ว่าง)
  - Red: Occupied (ครอบครัว)
  - Yellow: Pending (รอการอนุมัติ)
- Hover tooltips with zone details
- Legend showing counts
- Click handler for zone selection
- Summary statistics at bottom

## 📊 Mock Data

The dashboard uses comprehensive mock data located in `src/data/mockData.ts`:

### User Data
```typescript
mockUser: {
  id: '1',
  name: 'Admin User',
  email: 'admin@marketplace.com',
  role: 'Administrator',
  avatar: '...'
}
```

### Navigation Items
7 sidebar menu items with Thai labels, icons, and optional badges

### Dashboard Metrics
- KPI stats (rating, ready count, pending count, notifications)
- 4 category breakdowns with distribution
- 3 recent reviews with timestamps
- 8 market zones with status

## 🔧 Technologies Used

- **React 18**: UI framework with hooks
- **TypeScript**: Static typing
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library with 400+ icons
- **ESLint**: Code quality

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- pnpm (recommended) or npm

### Installation

```bash
cd frontend
pnpm install
```

### Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
pnpm build
```

Outputs to `dist/` directory

### Preview Production Build

```bash
pnpm preview
```

## 🔌 Integration Points

### API Integration
To connect to your backend API:

1. Create API services in `src/services/`
2. Update `src/hooks/useDashboard.ts` to fetch from your endpoints
3. Replace mock data with real data

**Example:**
```typescript
// src/services/api.ts
export const fetchDashboardMetrics = async () => {
  const response = await fetch('/api/dashboard/metrics');
  return response.json();
};
```

### Authentication
To add authentication:

1. Create auth context in `src/contexts/`
2. Implement login/logout logic
3. Protect routes and components based on user role
4. Store auth token (JWT) in localStorage or secure cookie

### State Management
For complex state management, consider:
- React Context API (simple apps)
- Redux Toolkit (complex apps)
- Zustand (lightweight alternative)

## 📱 Responsive Design

The dashboard is fully responsive:
- **Mobile (< 768px)**: Collapsible sidebar drawer, stacked layout
- **Tablet (768px - 1279px)**: 2-column grids, responsive cards
- **Desktop (≥ 1280px)**: Full layout with fixed sidebar, multi-column grids

## ♿ Accessibility Features

- Semantic HTML (nav, main, section, article)
- ARIA labels for icons and buttons
- Focus states and keyboard navigation
- Color contrast ratios (WCAG AA compliant)
- Screen reader support
- Form inputs with proper labels

## 📈 Performance Optimization

- Code splitting with React lazy loading (optional)
- Image optimization with Next.js Image component (future)
- CSS minification via Tailwind CSS
- TypeScript compilation for type safety
- Vite's fast hot module replacement (HMR)

## 🎯 Component Usage Examples

### Using the Dashboard Page
```typescript
import { Dashboard } from './pages';

function App() {
  return <Dashboard />;
}
```

### Creating Custom Cards
```typescript
import { StatsCard } from './components/dashboard';

const myCard = {
  id: 'revenue',
  title: 'Revenue',
  value: '125,000',
  unit: 'THB',
  icon: 'star',
  color: 'blue',
  badge: {
    label: 'Good',
    color: 'success'
  }
};

<StatsCard data={myCard} />
```

### Using Custom Hooks
```typescript
import { useDashboardMetrics, useSearch } from './hooks';

function MyComponent() {
  const { metrics, loading } = useDashboardMetrics();
  const { searchQuery, search } = useSearch();

  return (
    <div>
      {loading.isLoading ? <Spinner /> : <Dashboard metrics={metrics} />}
    </div>
  );
}
```

## 🐛 Troubleshooting

### Tailwind CSS Not Working
- Ensure `index.css` includes `@tailwind` directives
- Check `tailwind.config.js` has correct `content` paths
- Run `pnpm install` to ensure dependencies are installed

### Icons Not Showing
- Verify `lucide-react` is installed
- Check icon names match Lucide's naming convention
- Import icons from 'lucide-react'

### Type Errors
- Run `tsc --noEmit` to check for TypeScript errors
- Ensure all imports have proper types
- Check `tsconfig.json` is properly configured

## 📝 Future Enhancements

- [ ] Add dark mode support
- [ ] Implement real-time notifications
- [ ] Add data export functionality (CSV, PDF)
- [ ] Create additional admin pages (Users, Settings, etc.)
- [ ] Add interactive charts (Chart.js or Recharts)
- [ ] Implement advanced filtering and sorting
- [ ] Add multi-language support (i18n)
- [ ] Implement role-based access control (RBAC)

## 📄 License

This project is part of the Market Place admin dashboard. All rights reserved.

## 👥 Support

For questions or issues, please contact the development team.

---

**Last Updated**: June 2026
**Version**: 1.0.0
