import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Lightbulb, Wrench, Gauge } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg p-1.5">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 truncate">
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

      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-8">
            <Gauge className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Trusted by thousands of customers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Powering Your Future with <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Innovation</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            JBM Electro Ventures delivers cutting-edge electrical solutions and products
            tailored to meet your residential, commercial, and industrial needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Explore Products <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Mission & Vision</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Lightbulb className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700">
                  To provide high-quality, innovative electrical products and services that
                  enhance the lives of our customers while maintaining the highest standards
                  of safety, reliability, and sustainability.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <Wrench className="h-12 w-12 text-cyan-600 mb-4" />
                <CardTitle className="text-xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-gray-700">
                  To be the leading provider of electrical solutions in the region,
                  recognized for our commitment to innovation, customer satisfaction,
                  and environmental responsibility.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <Gauge className="h-10 w-10 text-blue-600 mb-3" />
                <CardTitle>Premium Products</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700">
                  High-quality electrical components, fixtures, and equipment from trusted brands
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <Zap className="h-10 w-10 text-cyan-600 mb-3" />
                <CardTitle>Package Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700">
                  Curated bundles designed for specific projects at competitive prices
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <Wrench className="h-10 w-10 text-emerald-600 mb-3" />
                <CardTitle>Expert Consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-700">
                  Professional guidance to help you choose the right solutions for your needs
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12 px-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg p-1.5">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">JBM Electro Ventures</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2026 JBM Electro Ventures. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
