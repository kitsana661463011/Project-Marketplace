# Style Guide & Component Documentation

## 🎨 Design System

### Colors

#### Primary Colors
- **Blue**: `#0052CC` - Primary actions, active states
- **White**: `#FFFFFF` - Backgrounds, cards
- **Gray**: `#F5F5F5` - Secondary backgrounds

#### Status Colors
- **Success**: `#10B981` (Green) - Approved, complete
- **Warning**: `#F59E0B` (Amber) - Pending, caution
- **Error**: `#EF4444` (Red) - Denied, errors
- **Info**: `#3B82F6` (Blue) - Information

#### Category Colors
- **Food**: `#2563EB` (Blue)
- **Beverage**: `#14B8A6` (Teal)
- **Dessert**: `#FFA500` (Orange)
- **Services**: `#9B59B6` (Purple)

### Typography Scale

```typescript
// Headings
Heading 1: 28px | font-bold | line-height 1.2
Heading 2: 24px | font-bold | line-height 1.3
Heading 3: 20px | font-semibold | line-height 1.4
Heading 4: 18px | font-semibold | line-height 1.5

// Body
Body Large: 16px | font-regular | line-height 1.5
Body Medium: 14px | font-regular | line-height 1.5
Body Small: 12px | font-regular | line-height 1.4

// Labels
Label Large: 14px | font-semibold
Label Medium: 12px | font-semibold
Label Small: 11px | font-semibold
```

### Spacing Scale (Base unit: 4px)

```
0 = 0px
1 = 4px
2 = 8px
3 = 12px
4 = 16px
6 = 24px
8 = 32px
12 = 48px
16 = 64px
```

### Border Radius

```
None: 0px
Small: 4px
Medium: 8px
Large: 12px
Full: 9999px
```

### Shadows

```typescript
// Elevation 1 (default card)
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12)

// Elevation 2 (hover state)
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)

// Elevation 3 (elevated)
box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1)
```

## 📦 Component Specifications

### Sidebar

**Dimensions:**
- Width: 256px (64 * 4)
- Fixed position on desktop
- Drawer on mobile

**Spacing:**
- Header padding: 24px
- Menu items: 16px gap between items
- Menu item padding: 12px 16px
- User section: 16px padding

