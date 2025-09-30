import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="h-8 w-8 text-primary-400" />
              <span className="font-heading font-bold text-xl">FemiHealth</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Empowering women with AI-powered PCOS risk prediction and personalized health insights. 
              Your journey to better health starts here.
            </p>
            <div className="flex space-x-4">
              <a href="mailto:support@femihealth.com" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Mail className="h-5 w-5" />
              </a>
              <a href="tel:+254700000000" className="text-gray-400 hover:text-primary-400 transition-colors">
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/education" className="text-gray-300 hover:text-white transition-colors">
                  Learn About PCOS
                </Link>
              </li>
              <li>
                <Link to="/predict" className="text-gray-300 hover:text-white transition-colors">
                  Risk Assessment
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-gray-300 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2024 FemiHealth. All rights reserved. Built with ❤️ for women's health.
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <MapPin className="h-4 w-4 mr-1" />
            Nairobi, Kenya
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="border-t border-gray-800 mt-4 pt-4">
          <p className="text-gray-500 text-xs text-center">
            <strong>Medical Disclaimer:</strong> FemiHealth is not a substitute for professional medical advice, 
            diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider 
            with any questions you may have regarding a medical condition.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
