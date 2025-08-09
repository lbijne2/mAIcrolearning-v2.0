export const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Marketing & Advertising',
  'Real Estate',
  'Legal Services',
  'Consulting',
  'Media & Entertainment',
  'Transportation',
  'Energy',
  'Agriculture',
  'Government',
  'Non-profit',
  'Other'
] as const

export const JOB_ROLES = [
  'Executive/C-Level',
  'Manager/Director',
  'Team Lead',
  'Individual Contributor',
  'Analyst',
  'Consultant',
  'Sales Representative',
  'Marketing Specialist',
  'Operations Specialist',
  'HR Professional',
  'Financial Analyst',
  'Project Manager',
  'Product Manager',
  'Designer',
  'Student',
  'Other'
] as const

export const COMPANY_SIZES = [
  'Solo/Freelancer',
  'Startup (2-10 employees)',
  'Small (11-50 employees)',
  'Medium (51-200 employees)',
  'Large (201-1000 employees)',
  'Enterprise (1000+ employees)'
] as const

export const LEARNING_GOALS = [
  'Understand AI fundamentals',
  'Learn industry-specific AI applications',
  'Improve productivity with AI tools',
  'Prepare for AI transformation in my role',
  'Develop AI strategy for my team/company',
  'Stay current with AI trends',
  'Explore career opportunities in AI',
  'Understand AI ethics and implications',
  'Learn to evaluate AI solutions',
  'Build confidence with AI technology'
] as const

export const INTERESTS = [
  'Natural Language Processing',
  'Computer Vision',
  'Machine Learning',
  'Data Analysis',
  'Automation',
  'Chatbots & Virtual Assistants',
  'Predictive Analytics',
  'Recommendation Systems',
  'AI Ethics',
  'AI Strategy',
  'No-Code AI Tools',
  'AI in Business Processes',
  'AI for Content Creation',
  'AI for Decision Making'
] as const

export const SESSION_TYPES = {
  theory: {
    name: 'Theory',
    description: 'Learn foundational concepts and principles',
    icon: '📚',
    color: 'blue'
  },
  quiz: {
    name: 'Quiz',
    description: 'Test your knowledge and understanding',
    icon: '🧠',
    color: 'purple'
  },
  interactive: {
    name: 'Interactive',
    description: 'Hands-on demos and explorations',
    icon: '🎮',
    color: 'green'
  },
  hands_on: {
    name: 'Hands-on',
    description: 'Build and create with AI tools',
    icon: '🛠️',
    color: 'orange'
  },
  review: {
    name: 'Review',
    description: 'Consolidate and reflect on learning',
    icon: '🔄',
    color: 'gray'
  }
} as const

export const SKILL_LEVELS = {
  none: {
    label: 'No AI Experience',
    description: 'New to AI and machine learning concepts'
  },
  basic: {
    label: 'Basic Understanding',
    description: 'Familiar with AI terms but limited hands-on experience'
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Some experience with AI tools and concepts'
  },
  advanced: {
    label: 'Advanced',
    description: 'Extensive experience implementing AI solutions'
  }
} as const

export const LEARNING_STYLES = {
  visual: {
    label: 'Visual',
    description: 'Learn best through diagrams, charts, and visual content'
  },
  auditory: {
    label: 'Auditory',
    description: 'Prefer listening and verbal explanations'
  },
  kinesthetic: {
    label: 'Hands-on',
    description: 'Learn by doing and interactive experiences'
  },
  reading: {
    label: 'Reading/Writing',
    description: 'Prefer text-based content and note-taking'
  }
} as const

export const EMOTION_THRESHOLDS = {
  frustration: 0.7,
  confusion: 0.6,
  low_engagement: 0.4,
  high_confidence: 0.8
} as const

export const ADAPTATION_STRATEGIES = {
  content_simplification: 'Simplify concepts and use more basic language',
  pace_adjustment: 'Slow down or speed up based on user performance',
  content_enrichment: 'Add more examples and detailed explanations',
  path_modification: 'Adjust the learning path based on preferences',
  encouragement: 'Provide additional motivation and support',
  alternative_explanation: 'Present concepts using different approaches'
} as const

export const API_ROUTES = {
  auth: '/api/auth',
  users: '/api/users',
  courses: '/api/courses',
  sessions: '/api/sessions',
  progress: '/api/progress',
  analytics: '/api/analytics',
  chat: '/api/chat',
  generate: '/api/generate'
} as const
