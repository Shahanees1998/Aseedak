# Aseedak - Word Elimination Game

A real-time multiplayer word-based elimination game built with Next.js, Prisma, and Pusher.

## 🎮 Game Overview

Aseedak is an exciting multiplayer game where players guess words to eliminate their targets. Each player gets assigned 3 words and a target player. The goal is to guess your target's words to eliminate them, while avoiding being eliminated yourself. The last player standing wins!

## ✨ Features

### 🎯 Core Game Features
- **Real-time Multiplayer**: Up to 8 players per room
- **Word-based Elimination**: Guess words to eliminate targets
- **Dynamic Target Assignment**: When a player is eliminated, their target becomes yours
- **Live Game Updates**: Real-time notifications and game state updates
- **Game Statistics**: Track games played, won, and total kills

### 👤 User Management
- **User Registration & Authentication**: Secure login with NextAuth
- **Password Reset**: Email-based password recovery
- **Profile Management**: Customizable avatars and user information
- **Account Deletion**: Users can delete their accounts

### 🎨 Avatar System
- **8 Unique Avatars**: Warrior, Mage, Archer, Ninja, Knight, Wizard, Assassin, Paladin
- **Admin Assignment**: Admins can assign avatars to users
- **Visual Identity**: Each avatar has distinct visual representation

### 🛠️ Admin Features
- **Word Management**: CRUD operations for word sets (3 words per set)
- **User Management**: View, edit, suspend, and manage users
- **Game Monitoring**: Track all game rooms and results
- **System Settings**: Configure game parameters

### 🏠 Room System
- **Room Creation**: Create custom game rooms with specific settings
- **Room Codes**: Easy sharing with unique room codes
- **Game Settings**: Configure difficulty, category, time limits, and player count
- **Private Rooms**: Optional private room functionality

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- MongoDB database
- Pusher account (for real-time features)
- SMTP email service (for password reset)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shahanees1998/Aseedak.git
   cd Aseedak
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="mongodb://localhost:27017/aseedak"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   PUSHER_APP_ID="your-pusher-app-id"
   PUSHER_KEY="your-pusher-key"
   PUSHER_SECRET="your-pusher-secret"
   PUSHER_CLUSTER="your-pusher-cluster"
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Play

### Game Setup
1. **Create Account**: Register with email and choose an avatar
2. **Join Room**: Enter a room code or create a new room
3. **Wait for Players**: Room fills up or creator starts the game
4. **Get Assigned**: Receive 3 words and a target player

### Gameplay
1. **Make Guesses**: Guess words that might belong to your target
2. **Target Confirms**: Target player confirms if the guess is correct
3. **Elimination**: Correct guesses eliminate the target player
4. **Target Transfer**: Eliminated player's target becomes yours
5. **Win Condition**: Be the last player standing!

### Game Rules
- Each player has 3 unique words
- You can only guess words (not ask questions)
- Target must confirm guesses honestly
- Eliminated players cannot participate further
- Game continues until one player remains

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, PrimeReact
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **Real-time**: Pusher
- **Styling**: Tailwind CSS, PrimeReact Components

### Database Schema
- **Users**: Player accounts with avatars and statistics
- **Words**: Word sets with categories and difficulty levels
- **GameRooms**: Game sessions with settings and status
- **GamePlayers**: Player state within games
- **GameLogs**: Game events and eliminations
- **Notifications**: User notifications and alerts

### API Endpoints
- **Authentication**: `/api/auth/*` - Login, register, password reset
- **Admin**: `/api/admin/*` - Word and user management
- **Game Rooms**: `/api/game-rooms/*` - Room creation, joining, gameplay
- **Pusher**: `/api/pusher/*` - Real-time communication

## 🔧 Configuration

### Game Settings
- **Max Players**: 2-8 players per room
- **Time Limits**: 30-300 seconds per turn
- **Difficulty Levels**: Easy, Medium, Hard
- **Categories**: Animals, Food, Objects, Places, Actions, Colors

### Admin Configuration
- **Word Management**: Add/edit word sets with 3 words each
- **User Management**: Suspend/activate user accounts
- **Avatar Assignment**: Assign avatars to users
- **Game Monitoring**: View all active games and results

## 🚀 Deployment

### Production Setup
1. **Database**: Set up MongoDB Atlas or self-hosted MongoDB
2. **Environment**: Configure production environment variables
3. **Pusher**: Set up Pusher channels for real-time features
4. **Email**: Configure SMTP for password reset emails
5. **Deploy**: Deploy to Vercel, Netlify, or your preferred platform

### Environment Variables
```env
DATABASE_URL="your-production-mongodb-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="your-pusher-cluster"
SMTP_HOST="your-smtp-host"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@your-domain.com"
```

## 📱 Features Overview

### User Features
- ✅ User registration and login
- ✅ Password reset via email
- ✅ Profile management
- ✅ Avatar selection
- ✅ Game statistics tracking
- ✅ Account deletion

### Game Features
- ✅ Real-time multiplayer rooms
- ✅ Word-based elimination gameplay
- ✅ Dynamic target assignment
- ✅ Live game updates
- ✅ Game result tracking
- ✅ Room creation and joining

### Admin Features
- ✅ Word set management (CRUD)
- ✅ User management and suspension
- ✅ Avatar assignment
- ✅ Game monitoring
- ✅ System configuration

### Technical Features
- ✅ Real-time communication with Pusher
- ✅ Secure authentication with NextAuth
- ✅ Database management with Prisma
- ✅ Responsive design with Tailwind CSS
- ✅ Type-safe development with TypeScript

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/Shahanees1998/Aseedak/issues) page
2. Create a new issue with detailed information
3. Contact us through the [Contact Page](https://your-domain.com/contact)

## 🎯 Roadmap

### Planned Features
- [ ] Tournament mode
- [ ] Custom word categories
- [ ] Achievement system
- [ ] Friend system
- [ ] Mobile app
- [ ] Voice chat integration
- [ ] Spectator mode
- [ ] Replay system

---

**Enjoy playing Aseedak! 🎮**

For more information, visit our [Terms and Conditions](https://your-domain.com/terms) page.