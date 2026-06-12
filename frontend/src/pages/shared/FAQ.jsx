import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import BackToHomeButton from '../../components/BackToHomeButton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import logoSrc from '../../assets/logo.webp';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-gray-50 transition"
      >
        <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <CardContent className="pt-0 pb-6 px-6 border-t border-gray-100">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </CardContent>
      )}
    </Card>
  );
};

import { faqAPI } from '../../utils/api';

export default function FAQ() {
  const [faqs, setFAQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        const response = await faqAPI.getAll();
        setFAQs(response.data.data || []);
        setError(null);
      } catch {

        setError('Failed to load FAQs');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <Link to="/" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition">
              <img
                src={logoSrc}
                alt="JBM Electro logo"
                className="h-10 w-10 rounded-xl bg-white p-1 object-contain"
              />
              <span className="text-lg font-bold text-gray-900 truncate">
                JBM Electro Ventures
              </span>
            </Link>
            <BackToHomeButton />
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our products, services, and policies.
            If you don't find what you're looking for, contact our support team.
          </p>
        </div>
      </section>

      {/* FAQ Items */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading FAQs...</p>
              </div>
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          ) : faqs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600 text-center">No FAQs available yet.</p>
              </CardContent>
            </Card>
          ) : (
            (() => {
              const grouped = faqs.reduce((acc, f) => {
                const cat = (f.category === 'Returns' ? 'Support' : f.category) || 'General';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(f);
                return acc;
              }, {});
              const categoriesOrder = ['Products', 'Orders', 'Membership', 'Support', 'General'];
              const presentCategories = categoriesOrder.filter((c) => (grouped[c] && grouped[c].length > 0));

              return (
                <div className="space-y-6">
                  {presentCategories.map((cat) => (
                    <section key={cat} className="space-y-4">
                      <h2 className="text-2xl font-semibold text-gray-900">{cat}</h2>
                      <div className="space-y-4">
                        {grouped[cat].map((faq) => (
                          <FAQItem key={faq._id} question={faq.question} answer={faq.answer} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Our support team is here to help. Reach out to us anytime and we'll be happy to assist you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@jbm.com.ph">
              <Button size="lg">Email Us</Button>
            </a>
            <a href="tel:+639538223950">
              <Button size="lg" variant="outline">Call Us</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#021b47] to-[#032a68] text-white py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2026 JBM Electro Ventures. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
