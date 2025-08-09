'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Brain, 
  Zap, 
  Target, 
  Users, 
  ArrowRight, 
  PlayCircle,
  CheckCircle,
  Star,
  Globe,
  Smartphone,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuth } from '@/hooks/useAuth'

export function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const router = useRouter()
  
  // Get auth state to show sign out option if user is signed in
  const { user, signOut } = useAuth()

  const handleGetStarted = () => {
    setAuthMode('signup')
    setShowAuthModal(true)
  }

  const handleSignIn = () => {
    setAuthMode('signin')
    setShowAuthModal(true)
  }

  const handleSignOut = async () => {
    if (signOut) {
      await signOut()
      // Reload the page to clear any cached state
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto container-padding py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-display font-bold text-neutral-900">
                mAIcrolearning
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="ghost" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                  <Button onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleSignIn}>
                    Sign In
                  </Button>
                  <Button onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative section-spacing">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-neutral-900 mb-6">
              Master AI Through
              <span className="text-gradient block">Personalized Micro-Learning</span>
            </h1>
            
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
              Learn AI fundamentals and industry-specific applications in just 10 minutes a day. 
              Designed for non-tech professionals who want to stay ahead.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" onClick={handleGetStarted} icon={<ArrowRight />}>
                Start Your AI Journey
              </Button>
              <Button variant="outline" size="lg" icon={<PlayCircle />}>
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">10 min</div>
                <div className="text-neutral-600">Daily sessions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">4 weeks</div>
                <div className="text-neutral-600">Complete courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">15+</div>
                <div className="text-neutral-600">Industries covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing bg-white">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-4">
              Why Choose mAIcrolearning?
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI with proven learning science to deliver 
              personalized education that fits your schedule and industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-primary-600 mb-4" />
                <CardTitle>Personalized Learning</CardTitle>
              </CardHeader>
              <CardContent>
                Adaptive courses tailored to your industry, role, and skill level. 
                Our AI adjusts content based on your progress and engagement.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-accent-600 mb-4" />
                <CardTitle>Micro-Learning</CardTitle>
              </CardHeader>
              <CardContent>
                Just 10 minutes a day. Bite-sized lessons that fit into your busy schedule 
                while maximizing retention and application.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-secondary-600 mb-4" />
                <CardTitle>Industry-Specific</CardTitle>
              </CardHeader>
              <CardContent>
                Real-world applications for your industry. Learn how AI transforms 
                healthcare, finance, marketing, and more.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-primary-600 mb-4" />
                <CardTitle>Emotion-Aware</CardTitle>
              </CardHeader>
              <CardContent>
                Advanced emotion detection adapts the learning experience to your mood, 
                frustration level, and engagement.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-8 w-8 text-accent-600 mb-4" />
                <CardTitle>Mobile-First</CardTitle>
              </CardHeader>
              <CardContent>
                Learn anywhere, anytime. Seamless experience across desktop, tablet, 
                and mobile devices.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-secondary-600 mb-4" />
                <CardTitle>Hands-On Practice</CardTitle>
              </CardHeader>
              <CardContent>
                Interactive demos, real AI tools, and practical exercises. 
                Learn by doing, not just reading.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-spacing bg-neutral-50">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-neutral-600">
              Get started in minutes with our streamlined onboarding process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Complete Onboarding</h3>
              <p className="text-neutral-600">
                Tell us about your industry, role, and AI experience. 
                Our system creates your personalized learning profile.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-accent-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Your Course</h3>
              <p className="text-neutral-600">
                AI generates a custom 4-week course combining theory with 
                practical applications for your specific industry.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-secondary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Learn & Apply</h3>
              <p className="text-neutral-600">
                Daily 10-minute sessions with theory, quizzes, and hands-on practice. 
                Track progress and adapt your learning path.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-spacing bg-white">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 mb-6">
                Transform Your Career with AI Knowledge
              </h2>
              <p className="text-lg text-neutral-600 mb-8">
                Join thousands of professionals who have successfully integrated AI into their work 
                without needing a technical background.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-neutral-900">Boost Productivity</h4>
                    <p className="text-neutral-600">Learn to automate tasks and enhance efficiency with AI tools</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-neutral-900">Stay Competitive</h4>
                    <p className="text-neutral-600">Keep ahead of industry trends and technological changes</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-neutral-900">Make Better Decisions</h4>
                    <p className="text-neutral-600">Understand AI capabilities to make informed business choices</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-neutral-900">Build Confidence</h4>
                    <p className="text-neutral-600">Gain the knowledge to lead AI initiatives in your organization</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8">
              <div className="text-center">
                <Globe className="h-16 w-16 text-primary-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Industries We Cover
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm text-neutral-700">
                  <div>Healthcare</div>
                  <div>Finance</div>
                  <div>Marketing</div>
                  <div>Education</div>
                  <div>Manufacturing</div>
                  <div>Retail</div>
                  <div>Real Estate</div>
                  <div>Legal</div>
                  <div>Consulting</div>
                  <div>Media</div>
                  <div>Energy</div>
                  <div>And more...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto container-padding text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
            Ready to Master AI in Your Industry?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of professionals transforming their careers with AI knowledge
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={handleGetStarted}
              icon={<ArrowRight />}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary-600"
            >
              Schedule Demo
            </Button>
          </div>
          
          <p className="text-primary-200 text-sm mt-6">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300 py-12">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary-400" />
              <span className="font-display font-bold">mAIcrolearning</span>
            </div>
            
            <div className="text-sm">
              © 2024 mAIcrolearning. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false)
            router.push('/onboarding')
          }}
        />
      )}
    </div>
  )
}
