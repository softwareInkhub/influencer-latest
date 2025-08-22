# InfluenceHub - Influencer Marketing Management Platform

A comprehensive, mobile-first influencer management platform built with modern web technologies. InfluenceHub enables companies to manage influencers, track orders, handle content creation workflows, and communicate through integrated messaging templates with a sleek, minimal UI optimized for mobile devices.

![InfluenceHub Dashboard](./attached_assets/image_1755332339433.png)

## 🌟 Features

### 📱 Mobile-First Design
- Ultra-compact, sleek interface optimized for mobile devices
- Tab-based navigation for seamless user experience
- Minimal spacing and condensed layouts for maximum screen utilization
- Responsive design that works perfectly on all screen sizes

### 🎯 Core Functionality
- **Influencer Management**: Comprehensive influencer profiles with social media integration
- **Order Tracking**: End-to-end order management with status tracking
- **Content Workflows**: Content creation and approval processes
- **Dashboard Analytics**: Real-time insights and performance metrics
- **Team Management**: Role-based access control and team collaboration
- **Message Templates**: Automated communication workflows
- **Integration Support**: Seamless integration with external platforms

### 🔧 Tab-Based Interface
1. **Dashboard**: Analytics overview and quick stats
2. **Influencers**: Manage influencer profiles and relationships
3. **Orders**: Track and manage order fulfillment
4. **Content**: Content creation and approval workflows
5. **Messages**: Communication templates and messaging
6. **Settings**: Company profile, integrations, and team management

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API**: RESTful architecture with dedicated route handlers
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Hot module replacement via Vite integration

### Development Tools
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations
- **Validation**: Zod for runtime type checking
- **Icons**: Lucide React icon library
- **Database**: Neon serverless PostgreSQL

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd influencehub
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file in the root directory:
```env
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=development
SESSION_SECRET=your_session_secret_key
```

4. **Database Setup**
```bash
# Generate and push database schema
npm run db:push

# Optional: Generate database migrations
npm run db:generate
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
influencehub/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # Shadcn/ui base components
│   │   │   ├── dashboard-tab.tsx
│   │   │   ├── influencers-tab.tsx
│   │   │   ├── orders-tab.tsx
│   │   │   ├── content-tab.tsx
│   │   │   ├── messages-tab.tsx
│   │   │   └── settings-tab.tsx
│   │   ├── contexts/        # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions and configs
│   │   ├── pages/           # Route components
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Application entry point
│   └── index.html           # HTML template
├── server/                   # Backend Express application
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API route definitions
│   ├── storage.ts           # Database operations
│   └── vite.ts              # Vite development server integration
├── shared/                   # Shared type definitions
│   └── schema.ts            # Database schema and types
├── components.json          # Shadcn/ui configuration
├── drizzle.config.ts        # Database ORM configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── vite.config.ts           # Vite bundler configuration
└── package.json             # Project dependencies and scripts
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue tones for actions and highlights
- **Secondary**: Green for success states and positive indicators
- **Neutral**: Gray scale for text and backgrounds
- **Accent**: Red for warnings and destructive actions

### Typography
- **Headings**: Various sizes (text-lg, text-sm) with semibold weight
- **Body**: Small text (text-xs, text-sm) for compact mobile layouts
- **Labels**: Extra small (text-xs) with medium weight for form fields

### Spacing System
- **Ultra-compact**: Minimal padding (p-1, p-1.5, p-2) for maximum density
- **Consistent gaps**: Small spaces (space-y-1, space-y-2) between elements
- **Tight margins**: Reduced margins (mb-1, mb-2) for mobile optimization

### Component Variants
- **Buttons**: Multiple sizes (h-5, h-6, h-7) with compact padding
- **Cards**: Minimal borders and padding for clean appearance
- **Form inputs**: Reduced height (h-8) with small text
- **Icons**: Small sizes (w-3 h-3, w-4 h-4) for compact layouts

## 📊 Data Models

### Core Entities
```typescript
// Company - Root organization entity
Company {
  id: string
  name: string
  phone: string
  email: string
  address?: string
}

// User - Team members with role-based access
User {
  id: string
  name: string
  email: string
  role: string
  companyId: string
  teamId?: string
}

