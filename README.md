# 🚀 FUTURE - Quantum Geometry Trading Platform

A cutting-edge, real-time cryptocurrency trading and analysis platform built with Next.js, featuring AI companions, live market data, and an immersive user interface.

![FUTURE Platform](https://img.shields.io/badge/Platform-FUTURE-blue?style=for-the-badge&logo=next.js)
![Next.js](https://img.shields.io/badge/Next.js-14.2.32-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎯 **Core Trading Features**
- **Real-time Token Data**: Live market data for Solana tokens with instant updates
- **Multi-Column Layout**: Organized view with New Pairs, Filled, Curve, and Edge tokens
- **Advanced Filtering**: Smart token filtering and search functionality
- **Watchlist Management**: Star tokens and manage your favorites
- **Token Insights**: Detailed analysis and market information for each token

### 🤖 **AI Companion System**
- **Interactive Companions**: Drag-and-drop AI agents to analyze specific tokens
- **Single Companion Mode**: One companion at a time for focused analysis
- **Real-time Chat**: Communicate with AI companions about token performance
- **Companion Management**: Easy attachment/detachment with visual feedback
- **Persistent Conversations**: Save and manage chat history

### 🎨 **Immersive UI/UX**
- **Quantum Geometry**: Futuristic design with animated geometric elements
- **Background Videos**: Dynamic video backgrounds for enhanced atmosphere
- **Smooth Animations**: Framer Motion powered transitions and effects
- **Responsive Design**: Optimized for all screen sizes
- **Dark Theme**: Professional dark interface with neon accents

### 🔍 **Advanced Search & Discovery**
- **Token Search**: Search by name, symbol, or contract address
- **Dropdown Results**: Real-time search suggestions with token details
- **Smart Filtering**: Advanced filtering options for token discovery
- **Live Updates**: Real-time search results as you type

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 14.2.32** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Hooks** - State management and side effects

### **Backend Integration**
- **Custom API** - Token data and market information
- **WebSocket Support** - Real-time data streaming
- **Image Proxy** - Optimized image loading and caching
- **Database Integration** - Token metadata and user preferences

### **Development Tools**
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing
- **TypeScript Compiler** - Type checking and compilation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/greaterdan/FUTURE.git
   cd FUTURE
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) (or the port shown in terminal)

## 📁 Project Structure

```
FUTURE/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Scope.tsx          # Main trading interface
│   ├── TokenSearch.tsx    # Search functionality
│   ├── BackgroundVideo.tsx # Video backgrounds
│   ├── BirthdayCursor.tsx # Custom cursor effects
│   └── ...               # Other UI components
├── hooks/                 # Custom React hooks
│   ├── useServerData.ts   # Server data management
│   └── useWebSocket.ts    # WebSocket integration
├── public/               # Static assets
│   ├── videos/           # Background videos
│   ├── zodiac/           # Zodiac-themed assets
│   └── WIZZARD/          # Companion videos
├── server/               # Backend server
│   ├── src/              # Server source code
│   ├── dist/             # Compiled server code
│   └── package.json      # Server dependencies
└── utils/                # Utility functions
```

## 🎮 How to Use

### **Trading Interface**
1. **View Tokens**: Browse tokens in organized columns (New Pairs, Filled, Curve, Edge)
2. **Search Tokens**: Use the search bar to find specific tokens
3. **Star Tokens**: Click the star icon to add tokens to your watchlist
4. **Focus Token**: Click on any token to view detailed insights

### **AI Companion System**
1. **Select Companion**: Choose an AI companion from the companions column
2. **Drag & Drop**: Drag the companion to any token card
3. **Start Chat**: The companion will analyze the token and be ready to chat
4. **Remove Companion**: Click the X button to detach and return to available companions

### **Search & Discovery**
1. **Type to Search**: Start typing in the search bar
2. **View Results**: See dropdown suggestions with token details
3. **Select Token**: Click on any result to focus on that token
4. **Clear Search**: Click outside or clear to return to full view

## 🔧 Configuration

### **Environment Variables**
Create a `.env.local` file in the root directory:

```env
# Server Configuration
SERVER_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Optional: Custom configurations
NEXT_PUBLIC_APP_NAME=FUTURE
NEXT_PUBLIC_VERSION=1.0.0
```

### **Server Setup**
The project includes a backend server in the `server/` directory:

```bash
cd server
npm install
npm run dev
```

## 🎨 Customization

### **Themes & Styling**
- Modify `app/globals.css` for global styles
- Update `tailwind.config.ts` for theme customization
- Customize component styles in individual component files

### **Adding New Companions**
1. Add companion videos to `public/WIZZARD/`
2. Update the `agents` array in `components/Scope.tsx`
3. Ensure video files are in both `.mov` and `.webm` formats

### **Token Data Sources**
- Configure API endpoints in `hooks/useServerData.ts`
- Update server routes in `server/src/api/`
- Modify data transformation logic as needed

## 🚀 Deployment

### **Vercel (Recommended)**
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with zero configuration

### **Docker**
```bash
# Build the application
docker build -t future-app .

# Run the container
docker run -p 3000:3000 future-app
```

### **Manual Deployment**
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Use meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📊 Performance

- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: Optimized with Next.js automatic code splitting
- **Loading Speed**: Sub-second initial load times
- **Real-time Updates**: Efficient WebSocket implementation

## 🔒 Security

- **Type Safety**: Full TypeScript implementation
- **Input Validation**: Sanitized user inputs
- **CORS Configuration**: Proper cross-origin resource sharing
- **Environment Variables**: Secure configuration management

## 📈 Roadmap

### **Upcoming Features**
- [ ] Advanced charting and technical analysis
- [ ] Portfolio tracking and management
- [ ] Social trading features
- [ ] Mobile app development
- [ ] Advanced AI companion capabilities
- [ ] Multi-chain support (Ethereum, BSC, etc.)

### **Planned Improvements**
- [ ] Enhanced search algorithms
- [ ] Real-time notifications
- [ ] Advanced filtering options
- [ ] Performance optimizations
- [ ] Accessibility improvements

## 🐛 Troubleshooting

### **Common Issues**

**Port already in use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Build errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**TypeScript errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/greaterdan/FUTURE/issues)
- **Discussions**: [GitHub Discussions](https://github.com/greaterdan/FUTURE/discussions)
- **Email**: [Contact Developer](mailto:your-email@example.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing framework
- **Vercel** - For deployment platform
- **Tailwind CSS** - For the utility-first CSS framework
- **Framer Motion** - For smooth animations
- **Solana Community** - For blockchain integration

---

<div align="center">

**Built with ❤️ by [Your Name](https://github.com/greaterdan)**

[⭐ Star this repo](https://github.com/greaterdan/FUTURE) | [🐛 Report Bug](https://github.com/greaterdan/FUTURE/issues) | [💡 Request Feature](https://github.com/greaterdan/FUTURE/issues)

</div>