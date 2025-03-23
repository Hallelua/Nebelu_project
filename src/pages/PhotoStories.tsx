import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { getGravatarUrl } from '../lib/utils';
import { Share2, Clock } from 'lucide-react';
import { toast } from 'sonner';

type PhotoStory = {
  id: string;
  created_at: string;
  user_id: string;
  photo_url: string;
  caption: string;
  expires_at: string;
  public_url_id: string;
  user_email?: string;
};

export function PhotoStories() {
  const [stories, setStories] = useState<PhotoStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
    // Refresh stories every minute to update expiry times
    const interval = setInterval(fetchStories, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStories() {
    try {
      const { data: storiesData, error: storiesError } = await supabase
        .from('photo_stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      // Fetch user emails for each story
      const storiesWithUsers = await Promise.all(
        (storiesData || []).map(async (story) => {
          const { data: userData } = await supabase
            .from('auth.users')
            .select('email')
            .eq('id', story.user_id)
            .single();

          return {
            ...story,
            user_email: userData?.email,
          };
        })
      );

      setStories(storiesWithUsers);
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  }

  const copyPublicUrl = (publicUrlId: string) => {
    const url = `${window.location.origin}/s/${publicUrlId}`;
    navigator.clipboard.writeText(url);
    toast.success('Public URL copied to clipboard!');
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Photo Stories</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div key={story.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={story.photo_url}
                alt={story.caption}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <img
                    src={getGravatarUrl(story.user_email || '')}
                    alt={story.user_email}
                    className="h-8 w-8 rounded-full mr-3"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{story.user_email}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(story.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{story.caption}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Expires in {getTimeRemaining(story.expires_at)}</span>
                  </div>
                  <button
                    onClick={() => copyPublicUrl(story.public_url_id)}
                    className="flex items-center text-primary hover:text-primary/80"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {stories.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500">No photo stories yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
