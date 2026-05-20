import { Link } from 'react-router-dom';
import { ArrowRight, Target, Users, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

export default function ClientHomepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="bg-white shadow-sm border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="h-8 w-8 text-blue-600 shrink-0" />
              <span className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                JBM Electro Ventures
              </span>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Powering Your Future with <span className="text-blue-600">Innovation</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            JBM Electro Ventures delivers cutting-edge electrical solutions and products
            tailored to meet your residential, commercial, and industrial needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Explore Products <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Contact Us
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <Target className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                To provide high-quality, innovative electrical products and services that
                enhance the lives of our customers while maintaining the highest standards
                of safety, reliability, and sustainability.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-blue-600 mb-4" />
              <CardTitle>Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                To be the leading provider of electrical solutions in the region,
                recognized for our commitment to innovation, customer satisfaction,
                and environmental responsibility.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Premium Products</CardTitle>
                <CardDescription>
                  High-quality electrical components, fixtures, and equipment from trusted brands
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Package Deals</CardTitle>
                <CardDescription>
                  Curated bundles designed for specific projects at competitive prices
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Expert Consultation</CardTitle>
                <CardDescription>
                  Professional guidance to help you choose the right solutions for your needs
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-6 w-6" />
            <span className="text-lg font-semibold">JBM Electro Ventures</span>
          </div>
          <p className="text-gray-400">
            © 2026 JBM Electro Ventures. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
