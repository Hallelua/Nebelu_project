import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MediaPlayer } from '../components/MediaPlayer';
import { formatFileSize } from '../lib/utils';

type PublicVideo = {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  duration: number;
  views: number;
  created_at: string;
};

export function LandingPage() {
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const query = supabase
          .from('public_videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchQuery) {
          query.ilike('title', `%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setVideos(data || []);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <img
                src="/nebelu-logo.svg"
                alt="Nebelu Logo"
                className="h-12 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/signin"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Nebelu
          </h1>
          <p className="text-xl text-gray-600">
            Discover and share amazing videos
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-300">
            <div className="px-4">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="flex-1 px-4 py-3 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <MediaPlayer url={video.url} type="video" />
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{video.views} views</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}

            {videos.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No videos found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
