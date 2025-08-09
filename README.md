# mAIcrolearning

Personalized, actionable, hands-on AI learning platform for non-tech-savvy users across all industries.

## 🎯 Overview

mAIcrolearning combines computer science fundamentals with industry-specific AI applications, delivered through 10-minute micro-learning sessions. The platform uses advanced AI to create personalized courses that adapt to your industry, role, and learning style.

## ✨ Features

### ✅ Completed Features

1. **Modern Tech Stack**
   - Next.js 15 with TypeScript
   - Tailwind CSS for responsive design
   - Supabase for backend and authentication
   - OpenAI GPT-4 for course generation
   - Lucide icons for consistent UI

2. **Interactive Onboarding**
   - Personal information collection
   - Professional background assessment
   - Learning preferences and goals
   - AI skill level evaluation
   - Comprehensive profile creation

3. **User Authentication**
   - Secure sign up/sign in flow
   - Email-based authentication via Supabase
   - Protected routes and session management

4. **Responsive UI Components**
   - Reusable button, card, input components
   - Progress indicators (linear and circular)
   - Mobile-first responsive design
   - Beautiful landing page with feature showcase

5. **Dashboard Foundation**
   - Personalized welcome experience
   - Profile summary and learning goals display
   - Progress tracking placeholder
   - Course generation entry point

### 🚧 In Development

1. **Database Schema**
   - User profiles and progress tracking
   - Course and session management
   - Analytics and emotion data
   - Learning path adaptations

2. **Course Generation System**
   - LLM chains for content creation
   - Industry-specific customization
   - 4-week course structure with daily sessions
   - Theory, quiz, interactive, and hands-on content types

3. **Micro-Learning Engine**
   - Session delivery and tracking
   - Adaptive learning paths
   - Performance analytics
   - Engagement monitoring

4. **Emotion-Aware Teaching**
   - Hume AI integration for emotion detection
   - Content adaptation based on frustration/engagement
   - Real-time learning adjustments

5. **AI Chatbot**
   - Voice and text lesson delivery
   - Interactive tool calls
   - Contextual help and guidance

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks and context
- **Authentication**: Supabase Auth

### Backend
- **Database**: Supabase PostgreSQL
- **API**: Next.js API routes
- **AI/ML**: OpenAI GPT-4, Hume AI
- **Real-time**: Supabase subscriptions

### Key Components
```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── auth/           # Authentication components
│   ├── onboarding/     # Onboarding flow
│   └── dashboard/      # Dashboard components
├── hooks/              # Custom React hooks
├── lib/                # Third-party configurations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and constants
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mAIcrolearning
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

   **Note**: If you encounter Tailwind CSS PostCSS errors, the project uses Tailwind CSS v3.4.x for stability. The configuration has been tested and should work out of the box.

3. **Set up environment variables**
   Create a `.env.local` file with:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # Hume AI Configuration (for emotion detection)
   HUME_API_KEY=your_hume_api_key
   HUME_CLIENT_ID=your_hume_client_id

   # Application Configuration
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the database migrations (coming soon)
   - Configure authentication settings

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The platform uses the following main tables:
- `users` - User authentication data
- `user_profiles` - Detailed user information and preferences
- `courses` - Generated course content and metadata
- `sessions` - Individual learning sessions
- `user_progress` - Progress tracking and analytics
- `learning_paths` - Adaptive learning journey data
- `chat_messages` - Chatbot conversation history
- `analytics` - User engagement and performance metrics

## 🎨 Design System

### Color Palette
- **Primary**: Blue tones for main actions and branding
- **Secondary**: Purple accents for highlights
- **Accent**: Orange for call-to-action elements
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Display Font**: Poppins for headings
- **Body Font**: Inter for content
- **Font Sizes**: Responsive scale from mobile to desktop

### Components
- Consistent spacing using Tailwind's scale
- Rounded corners and subtle shadows
- Hover states and smooth transitions
- Mobile-first responsive breakpoints

## 🧠 AI Integration

### Course Generation
- Uses GPT-4 to create industry-specific content
- Combines theoretical concepts with practical applications
- Adapts to user's skill level and learning preferences
- Generates 4-week courses with daily 10-minute sessions

### Emotion Detection
- Real-time emotion monitoring during sessions
- Adaptation triggers for frustration/confusion
- Learning pace adjustments based on engagement
- Supportive interventions when needed

### Chatbot Assistant
- Context-aware lesson delivery
- Interactive tool recommendations
- Natural language explanations
- Progress encouragement and guidance

## 🌍 Industry Coverage

Currently supporting:
- Technology & Software
- Healthcare & Life Sciences
- Finance & Banking
- Education & Training
- Manufacturing & Operations
- Marketing & Advertising
- Real Estate & Construction
- Legal & Professional Services
- And more...

## 📱 Mobile Experience

- Responsive design for all screen sizes
- Touch-friendly interface elements
- Optimized for mobile learning sessions
- Progressive web app capabilities (planned)

## 🔒 Security & Privacy

- Secure authentication with Supabase
- Data encryption in transit and at rest
- GDPR-compliant data handling
- User data anonymization options
- Regular security audits (planned)

## 🤝 Contributing

This is currently a private project, but contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🔧 Troubleshooting

### Common Issues

**Tailwind CSS PostCSS Error**
```
Error: It looks like you're trying to use `tailwindcss` directly as a PostCSS plugin...
```
**Solution**: The project uses Tailwind CSS v3.4.x. If you see this error, run:
```bash
npm uninstall tailwindcss && npm install tailwindcss@^3.4.0
```

**Development Server Won't Start**
- Ensure you're using Node.js 18+
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Check that no other process is using port 3000

**Authentication Issues**
- Verify your Supabase environment variables are correct
- Check that your Supabase project has authentication enabled
- Ensure your Supabase URL format is: `https://your-project.supabase.co`

## 📞 Support

For questions or support:
- Email: support@maicrolearning.com
- Documentation: [docs.maicrolearning.com](https://docs.maicrolearning.com)
- Issues: [GitHub Issues](https://github.com/maicrolearning/platform/issues)

## 🚦 Development Status

- ✅ **MVP Foundation**: Core structure and onboarding complete
- 🚧 **Database Setup**: Schema design in progress
- ⏳ **Course Generation**: LLM integration upcoming
- ⏳ **Learning Engine**: Session delivery system planned
- ⏳ **Emotion AI**: Advanced features in development

---

**Built with ❤️ for learners who want to master AI without the technical complexity.**