**States:**
- **Inactive**: Gray background, gray text
- **Active**: Blue background (#0052CC), white text, rounded corners (8px)
- **Hover**: Light gray background transition

### Cards

**Standard Card:**
- Border: 1px solid #E5E7EB
- Border Radius: 12px
- Padding: 24px
- Background: White
- Shadow: 0 1px 3px rgba(0, 0, 0, 0.12)

**Card Hover:**
- Shadow: 0 4px 6px rgba(0, 0, 0, 0.1)
- Transition: 300ms ease-in-out

### Buttons

**Primary Button:**
- Background: #0052CC
- Text: White
- Padding: 10px 16px
- Border Radius: 8px
- Font: 14px semibold

**Secondary Button:**
- Background: #F3F4F6
- Text: #1F2937
- Padding: 10px 16px
- Border Radius: 8px

**Outline Button:**
- Border: 2px solid #D1D5DB
- Background: Transparent
- Text: #1F2937
- Padding: 8px 14px

### Input Fields

**Standard Input:**
- Border: 1px solid #D1D5DB
- Border Radius: 8px
- Padding: 10px 12px
- Background: White
- Font: 14px

**Focus State:**
- Border: 2px solid #0052CC
- Shadow: 0 0 0 3px rgba(0, 82, 204, 0.1)

**Disabled State:**
- Background: #F3F4F6
- Color: #9CA3AF
- Cursor: not-allowed

### Progress Bars

**Standard Progress Bar:**
- Height: 10px
- Border Radius: 5px
- Background: #E5E7EB
- Color variants: Blue, Teal, Orange, Purple

### Badges

**Success Badge:**
- Background: #D1FAE5
- Text: #065F46
- Padding: 4px 12px
- Border Radius: 12px
- Font: 12px semibold

**Warning Badge:**
- Background: #FEF3C7
- Text: #92400E
- Padding: 4px 12px
- Border Radius: 12px

**Error Badge:**
- Background: #FEE2E2
- Text: #7F1D1D
- Padding: 4px 12px
- Border Radius: 12px

## ✅ Best Practices

### Component Design
1. **Keep components focused** - One responsibility per component
2. **Use composition** - Combine smaller components for complex UI
3. **Props over hard-coded values** - Make components reusable
4. **TypeScript interfaces** - Define clear prop types
5. **Accessibility** - Always include ARIA labels and semantic HTML

### Responsive Design
1. **Mobile-first** - Start with mobile, enhance for larger screens
2. **Breakpoints** - Use consistent breakpoints (md: 768px, lg: 1024px, xl: 1280px)
3. **Grid systems** - Use Tailwind's grid for layouts
4. **Flexible images** - Use `max-w-full` for images

### Performance
1. **Lazy load images** - Use loading="lazy" for off-screen images
2. **Code splitting** - Use React.lazy for large components
3. **Memoization** - Use React.memo for expensive renders
4. **Event delegation** - Don't attach handlers to many elements

### Code Style
```typescript
// Component naming
export const DashboardLayout: React.FC<Props> = (props) => {
  // Implementation
};

// Import organization
import React from 'react';
import { useState } from 'react';
import ComponentA from './ComponentA';
import { utilFunction } from './utils';
import type { TypeA } from './types';

// JSX formatting
return (
  <div className="...">
    <Component prop="value" />
  </div>
);

// Conditional rendering
{condition && <Component />}
{condition ? <ComponentA /> : <ComponentB />}

// List rendering
{items.map((item) => (
  <Item key={item.id} {...item} />
))}
```

## 🧪 Testing Guidelines

### Unit Tests
```typescript
describe('StatsCard', () => {
  it('renders with correct value', () => {
    const data = { id: '1', title: 'Test', value: 100 };
    render(<StatsCard data={data} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
```

### Component Tests
- Test user interactions
- Test responsive behavior
- Test accessibility features
- Test error states

## 📐 Measurement Reference

### Desktop Layout
```
┌─────────────────────────────────────┐
│ Sidebar (256px) │ Topbar (h: 80px) │
├────────────────┼──────────────────┤
│                │                   │
│  Navigation    │  Main Content    │
│  (white bg)    │  (gray #F5F5F5)  │
│                │                   │
│                │  Max-width: 1280px│
│                │  Padding: 32px    │
│                │                   │
└────────────────┴──────────────────┘
```

### Mobile Layout
```
┌──────────────────────────┐
│ Topbar (h: 64px)         │
├──────────────────────────┤
│                          │
│  Main Content            │
│  (full width)            │
│  Padding: 16px           │
│                          │
└──────────────────────────┘
```

## 🎯 Interaction Patterns

### Hover Effects
- Card: Shadow increase, subtle scale (1.02x)
- Button: Background color shift, cursor change
- Link: Underline appearance, color shift
- Icon: Color shift or subtle rotation

### Click Feedback
- Visual: Background color change
- Tactile: Box shadow adjustment
- Duration: 150-300ms transition

### Loading States
- Show spinner/skeleton
- Disable interactions
- Show loading text

### Empty States
- Show icon
- Show message
- Show action button (if applicable)

### Error States
- Show error icon (red)
- Show error message
- Show retry button

## 📱 Responsive Behavior

### Breakpoints
- **Mobile**: < 640px - Full-width layouts, stacked components
- **Tablet**: 640px - 1023px - 2-column layouts
- **Desktop**: 1024px - 1279px - 3-column layouts
- **Large Desktop**: > 1280px - 4-column layouts, fixed sidebar

### Component Adaptations
- Sidebar: Collapse to drawer on mobile
- Cards: Stack on mobile, grid on desktop
- Tables: Horizontal scroll on mobile
- Navigation: Dropdown menu on mobile

---

**Last Updated**: June 2026
