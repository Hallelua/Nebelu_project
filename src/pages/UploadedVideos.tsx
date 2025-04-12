import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { MediaPlayer } from '../components/MediaPlayer';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth';

type PublicVideo = {
  id: string;
  created_at: string;
  title: string;
  url: string;
  duration: number;
  views: number;
  public_url_id: string;
};

export function UploadedVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<PublicVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    try {
      const { data, error } = await supabase
        .from('public_videos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Error fetching videos');
    } finally {
      setLoading(false);
    }
  }

  const handleShare = (publicUrlId: string) => {
    const url = `${window.location.origin}?v=${publicUrlId}`;
    navigator.clipboard.writeText(url);
    toast.success('Video link copied to clipboard!');
  };

  const handleDelete = async (videoId: string, videoUrl: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      // Delete from storage
      const filePath = videoUrl.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('media')
          .remove([`public/${filePath}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('public_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.filter(v => v.id !== videoId));
      toast.success('Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Error deleting video');
    }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Your Uploaded Videos</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <MediaPlayer url={video.url} type="video" />
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {video.title}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{video.views} views</span>
                  <span>{format(new Date(video.created_at), 'PPp')}</span>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleShare(video.public_url_id)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                    title="Share video"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(video.id, video.url)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Delete video"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {videos.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500">No videos uploaded yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
