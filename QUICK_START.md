# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
cd frontend
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
pnpm build
```

## 📁 Key Files to Modify

### Mock Data
**File**: `src/data/mockData.ts`

Update the mock data with your actual data:
```typescript
export const mockDashboardMetrics: DashboardMetrics = {
  totalRating: 85,
  readyCount: 15,
  // ... update with your data
};
```

### Navigation Items
**File**: `src/data/mockData.ts`

Add or modify navigation menu items:
```typescript
export const mockNavItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/dashboard',
  },
  // ... add more items
];
```

### API Integration
**File**: `src/hooks/useDashboard.ts`

Replace mock data with API calls:
```typescript
export const useDashboardMetrics = () => {
  const fetchMetrics = useCallback(async () => {
    setLoading({ isLoading: true, error: null });
    try {
      // Replace this with your API call
      const response = await fetch('/api/dashboard/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      // error handling
    }
  }, []);
  
  // ...
};
```

### Styling
**File**: `src/index.css`

Global styles are here. Tailwind CSS is already configured.

## 🎨 Customization

### Change Colors
**File**: `tailwind.config.js`

Modify the color theme in the `theme.colors` section.

### Change Sidebar Width
**File**: `src/components/layout/Sidebar.tsx` and `src/components/layout/Topbar.tsx`

- Sidebar: `w-64` (256px) - change to desired width
- Topbar: `lg:left-64` - update to match sidebar width

### Change Brand Logo
**File**: `src/components/layout/Sidebar.tsx`

Replace the ShoppingBag icon with your logo or update the text.

### Add New Pages
1. Create new component in `src/pages/`
2. Add route handler in `src/App.tsx` (or use React Router for multiple pages)
3. Add navigation item in `src/data/mockData.ts`

## 🔗 Integration Steps

### Step 1: Connect to Backend API
```typescript
// src/services/api.ts
export const api = {
  fetchDashboard: () => fetch('/api/dashboard').then(r => r.json()),
  fetchMetrics: () => fetch('/api/metrics').then(r => r.json()),
  // ... add more endpoints
};
```

### Step 2: Update Hooks
```typescript
// src/hooks/useDashboard.ts
const fetchMetrics = useCallback(async () => {
  setLoading({ isLoading: true, error: null });
  try {
    const data = await api.fetchMetrics();
    setMetrics(data);
  } catch (error) {
    setLoading({ isLoading: false, error: error.message });
  }
}, []);
```

### Step 3: Handle Loading States
```typescript
// In your component
if (loading.isLoading) return <LoadingSpinner />;
if (loading.error) return <ErrorMessage error={loading.error} />;
return <Dashboard metrics={metrics} />;
```

## 🧩 Adding New Components

### 1. Create Component File
```typescript
// src/components/dashboard/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  data: any[];
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  data,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {/* Component JSX */}
    </div>
  );
};
```

### 2. Export from Index
```typescript
// src/components/dashboard/index.ts
export { MyComponent } from './MyComponent';
```

### 3. Use in Page
```typescript
// src/pages/Dashboard.tsx
import { MyComponent } from '../components/dashboard';

export const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <MyComponent title="My Data" data={myData} />
    </DashboardLayout>
  );
};
```

## 🐛 Common Issues

### Issue: Styles not applying
**Solution**: Clear cache and rebuild
```bash
rm -rf dist node_modules .vite
pnpm install
pnpm dev
```

### Issue: TypeScript errors
**Solution**: Check type definitions
```bash
tsc --noEmit
```

### Issue: Icons not showing
**Solution**: Check Lucide React import
```typescript
import { ShoppingBag } from 'lucide-react';
```

### Issue: Dark mode not working
**Solution**: Add `dark` class to `html` element
```typescript
document.documentElement.classList.add('dark');
```

## 📦 Project Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | TypeScript type checking |

## 🎯 Next Steps

1. **Replace mock data** with real API calls
2. **Add authentication** flow
3. **Implement routing** for multiple pages
4. **Add error handling** and loading states
5. **Set up CI/CD** pipeline
6. **Add unit tests** with Jest/Vitest
7. **Deploy** to production

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Lucide React Icons](https://lucide.dev)
- [Vite Documentation](https://vitejs.dev)

## 💡 Tips & Tricks

### Inspect Component Props
```typescript
console.log('Component Props:', { ...props });
```

### Debug CSS Issues
Use Tailwind's built-in debugger:
```bash
pnpm exec tailwindcss -i input.css -o output.css --watch
```

### Performance Monitoring
Use React DevTools Profiler to identify slow components

### TypeScript Strict Mode
Enable in `tsconfig.json` for better type safety:
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

---

**Need Help?** Check the [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed documentation.
