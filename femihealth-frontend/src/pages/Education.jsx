import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  BookOpen,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  Lightbulb,
  Target,
  Calendar,
  Utensils,
  Dumbbell,
  Brain,
  Stethoscope,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const Education = () => {
  const [expandedSection, setExpandedSection] = useState(null)

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const symptoms = [
    {
      category: 'Menstrual Irregularities',
      items: [
        'Irregular or absent periods',
        'Heavy or prolonged menstrual bleeding',
        'Infrequent periods (fewer than 8 per year)'
      ]
    },
    {
      category: 'Hormonal Symptoms',
      items: [
        'Excess hair growth (hirsutism)',
        'Male-pattern baldness or hair thinning',
        'Acne or oily skin',
        'Deepening of voice'
      ]
    },
    {
      category: 'Metabolic Symptoms',
      items: [
        'Weight gain or difficulty losing weight',
        'Insulin resistance',
        'Dark patches of skin (acanthosis nigricans)',
        'High blood sugar levels'
      ]
    },
    {
      category: 'Reproductive Symptoms',
      items: [
        'Difficulty getting pregnant',
        'Multiple small cysts on ovaries',
        'Enlarged ovaries'
      ]
    }
  ]

  const causes = [
    {
      title: 'Insulin Resistance',
      description: 'Up to 70% of women with PCOS have insulin resistance, which can lead to increased androgen production.',
      icon: <Activity className="h-6 w-6 text-primary-600" />
    },
    {
      title: 'Hormonal Imbalance',
      description: 'Elevated levels of androgens (male hormones) interfere with ovulation and cause many PCOS symptoms.',
      icon: <Target className="h-6 w-6 text-primary-600" />
    },
    {
      title: 'Genetics',
      description: 'PCOS often runs in families, suggesting a genetic component to the condition.',
      icon: <Users className="h-6 w-6 text-primary-600" />
    },
    {
      title: 'Inflammation',
      description: 'Low-grade inflammation is common in PCOS and may contribute to insulin resistance.',
      icon: <AlertCircle className="h-6 w-6 text-primary-600" />
    }
  ]

  const managementStrategies = [
    {
      category: 'Lifestyle Modifications',
      icon: <Dumbbell className="h-8 w-8 text-success-600" />,
      strategies: [
        'Regular physical activity (150 minutes per week)',
        'Weight management through healthy diet',
        'Stress reduction techniques',
        'Adequate sleep (7-9 hours per night)'
      ]
    },
    {
      category: 'Dietary Approaches',
      icon: <Utensils className="h-8 w-8 text-blue-600" />,
      strategies: [
        'Low glycemic index foods',
        'Anti-inflammatory diet',
        'Portion control and regular meals',
        'Limit processed foods and added sugars'
      ]
    },
    {
      category: 'Medical Treatment',
      icon: <Stethoscope className="h-8 w-8 text-purple-600" />,
      strategies: [
        'Hormonal birth control for cycle regulation',
        'Metformin for insulin resistance',
        'Anti-androgen medications',
        'Fertility treatments if needed'
      ]
    },
    {
      category: 'Mental Health Support',
      icon: <Brain className="h-8 w-8 text-pink-600" />,
      strategies: [
        'Counseling or therapy',
        'Support groups',
        'Stress management techniques',
        'Body image and self-esteem support'
      ]
    }
  ]

  const faqs = [
    {
      question: 'What is PCOS?',
      answer: 'Polycystic Ovary Syndrome (PCOS) is a hormonal disorder that affects women of reproductive age. It involves irregular menstrual periods, excess androgen levels, and polycystic ovaries.'
    },
    {
      question: 'How common is PCOS?',
      answer: 'PCOS affects 6-12% of women of reproductive age, making it one of the most common hormonal disorders in women.'
    },
    {
      question: 'Can PCOS be cured?',
      answer: 'While there is no cure for PCOS, symptoms can be effectively managed through lifestyle changes, medications, and proper medical care.'
    },
    {
      question: 'Does PCOS affect fertility?',
      answer: 'PCOS is a leading cause of infertility, but many women with PCOS can still conceive with proper treatment and lifestyle modifications.'
    },
    {
      question: 'What are the long-term health risks?',
      answer: 'Women with PCOS have increased risks of type 2 diabetes, heart disease, high blood pressure, and endometrial cancer. Regular monitoring and management can help reduce these risks.'
    },
    {
      question: 'How is PCOS diagnosed?',
      answer: 'PCOS is diagnosed based on the Rotterdam criteria, which includes irregular periods, clinical or biochemical signs of hyperandrogenism, and polycystic ovaries on ultrasound.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Heart className="mx-auto h-16 w-16 text-primary-600 mb-6" />
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            Understanding PCOS
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive information about Polycystic Ovary Syndrome to help you 
            understand the condition, its symptoms, causes, and management strategies.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card text-center">
            <Users className="mx-auto h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">6-12%</h3>
            <p className="text-gray-600">of women affected worldwide</p>
          </div>
          <div className="card text-center">
            <Target className="mx-auto h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Leading</h3>
            <p className="text-gray-600">cause of female infertility</p>
          </div>
          <div className="card text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Manageable</h3>
            <p className="text-gray-600">with proper care and lifestyle</p>
          </div>
        </div>

        {/* What is PCOS */}
        <div className="card mb-8">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            What is PCOS?
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-4">
              Polycystic Ovary Syndrome (PCOS) is a complex hormonal disorder that affects women 
              of reproductive age. Despite its name, PCOS is not just about ovarian cysts – it's 
              a syndrome involving multiple systems in the body, including reproductive, metabolic, 
              and cardiovascular systems.
            </p>
            <p className="text-gray-700">
              The condition is characterized by irregular menstrual cycles, elevated levels of 
              male hormones (androgens), and the presence of multiple small cysts on the ovaries. 
              PCOS can significantly impact a woman's quality of life, fertility, and long-term health.
            </p>
          </div>
        </div>

        {/* Symptoms */}
        <div className="card mb-8">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            Signs and Symptoms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {symptoms.map((category, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {category.category}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Causes */}
        <div className="card mb-8">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            What Causes PCOS?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {causes.map((cause, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                {cause.icon}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {cause.title}
                  </h3>
                  <p className="text-sm text-gray-700">{cause.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Management Strategies */}
        <div className="card mb-8">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            Management Strategies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {managementStrategies.map((strategy, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  {strategy.icon}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {strategy.category}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {strategy.strategies.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-success-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="card mb-8">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection(`faq-${index}`)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <h3 className="text-lg font-medium text-gray-900">
                    {faq.question}
                  </h3>
                  {expandedSection === `faq-${index}` ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {expandedSection === `faq-${index}` && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
          <div className="text-center">
            <Lightbulb className="mx-auto h-12 w-12 text-primary-600 mb-4" />
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">
              Take Control of Your Health
            </h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Understanding PCOS is the first step towards better health management. 
              Use our AI-powered assessment tool to evaluate your risk and get personalized insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/predict" className="btn-primary">
                <Activity className="h-4 w-4 mr-2" />
                Take Assessment
              </Link>
              <Link to="/dashboard" className="btn-outline">
                <BookOpen className="h-4 w-4 mr-2" />
                View Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Educational Content Disclaimer</p>
              <p>
                This information is for educational purposes only and should not replace 
                professional medical advice. Always consult with qualified healthcare 
                providers for diagnosis, treatment, and medical guidance regarding PCOS 
                or any health concerns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Education
