# TapSite Frontend

AI-powered website builder frontend built with React, Vite, TypeScript, and Tailwind CSS.

## Features

- 🤖 AI Chat Interface for website building
- 🎨 Glassmorphism UI design
- 📱 Responsive design
- ⚡ Real-time updates with Socket.io
- 🔐 Authentication with protected routes
- 💳 Token wallet for AI credits
- 📝 Blog CMS
- 📋 Form Builder

## Tech Stack

- **Build Tool:** Vite 5.x
- **Framework:** React 18.x
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.4+
- **State Management:** Zustand 4.x
- **HTTP Client:** Axios
- **Real-time:** Socket.io-client
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

## Project Structure

```
src/
├── components/
│   ├── auth/         # Authentication components
│   ├── chat/         # Chat interface components
│   ├── layout/       # Layout components
│   ├── preview/      # Website preview
│   ├── ui/           # UI components (shadcn)
│   └── websites/     # Website cards
├── hooks/            # Custom React hooks
├── lib/              # Utilities & API clients
├── pages/            # Page components
├── stores/           # Zustand stores
├── styles/           # Global styles
└── types/            # TypeScript types
```

## Design System

### Colors
- Primary: #2563EB (Trust Blue)
- CTA: #F97316 (Accent Orange)
- Background: #F8FAFC
- Text: #1E293B

### Typography
- Font: Plus Jakarta Sans

### Effects
- Glassmorphism with backdrop blur
- Subtle shadows and borders
- Smooth animations
