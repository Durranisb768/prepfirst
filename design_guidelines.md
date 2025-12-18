# PrepMaster - Design Guidelines

## Brand Identity
**Name**: PrepMaster  
**Tagline**: "Learn with Durrani"  
**Theme**: Premium Glassmorphism with Indigo/Blue gradients

## Design Philosophy
A premium, modern educational platform featuring glassmorphism aesthetics with soft gradients, creating an immersive and professional learning experience. The design emphasizes clarity, accessibility, and a sense of sophistication.

## Typography

**Font Stack**:
- **Headings**: 'Poppins' (weights: 500, 600, 700, 800) - modern, clean, professional
- **Body**: 'Inter' (weights: 300, 400, 500, 600) - excellent readability for content
- **Urdu Text**: 'Noto Nastaliq Urdu' (weights: 400, 500, 600, 700) - authentic Nastaliq script

**Usage**:
```css
.font-heading { font-family: 'Poppins', sans-serif; }
.font-urdu { font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; }
```

**Scale**:
- Hero headline: text-4xl md:text-5xl lg:text-6xl font-bold font-heading
- Section headers: text-2xl md:text-3xl font-semibold font-heading
- Card titles: text-lg md:text-xl font-semibold font-heading
- Body text: text-base leading-relaxed
- Small text: text-sm text-muted-foreground

## Color System

**Primary Palette** (Indigo/Blue):
- Primary: Indigo-600 (#4F46E5)
- Primary Light: Indigo-400 (#818CF8)
- Primary Dark: Indigo-800 (#3730A3)

**Background Gradients**:
- Light mode: linear-gradient from indigo-100 through indigo-200 to indigo-300
- Dark mode: linear-gradient from slate-900 through indigo-950 to slate-900

**Glassmorphism Panels**:
- Light: rgba(255, 255, 255, 0.7) with blur(10px)
- Dark: rgba(30, 41, 59, 0.7) with blur(10px)
- Border: rgba(255, 255, 255, 0.3) light / rgba(255, 255, 255, 0.1) dark

## Glassmorphism Utilities

**Available CSS Classes**:
- `.glass` - Standard glassmorphism effect
- `.glass-card` - Card with glassmorphism and shadow
- `.glass-header` - Navigation header with stronger blur
- `.gradient-bg` - Main gradient background
- `.gradient-mesh` - Decorative radial gradient overlay

## Layout System

**Spacing**:
- Section padding: py-8 md:py-12 lg:py-16
- Component gaps: gap-4 md:gap-6
- Card padding: p-4 md:p-6
- Container: max-w-7xl mx-auto px-4 md:px-6

**Structure**:
- Full-height gradient background with mesh overlay
- Glassmorphic navigation header (sticky)
- Content area with glass cards
- Responsive grid layouts

## Animations (Framer Motion)

**Standard Transitions**:
```tsx
// Slide up fade in
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}

// Stagger children
transition={{ staggerChildren: 0.1 }}

// Hover scale
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

**Floating Elements**:
- Use `.animate-float` for gentle floating motion
- Use `.animate-float-delayed` for offset timing
- Use `.animate-float-slow` for subtle background elements

## Component Styling

**Glass Cards**:
```tsx
<Card className="glass-card rounded-xl">
```

**Buttons on Glass**:
- Use variant="default" for primary actions (solid color)
- Use variant="outline" with glass background for secondary
- Use variant="ghost" for tertiary actions

**Navigation Header**:
```tsx
<header className="glass-header sticky top-0 z-50">
```

**Tab Lists**:
```tsx
<TabsList className="glass rounded-lg p-1">
```

## Dashboard Layout

**Structure**:
1. Glass header with logo, tagline, user info
2. Tab navigation with 6 tabs
3. Each tab content wrapped in glass cards
4. Gradient mesh background behind all content

**Tabs**:
1. One Paper MCQs with Notes/Theory
2. PMS/CSS/Written Exams
3. Essay Builder
4. News Provider
5. Article Analyzer
6. Vocabulary

## Responsive Breakpoints

- Mobile: < 640px (single column, compact spacing)
- Tablet: 640px - 1024px (2 columns, medium spacing)
- Desktop: > 1024px (multi-column, full spacing)

## Key Principles

1. **Premium Feel**: Glassmorphism creates depth and sophistication
2. **Readability**: High contrast text on translucent backgrounds
3. **Smooth Interactions**: Framer-motion for polished transitions
4. **Bilingual Support**: Proper Urdu typography with RTL support
5. **Consistency**: Uniform spacing, colors, and effects throughout
