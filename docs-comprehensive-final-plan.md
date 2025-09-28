# YellowTalk - Comprehensive Final Implementation Plan

## Project Overview
**App Name**: YellowTalk
**Framework**: React + TypeScript + Vite (Current Stack)
**UI Library**: ShadCN UI + Tailwind CSS
**Theme**: Yellow (#FFDD00) & Black (#000000)
**Backend**: Supabase (Auth + Database + Real-time)
**Deployment**: Vercel (Frontend) + Render (Backend Services)

## 1. Authentication System

### Google OAuth Integration
- Google login/signup button on landing page
- YellowTalk title display on auth screen
- Seamless registration for new users
- Session management with Supabase Auth

### User Management
- Unique user ID generation
- Profile creation on first login
- Logout functionality → redirect to login
- Account deletion with confirmation modal

## 2. Core Features Implementation

### A. Friend Management System

#### Friend List Screen
- Search bar for friend name filtering
- Friend profiles display (name, status, profile image)
- Friend addition via ID search
- Contact invitation sharing
- Friend blocking/deletion options

#### Enhanced Friend Features (from lovable-fix)
- **Friend Addition**: Dedicated screen with ID input field
- **Friend Profile View**:
  - Display profile photo, name, status
  - Image tap → full-screen view
  - "Start Chat" button

#### Friend Operations
- Add friend by unique ID
- Remove/block friends
- View friend profiles

### B. Chat System

#### Chat List Screen
- Recent conversations sorted by time
- Unread message badges
- Profile thumbnails, names, last message, timestamp
- **Chat Deletion**: Swipe/long-press to delete conversations

#### Chat Room Interface
- **Header**: Friend name only (no profile photo in header)
- **Messages**: Profile photos for both users in message bubbles
- **Styling**: Left bubbles (white), Right bubbles (yellow)
- Text, emoji, and photo sharing
- Real-time messaging via Supabase

#### Message Features
- Send text, emojis, images
- Message delivery status
- Timestamp display
- Profile photo integration in chat bubbles

### C. Profile Management

#### My Profile Display
- **User ID visibility** (for friend additions)
- Profile photo, name, status message
- "Edit Profile" button

#### Profile Editing
- **Profile Photo**: Upload/change image
- **Name**: Edit display name
- **Status Message**: Custom status/comment
- Save changes functionality

#### Settings Management
- **Notification Settings**: On/off toggle
- **Account Management**:
  - Logout option
  - Account deletion with confirmation
- **Remove**: "YellowTalk에서 대화해요" text
- **Remove**: Theme settings option

## 3. Technical Architecture

### Frontend Structure (React + TypeScript)
```
src/
├── components/
│   ├── auth/
│   │   ├── login-screen.tsx
│   │   └── google-auth-button.tsx
│   ├── friends/
│   │   ├── friend-list.tsx
│   │   ├── friend-item.tsx
│   │   ├── add-friend-modal.tsx
│   │   └── friend-profile.tsx
│   ├── chat/
│   │   ├── chat-list.tsx
│   │   ├── chat-room.tsx
│   │   ├── message-bubble.tsx
│   │   └── chat-input.tsx
│   ├── profile/
│   │   ├── my-profile.tsx
│   │   ├── edit-profile.tsx
│   │   └── settings.tsx
│   └── ui/ (ShadCN components)
├── hooks/
├── lib/
├── pages/
└── types/
```

### Backend Integration (Supabase)

#### Database Schema
```sql
-- Users table
users (
  id uuid primary key,
  email text unique,
  display_name text,
  status_message text,
  profile_image_url text,
  user_id text unique, -- for friend search
  created_at timestamp,
  updated_at timestamp
)

-- Friendships table
friendships (
  id uuid primary key,
  user_id uuid references users(id),
  friend_id uuid references users(id),
  status text check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamp
)

-- Conversations table
conversations (
  id uuid primary key,
  participant_1 uuid references users(id),
  participant_2 uuid references users(id),
  last_message_at timestamp,
  created_at timestamp
)

-- Messages table
messages (
  id uuid primary key,
  conversation_id uuid references conversations(id),
  sender_id uuid references users(id),
  content text,
  message_type text check (message_type in ('text', 'image', 'emoji')),
  image_url text,
  created_at timestamp,
  read_at timestamp
)
```

#### Row Level Security (RLS)
- Users can only access their own data
- Friends can see each other's basic profile info
- Messages restricted to conversation participants
- Real-time subscriptions with proper authorization

### Real-time Features
- Live message delivery
- Online status indicators
- Typing indicators
- Push notifications (via Supabase)

## 4. UI/UX Specifications

### Design System
- **Primary Color**: Yellow (#FFDD00)
- **Secondary Color**: Black (#000000)
- **Background**: White (#FFFFFF)
- **Text**: Black (#000000), Gray (#666666)

### Navigation Structure
```
Bottom Navigation:
├── 👥 Friends (Friend list + search + add)
├── 💬 Chats (Conversation list + new chat)
└── 🙍 Profile (My profile + settings)
```

### Component Styling
- Circular profile images
- Yellow accent buttons and highlights
- Clean, minimal interface similar to KakaoTalk
- Responsive design for mobile-first

## 5. Production Deployment Strategy

### Frontend (Vercel)
- Automatic deployments from main branch
- Environment variables for Supabase connection
- Build optimization with Vite
- CDN distribution for global performance

### Backend (Supabase + Render)
- **Database**: Supabase PostgreSQL with RLS
- **Authentication**: Supabase Auth with Google OAuth
- **File Storage**: Supabase Storage for profile/message images
- **Real-time**: Supabase Realtime for live messaging

### CI/CD Pipeline
- GitHub Actions for automated testing
- ESLint + TypeScript checking
- Automated deployment to staging/production
- Database migration management

### Monitoring & Security
- Connection pooling (PgBouncer/Supavisor)
- Point-in-Time Recovery (PITR) backup
- Environment separation (staging/production)
- Network security (IPv6/proxy configuration for Render)

## 6. Implementation Priority

### Phase 1: Core Foundation
1. Authentication system with Google OAuth
2. Basic user profile management
3. Database schema and RLS setup

### Phase 2: Friend System
1. Friend addition by ID
2. Friend list and search
3. Friend profile viewing

### Phase 3: Messaging Core
1. Chat room creation
2. Basic text messaging
3. Real-time message delivery

### Phase 4: Enhanced Features
1. Image sharing in chats
2. Chat deletion functionality
3. Profile photo management
4. Settings and notifications

### Phase 5: Polish & Production
1. Notification system
2. Account deletion workflow
3. Performance optimization
4. Production deployment

## 7. Key Requirements Checklist

### Authentication ✓
- [x] Google login/signup
- [x] YellowTalk title on auth screen
- [x] Logout functionality
- [x] Account deletion with confirmation

### Friends ✓
- [x] Friend addition with ID input screen
- [x] Friend profile viewing with image expansion
- [x] Friend list with search

### Chat ✓
- [x] Chat room deletion
- [x] Profile photos in message bubbles
- [x] Header shows name only (no profile photo)
- [x] Real-time messaging

### Profile ✓
- [x] Display user ID
- [x] Profile editing (photo, name, status)
- [x] Remove "YellowTalk에서 대화해요" text
- [x] Settings with notification toggle
- [x] Remove theme settings

This comprehensive plan integrates all requirements from the three source documents, ensuring a complete messenger application that meets both the initial vision and the specific enhancement requirements.