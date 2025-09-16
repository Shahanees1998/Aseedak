'use client'

import { Card } from 'primereact/card'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Terms and Conditions</h1>
          <p className="text-gray-300">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing and using Aseedak ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-300 leading-relaxed">
                Aseedak is a multiplayer word-based elimination game where players guess words to eliminate their targets. The game features real-time gameplay, custom avatars, and competitive statistics tracking.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p>• You must provide accurate and complete information when creating an account</p>
                <p>• You are responsible for maintaining the confidentiality of your account credentials</p>
                <p>• You are responsible for all activities that occur under your account</p>
                <p>• You must be at least 13 years old to create an account</p>
                <p>• You may delete your account at any time</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Game Rules and Conduct</h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p>• Players must follow fair play principles</p>
                <p>• No cheating, hacking, or exploiting game mechanics</p>
                <p>• No inappropriate language or behavior in game rooms</p>
                <p>• No harassment or bullying of other players</p>
                <p>• Respect other players and maintain a positive gaming environment</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Prohibited Activities</h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p>• Creating multiple accounts to gain unfair advantages</p>
                <p>• Sharing account credentials with other users</p>
                <p>• Attempting to reverse engineer or modify the game</p>
                <p>• Using automated tools or bots</p>
                <p>• Violating any applicable laws or regulations</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
              <p className="text-gray-300 leading-relaxed">
                The Service and its original content, features, and functionality are and will remain the exclusive property of Aseedak and its licensors. The Service is protected by copyright, trademark, and other laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Privacy Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Account Suspension and Termination</h2>
              <div className="text-gray-300 leading-relaxed space-y-2">
                <p>• We reserve the right to suspend or terminate accounts that violate these terms</p>
                <p>• Suspended users may appeal their suspension through our support system</p>
                <p>• We may terminate accounts that remain inactive for extended periods</p>
                <p>• Upon termination, your right to use the Service will cease immediately</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimers</h2>
              <p className="text-gray-300 leading-relaxed">
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no representations or warranties of any kind, express or implied, as to the operation of the Service or the information, content, materials, or products included on the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed">
                In no event shall Aseedak, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Information</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at{' '}
                <Link href="/contact" className="hover:opacity-80" style={{ color: '#CB1122' }}>
                  our contact page
                </Link>
                .
              </p>
            </section>

            <div className="pt-6 border-t border-white/20">
              <p className="text-gray-400 text-sm">
                By using Aseedak, you acknowledge that you have read and understood these Terms and Conditions and agree to be bound by them.
              </p>
            </div>
          </div>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/">
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
