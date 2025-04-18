import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Download, Loader, Share } from 'lucide-react';
import type { Post, MediaClip } from '../types';
import { MediaPlayer } from '../components/MediaPlayer';
import { format } from 'date-fns';
import { getFFmpeg } from '../lib/ffmpeg';
import { toast } from 'sonner';

export function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [mediaClips, setMediaClips] = useState<MediaClip[]>([]);
  const [merging, setMerging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, []);

  const fetchMediaClips = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('media_clips')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMediaClips(data || []);
      setSelectedPost(posts.find(p => p.id === postId) || null);
      setMergedVideoUrl(null); // Reset merged video URL when switching posts
    } catch (error) {
      console.error('Error fetching media clips:', error);
    }
  };

  const mergeClips = async () => {
    if (!mediaClips.length) return;
    setMerging(true);

    try {
      const ffmpeg = await getFFmpeg();
      const { fetchFile } = await import('@ffmpeg/util');

      // Download all clips
      for (let i = 0; i < mediaClips.length; i++) {
        const response = await fetch(mediaClips[i].url);
        const blob = await response.blob();
        const clipData = await fetchFile(blob);
        ffmpeg.FS('writeFile', `clip${i}.mp4`, clipData);
      }

      // Create concat file
      const concatContent = mediaClips
        .map((_, i) => `file 'clip${i}.mp4'`)
        .join('\n');
      ffmpeg.FS('writeFile', 'concat.txt', concatContent);

      // Merge clips
      await ffmpeg.run(
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '192k',
        'output.mp4'
      );

      // Get merged file
      const data = ffmpeg.FS('readFile', 'output.mp4');
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setMergedVideoUrl(url);

      // Download merged file
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged_${selectedPost?.title || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up FFmpeg files
      ['concat.txt', 'output.mp4', ...mediaClips.map((_, i) => `clip${i}.mp4`)].forEach(file => {
        try {
          ffmpeg.FS('unlink', file);
        } catch (e) {
          console.warn(`Could not unlink file ${file}:`, e);
        }
      });
    } catch (error) {
      console.error('Error merging clips:', error);
      toast.error('Error merging clips');
    } finally {
      setMerging(false);
    }
  };

  const shareToPublic = async () => {
    if (!mergedVideoUrl || !selectedPost) return;
    setSharing(true);

    try {
      // Upload to Supabase storage
      const timestamp = new Date().getTime();
      const fileName = `public/${timestamp}-${selectedPost.title.toLowerCase().replace(/\s+/g, '-')}.mp4`;

      const response = await fetch(mergedVideoUrl);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // Create public video record
      const { error: dbError } = await supabase.from('public_videos').insert({
        title: selectedPost.title,
        url: publicUrl,
        duration: mediaClips.reduce((total, clip) => total + clip.duration, 0),
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (dbError) throw dbError;

      toast.success('Video shared to public page successfully!');
    } catch (error) {
      console.error('Error sharing video:', error);
      toast.error('Error sharing video to public page');
    } finally {
      setSharing(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Media Dashboard</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Posts</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => fetchMediaClips(post.id)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedPost?.id === post.id
                        ? 'bg-primary/5 border-2 border-primary'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{post.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{post.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(post.created_at), 'PPP')}
                    </p>
                  </button>
                ))}

                {posts.length === 0 && (
                  <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">No posts found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {selectedPost ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Media Clips for "{selectedPost.title}"
                  </h2>
                  <div className="flex items-center space-x-4">
                    {mediaClips.length > 0 && !mergedVideoUrl && (
                      <button
                        onClick={mergeClips}
                        disabled={merging}
                        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                      >
                        {merging ? (
                          <>
                            <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                            Merging clips...
                          </>
                        ) : (
                          <>
                            <Download className="-ml-1 mr-2 h-5 w-5" />
                            Merge & Download
                          </>
                        )}
                      </button>
                    )}
                    {mergedVideoUrl && (
                      <button
                        onClick={shareToPublic}
                        disabled={sharing}
                        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {sharing ? (
                          <>
                            <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                            Sharing...
                          </>
                        ) : (
                          <>
                            <Share className="-ml-1 mr-2 h-5 w-5" />
                            Share to Public Page
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {mergedVideoUrl && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Merged Video Preview</h3>
                    <MediaPlayer url={mergedVideoUrl} type="video" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mediaClips.map((clip) => (
                    <div key={clip.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <MediaPlayer url={clip.url} type={clip.type} />
                      <div className="p-4">
                        <p className="text-sm text-gray-500">
                          Added {format(new Date(clip.created_at), 'PPP')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {mediaClips.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">No media clips found for this post</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">Select a post to view its media clips</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
