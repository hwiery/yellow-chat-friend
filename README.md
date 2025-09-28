# YellowTalk - Real-time Messenger App

![YellowTalk Logo](https://via.placeholder.com/100x100/FFDD00/000000?text=YT)

YellowTalk is a modern, real-time messaging application built with React, TypeScript, and Supabase. It features Google OAuth authentication, real-time messaging, friend management, and a clean yellow-themed UI.

## 🚀 Features

- **Real-time Messaging**: Instant messaging powered by Supabase Realtime
- **Google OAuth**: Secure authentication with Google accounts
- **Friend System**: Add friends by ID, manage friend lists
- **Profile Management**: Upload avatars, edit names and status messages
- **Responsive UI**: Mobile-first design with ShadCN components
- **Real-time Updates**: Live friend additions and message delivery
- **Secure**: Row Level Security (RLS) protecting all user data

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: ShadCN UI, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Google OAuth app (for authentication)

## 🔧 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/yellow-chat-friend.git
cd yellow-chat-friend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Update `.env.local` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Supabase Setup

#### A. Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Wait for the database to be ready

#### B. Set Up Database Schema

Run the SQL from `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor to create all necessary tables and RLS policies.

#### C. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
4. In Supabase Dashboard > Authentication > Settings:
   - Enable Google provider
   - Add your Google Client ID and Secret

#### D. Set Up Storage (Optional)

1. Go to Supabase Dashboard > Storage
2. Create a bucket named `avatars`
3. Set bucket policy to public read, authenticated write

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🧪 Testing the Application

### User Registration Flow

1. Click "Google로 로그인" on the login screen
2. Complete Google OAuth flow
3. You'll be logged in and see the main app interface

### Adding Friends

1. Go to Friends tab
2. Click the "+" button
3. Enter another user's YellowTalk ID
4. The friend will be added instantly

### Starting Conversations

1. From Friends list, click on a friend
2. Click "대화하기" in their profile
3. Send messages in real-time

## 🏗 Database Schema

The application uses the following main tables:

- `users` - User profiles and authentication
- `friends` - Friend relationships between users
- `conversations` - Chat conversations
- `messages` - Individual messages

All tables include Row Level Security policies to protect user data.

## 🚀 Production Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Supabase)

1. Create separate Supabase projects for staging and production
2. Run migrations on production database
3. Configure Google OAuth for production domain

## 📱 Mobile Support

The application is fully responsive and works on mobile devices.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run lint`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Made with ❤️ and ☕ by the YellowTalk team
