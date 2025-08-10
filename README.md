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
   - xAI Grok and OpenAI GPT-4 for course generation
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

5. **Course Generation System (v0.3.0)**
   - **Generate Page** (`/generate`): Complete course creation form
     - Topic input with validation
     - Industry selection (default: Healthcare & Life Sciences)
     - AI skill level and experience level selection
     - Learning goals as comma-separated chips
     - Theory-first approach focus
     - LLM provider selection (xAI Grok preferred, OpenAI GPT-4 fallback)
   - **Draft Course Preview** (`/course/[id]/draft`): Editable course management
     - Course metadata display and editing
     - Session table with inline editing capabilities
     - Session type selection (theory, quiz, interactive, hands_on, review)
     - Duration editing and JSON content management
     - Publish and discard actions
   - **Server Actions**: Course generation and management
     - `generateCoursePlan()`: Creates draft courses with 28 sessions
     - `publishCourse()`: Activates draft courses
     - `discardCourse()`: Soft deletes courses
   - **LLM Integration**: Multi-provider AI support
     - xAI Grok (preferred when `XAI_API_KEY` available)
     - OpenAI GPT-4 (fallback when `OPENAI_API_KEY` available)
     - Automatic retry with stricter prompts for malformed JSON
   - **Type Safety**: Comprehensive validation
     - Zod schemas for form validation
     - TypeScript interfaces for all data structures
     - Error handling with typed responses

6. **Enhanced Dashboard**
   - Draft course banner with "Resume draft course" functionality
   - Active courses display and management
   - Course generation CTA when no courses exist
   - Real-time course counts and status tracking

### 🚧 In Development

1. **Micro-Learning Engine**
   - Session delivery and tracking
   - Adaptive learning paths
   - Performance analytics
   - Engagement monitoring

2. **Emotion-Aware Teaching**
   - Hume AI integration for emotion detection
   - Content adaptation based on frustration/engagement
   - Real-time learning adjustments

3. **AI Chatbot**
   - Voice and text lesson delivery
   - Interactive tool calls
   - Contextual help and guidance

4. **Lesson Player**
   - Interactive session playback
   - Progress tracking
   - Quiz and assessment integration

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

   # AI Provider Configuration (choose one or both)
   OPENAI_API_KEY=your_openai_api_key
   XAI_API_KEY=your_xai_api_key

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

### Course Generation (v0.3.0)
- **Multi-Provider Support**: xAI Grok (preferred) or OpenAI GPT-4 (fallback)
- **Industry-Specific Content**: Tailored to your industry and role
- **Theory-First Approach**: Foundational concepts with practical applications
- **4-Week Structure**: 28 daily sessions (10 minutes each)
- **Session Types**: Theory, quiz, interactive, hands-on, and review content
- **Automatic Validation**: Ensures proper course structure and content quality
- **Error Recovery**: Automatic retry with stricter prompts for malformed responses

### How to Use Course Generation
1. **Navigate to `/generate`** from your dashboard
2. **Fill out the form** with your course topic, industry, and preferences
3. **Submit** to generate a personalized 4-week course
4. **Review and edit** the draft course in the preview page
5. **Publish** when ready to start learning

### LLM Provider Selection
- **OpenAI GPT-4**: Used when `OPENAI_API_KEY` is available (recommended)
- **xAI Grok**: Used when `XAI_API_KEY` is available (fallback)
- **No API Key**: Shows helpful configuration guidance

### Emotion Detection (Planned)
- Real-time emotion monitoring during sessions
- Adaptation triggers for frustration/confusion
- Learning pace adjustments based on engagement
- Supportive interventions when needed

### Chatbot Assistant (Planned)
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
- ✅ **Course Generation (v0.3.0)**: Complete course generation system with LLM integration
- 🚧 **Database Setup**: Schema design in progress
- ⏳ **Learning Engine**: Session delivery system planned
- ⏳ **Emotion AI**: Advanced features in development

---

**Built with ❤️ for learners who want to master AI without the technical complexity.**
