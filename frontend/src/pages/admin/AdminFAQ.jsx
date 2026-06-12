import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { faqAPI } from '../../utils/api';

const categories = ['Products', 'Orders', 'Membership', 'Support', 'General'];

export default function AdminFAQ() {
  const [faqs, setFAQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
  });
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

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

  const handleResetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'General',
    });
    setEditingId(null);
  };

  const handleEdit = (faq) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    });
    setEditingId(faq._id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Question and answer are required');
      return;
    }

    try {
      if (editingId) {
        await faqAPI.update(editingId, formData);
      } else {
        await faqAPI.create(formData);
      }
      await fetchFAQs();
      handleResetForm();
      setError(null);
    } catch (err) {

      setError(err.response?.data?.error || 'Failed to save FAQ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      await faqAPI.delete(id);
      await fetchFAQs();
      setError(null);
    } catch {

      setError('Failed to delete FAQ');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">FAQ Management</h1>
        <p className="text-gray-600 mt-2">Create and manage frequently asked questions</p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit FAQ' : 'Add New FAQ'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question *
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Enter the FAQ question"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer *
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Enter the FAQ answer"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="gap-2">
                <Check className="h-4 w-4" />
                {editingId ? 'Update FAQ' : 'Create FAQ'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleResetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* FAQs List */}
      <Card>
        <CardHeader>
          <CardTitle>FAQ List</CardTitle>
          <CardDescription>{faqs.length} FAQs total</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Loading FAQs...</p>
          ) : faqs.length === 0 ? (
            <p className="text-gray-500">No FAQs yet. Create one to get started!</p>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => (
                <div key={faq._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === faq._id ? null : faq._id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start gap-3 flex-1 text-left">
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0 transition-transform ${
                          expandedId === faq._id ? 'rotate-180' : ''
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 break-words">{faq.question}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Category: <span className="font-medium">{faq.category}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(faq);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"
                        title="Edit FAQ"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(faq._id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Delete FAQ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </button>

                  {expandedId === faq._id && (
                    <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
