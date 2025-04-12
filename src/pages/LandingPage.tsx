import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MediaPlayer } from '../components/MediaPlayer';
import { formatFileSize, getGravatarUrl } from '../lib/utils';
import { format } from 'date-fns';

type PublicVideo = {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  duration: number;
  views: number;
  created_at: string;
  public_url_id: string;
};

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

export function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('v');
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [stories, setStories] = useState<PhotoStory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [featuredVideo, setFeaturedVideo] = useState<PublicVideo | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        // If there's a video ID in the URL, fetch that video first
        if (videoId) {
          const { data: videoData } = await supabase
            .from('public_videos')
            .select('*')
            .eq('public_url_id', videoId)
            .single();

          if (videoData) {
            setFeaturedVideo(videoData);
            // Increment view count
            await supabase
              .from('public_videos')
              .update({ views: videoData.views + 1 })
              .eq('id', videoData.id);
          }
        }

        // Fetch videos
        const videoQuery = supabase
          .from('public_videos')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchQuery) {
          videoQuery.ilike('title', `%${searchQuery}%`);
        }

        if (videoId) {
          videoQuery.neq('public_url_id', videoId);
        }

        const { data: videoData, error: videoError } = await videoQuery;
        if (videoError) throw videoError;
        setVideos(videoData || []);

        // Fetch photo stories
        const { data: storyData, error: storyError } = await supabase
          .from('photo_stories')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);

        if (storyError) throw storyError;

        // Fetch user emails for stories
        const storiesWithUsers = await Promise.all(
          (storyData || []).map(async (story) => {
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
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [searchQuery, videoId]);

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

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!videoId && (
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Nebelu
              </h1>
              <p className="text-xl text-gray-600">
                Discover and share amazing videos and stories
              </p>
            </div>
          )}

          {featuredVideo && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Video</h2>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <MediaPlayer url={featuredVideo.url} type="video" />
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {featuredVideo.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{featuredVideo.views} views</span>
                    <span className="mx-2">•</span>
                    <span>{format(new Date(featuredVideo.created_at), 'PPp')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Photo Stories Section */}
          {stories.length > 0 && (
            <div className="mb-16">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Latest Stories</h2>
                <button
                  onClick={() => navigate('/stories')}
                  className="inline-flex items-center text-primary hover:text-primary/80"
                >
                  View all stories
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stories.map((story) => (
                  <Link
                    key={story.id}
                    to={`/s/${story.public_url_id}`}
                    className="block group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={story.photo_url}
                      alt={story.caption}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <div className="flex items-center">
                        <img
                          src={getGravatarUrl(story.user_email || '')}
                          alt={story.user_email}
                          className="h-6 w-6 rounded-full border-2 border-white"
                        />
                        <p className="ml-2 text-sm text-white truncate">
                          {story.user_email?.split('@')[0]}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

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
                      <span>{format(new Date(video.created_at), 'PPp')}</span>
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
        </div>
      </main>
    </div>
  );
}
