import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  Heart, 
  Brain, 
  Shield, 
  TrendingUp, 
  Users, 
  Award,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react'

const Home = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Predictions',
      description: 'Advanced machine learning models analyze your health data to provide accurate PCOS risk assessments.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with industry-standard security measures.'
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      description: 'Monitor your health journey with personalized insights and trend analysis over time.'
    },
    {
      icon: Users,
      title: 'Expert-Backed',
      description: 'Developed with healthcare professionals and validated against clinical research.'
    }
  ]

  const benefits = [
    'Early detection and prevention',
    'Personalized health insights',
    'Evidence-based recommendations',
    'Comprehensive health tracking',
    'Educational resources',
    'Secure data management'
  ]

  const testimonials = [
    {
      name: 'Sarah M.',
      location: 'Nairobi, Kenya',
      text: 'FemiHealth helped me understand my symptoms and take proactive steps for my health.',
      rating: 5
    },
    {
      name: 'Grace K.',
      location: 'Mombasa, Kenya',
      text: 'The predictions were accurate and the educational content is incredibly helpful.',
      rating: 5
    },
    {
      name: 'Mary W.',
      location: 'Kisumu, Kenya',
      text: 'Finally, a tool that puts women\'s health first. Highly recommended!',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 mb-6">
              Empowering Women's Health with{' '}
              <span className="text-primary-600">AI Intelligence</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Get personalized PCOS risk assessments using advanced machine learning. 
              Take control of your health journey with evidence-based insights and expert guidance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <Link to="/predict" className="btn-primary text-lg px-8 py-3">
                  Start Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-3">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/education" className="btn-outline text-lg px-8 py-3">
                    Learn About PCOS
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">95%</div>
                <div className="text-gray-600">Prediction Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">10K+</div>
                <div className="text-gray-600">Women Helped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
                <div className="text-gray-600">Available Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              Why Choose FemiHealth?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with medical expertise 
              to provide you with the most accurate and actionable health insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary-200 transition-colors duration-200">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your PCOS risk assessment in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Input Your Data
              </h3>
              <p className="text-gray-600">
                Provide your health information including symptoms, medical history, and upload ultrasound images if available.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI Analysis
              </h3>
              <p className="text-gray-600">
                Our advanced machine learning models analyze your data using Random Forest and CNN algorithms.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Get Results
              </h3>
              <p className="text-gray-600">
                Receive your personalized risk assessment with actionable insights and recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6">
                Take Control of Your Health Journey
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                PCOS affects millions of women worldwide, but early detection and proper management 
                can make all the difference. FemiHealth provides you with the tools and knowledge 
                you need to make informed decisions about your health.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8 text-center">
                <Heart className="mx-auto h-16 w-16 text-primary-600 mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Join Thousands of Women
                </h3>
                <p className="text-gray-600 mb-6">
                  Who have taken control of their health with FemiHealth
                </p>
                {!user && (
                  <Link to="/register" className="btn-primary">
                    Start Your Journey
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from women who have transformed their health journey with FemiHealth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of women who are already using FemiHealth to monitor and improve their health.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/dashboard" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
                  Get Started Free
                </Link>
                <Link to="/education" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
                  Learn More
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
