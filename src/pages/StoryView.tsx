import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { getGravatarUrl } from '../lib/utils';

type PhotoStory = {
  id: string;
  created_at: string;
  user_id: string;
  photo_url: string;
  caption: string;
  expires_at: string;
  user_email?: string;
};

export function StoryView() {
  const { id } = useParams();
  const [story, setStory] = useState<PhotoStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStory() {
      try {
        const { data: storyData, error: storyError } = await supabase
          .from('photo_stories')
          .select('*')
          .eq('public_url_id', id)
          .single();

        if (storyError) throw storyError;

        // Fetch user email
        const { data: userData } = await supabase
          .from('auth.users')
          .select('email')
          .eq('id', storyData.user_id)
          .single();

        setStory({
          ...storyData,
          user_email: userData?.email,
        });
      } catch (error) {
        console.error('Error fetching story:', error);
        setError('Story not found or has expired');
      } finally {
        setLoading(false);
      }
    }

    fetchStory();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
          <Link
            to="/"
            className="text-primary hover:text-primary/80 flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to home
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <img
            src={story.photo_url}
            alt={story.caption}
            className="w-full max-h-[70vh] object-contain bg-black"
          />
          
          <div className="p-6">
            <div className="flex items-center mb-6">
              <img
                src={getGravatarUrl(story.user_email || '')}
                alt={story.user_email}
                className="h-10 w-10 rounded-full mr-4"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{story.user_email}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(story.created_at), 'PPp')}
                </p>
              </div>
            </div>

            <p className="text-gray-700 text-lg">{story.caption}</p>
            
            <p className="mt-4 text-sm text-gray-500">
              Expires {format(new Date(story.expires_at), 'PPp')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
