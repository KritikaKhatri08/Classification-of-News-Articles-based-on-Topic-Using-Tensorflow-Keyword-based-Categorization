import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Newspaper, Search, Brain, History } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { fetchNewsArticles } from '../lib/newsApi';
import { classifyNews } from '../lib/newsClassifier';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadialBarChart, RadialBar } from 'recharts';

const NEWS_CATEGORIES = ['Business', 'Technology', 'Politics', 'Sports', 'Entertainment', 'Health', 'Science'];

interface Article {
  title: string;
  description: string;
  urlToImage: string;
  category: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface ClassificationResult {
  category: string;
  confidence: number;
  predictions: Array<{
    category: string;
    confidence: number;
  }>;
}

const COLORS = {
  Technology: '#4f46e5',
  Business: '#06b6d4',
  Politics: '#ec4899',
  Sports: '#22c55e',
  Entertainment: '#f59e0b',
  Health: '#ef4444',
  Science: '#8b5cf6'
};

const Home = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchCategory, setSearchCategory] = useState('');
  const [classificationText, setClassificationText] = useState('');
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'bar' | 'radial'>('bar');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async (category?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newsArticles = await fetchNewsArticles(category);
      setArticles(newsArticles);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArticleClick = async (article: Article) => {
    try {
      const { error: supabaseError } = await supabase.from('user_history').insert({
        user_id: user?.id,
        article_id: article.title,
        category: article.category,
        title: article.title,
        image_url: article.urlToImage,
        description: article.description
      });

      if (supabaseError) throw supabaseError;
      
      window.open(article.url, '_blank');
    } catch (err) {
      const error = err as Error;
      setError(`Failed to save article history: ${error.message}`);
    }
  };

  const classifyNewsText = async () => {
    if (!classificationText.trim() || isClassifying) return;

    setIsClassifying(true);
    setError(null);
    try {
      const result = classifyNews(classificationText);
      setClassificationResult(result);
    } catch (err) {
      const error = err as Error;
      setError(`Classification failed: ${error.message}`);
    } finally {
      setIsClassifying(false);
    }
  };

  const renderConfidenceChart = () => {
    if (!classificationResult) return null;

    const data = classificationResult.predictions.map(pred => ({
      ...pred,
      fill: COLORS[pred.category as keyof typeof COLORS]
    }));

    if (selectedView === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fill: '#4B5563', fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              label={{
                value: 'Confidence (%)',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#4B5563' }
              }}
              tick={{ fill: '#4B5563' }}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Confidence']}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #E5E7EB',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar
              dataKey="confidence"
              animationDuration={1000}
              label={{
                position: 'top',
                formatter: (value: number) => `${value.toFixed(1)}%`,
                fill: '#4B5563',
                fontSize: 12
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <RadialBarChart
          innerRadius="30%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={-180}
        >
          <RadialBar
            label={{
              fill: '#4B5563',
              position: 'insideStart',
              formatter: (value: number) => `${value.toFixed(1)}%`
            }}
            background
            dataKey="confidence"
            angleAxisId={0}
          />
          <Legend
            iconSize={10}
            width={120}
            height={140}
            layout="vertical"
            verticalAlign="middle"
            align="right"
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Confidence']}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #E5E7EB',
              borderRadius: '6px'
            }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Newspaper className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">News Classification</h1>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <History className="h-5 w-5" />
          Dashboard
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by category..."
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => fetchNews(searchCategory)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Search
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {NEWS_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSearchCategory(category);
                  fetchNews(category);
                }}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200"
              >
                {category}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="grid gap-6">
              {articles.map((article, index) => (
                <article
                  key={index}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleArticleClick(article)}
                >
                  <img
                    src={article.urlToImage}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800';
                    }}
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-block px-2 py-1 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-full">
                        {article.category}
                      </span>
                      <span className="text-sm text-gray-500">{article.source}</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h2>
                    <p className="text-gray-600 mb-4">{article.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                      <span className="text-indigo-600 hover:text-indigo-800">Read more →</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-semibold">News Classification</h2>
            </div>
            {classificationResult && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedView('bar')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedView === 'bar'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Bar Chart
                </button>
                <button
                  onClick={() => setSelectedView('radial')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedView === 'radial'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Radial Chart
                </button>
              </div>
            )}
          </div>

          <textarea
            value={classificationText}
            onChange={(e) => setClassificationText(e.target.value)}
            placeholder="Paste news article text here for classification..."
            className="w-full h-40 p-4 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />

          <button
            onClick={classifyNewsText}
            disabled={!classificationText || isClassifying}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isClassifying ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Classifying...
              </>
            ) : (
              'Classify Text'
            )}
          </button>

          {classificationResult && (
            <div className="mt-6 space-y-6">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-900 mb-2">Classification Result:</h3>
                <p className="text-indigo-800 text-lg font-semibold">
                  Category: {classificationResult.category}
                </p>
                <p className="text-indigo-800">
                  Confidence: {classificationResult.confidence.toFixed(1)}%
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Category Distribution:</h3>
                {renderConfidenceChart()}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;