// Influencer - Content creators and social media profiles
Influencer {
  id: string
  name: string
  email: string
  phone?: string
  socialMedia: SocialMediaProfile[]
  status: 'active' | 'inactive' | 'pending'
  followers: number
  engagementRate: number
}

// Order - Product fulfillment workflows
Order {
  id: string
  influencerId: string
  products: OrderItem[]
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered'
  total: number
  shippingAddress: Address
  createdAt: Date
}

// Content - Media content with approval workflows
Content {
  id: string
  influencerId: string
  orderId?: string
  type: 'image' | 'video' | 'text'
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  url?: string
  description: string
}
```

## 🔌 API Endpoints

### Influencer Management
```
GET    /api/influencers          # List all influencers
POST   /api/influencers          # Create new influencer
GET    /api/influencers/:id      # Get influencer details
PUT    /api/influencers/:id      # Update influencer
DELETE /api/influencers/:id      # Remove influencer
```

### Order Management
```
GET    /api/orders               # List all orders
POST   /api/orders               # Create new order
GET    /api/orders/:id           # Get order details
PUT    /api/orders/:id           # Update order status
DELETE /api/orders/:id           # Cancel order
```

### Content Management
```
GET    /api/content              # List content items
POST   /api/content              # Upload new content
GET    /api/content/:id          # Get content details
PUT    /api/content/:id          # Update content status
DELETE /api/content/:id          # Remove content
```

## 🎯 Key Features in Detail

### Mobile-Optimized Interface
- **Ultra-compact dialogs**: Reduced modal sizes (sm:max-w-sm) for mobile screens
- **Minimal spacing**: Tight padding and margins throughout the interface
- **Small form elements**: Compact inputs, buttons, and controls
- **Efficient navigation**: Tab-based system with easy thumb navigation

### Order Management Workflow
1. **Create Order**: Multi-step dialog with influencer selection, product picking, and shipping details
2. **Order Tracking**: Real-time status updates and progress indicators
3. **Fulfillment**: Integrated shipping and delivery tracking
4. **Analytics**: Order performance and completion metrics

### Content Approval System
1. **Content Upload**: Influencers submit content for review
2. **Review Process**: Approve, request changes, or reject submissions
3. **Version Control**: Track content revisions and feedback
4. **Publishing**: Automated posting upon approval

### Dashboard Analytics
- **Performance Metrics**: Influencer engagement and reach statistics
- **Order Analytics**: Conversion rates and fulfillment metrics
- **Revenue Tracking**: Campaign ROI and performance indicators
- **Real-time Updates**: Live data refresh and notifications

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server

# Database
npm run db:generate      # Generate database migrations
npm run db:push          # Push schema changes to database
npm run db:studio        # Open database management studio

# Build
npm run build           # Build for production
npm run preview         # Preview production build

# Type checking
npm run type-check      # Run TypeScript compiler checks
```

## 🔒 Authentication & Security

- **Session-based authentication** with secure HTTP-only cookies
- **Role-based access control** for different user types
- **Input validation** using Zod schemas on both frontend and backend
- **SQL injection protection** through Drizzle ORM parameterized queries
- **CSRF protection** via Express middleware

## 📱 Mobile Responsiveness

### Breakpoints
- **Mobile**: < 640px (primary focus)
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- **Touch-optimized**: Large touch targets and gesture support
- **Compact layouts**: Maximized content in minimal screen space
- **Fast loading**: Optimized bundle sizes and lazy loading
- **Offline support**: Progressive Web App capabilities

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
SESSION_SECRET=secure_random_string
```

### Replit Deployment
This application is optimized for Replit deployment with:
- Automatic environment configuration
- Built-in PostgreSQL database support
- One-click deployment process
- Integrated development workflows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the established patterns
4. Test thoroughly on mobile devices
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style Guidelines
- **TypeScript**: Strict type checking enabled
- **React**: Functional components with hooks
- **Tailwind**: Utility-first CSS approach
- **Mobile-first**: Design for mobile, enhance for desktop
- **Minimal**: Prefer compact, efficient layouts

## 📝 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ for modern influencer marketing management**

For support or questions, please contact the development team.