import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Trash2, Edit2, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { MediaPlayer } from '../components/MediaPlayer';
import { MediaUploader } from '../components/MediaUploader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';
import { getGravatarUrl } from '../lib/utils';
import type { Database } from '../types/supabase';

type Post = Database['public']['Tables']['posts']['Row'] & {
  user_email?: string;
  media_clips?: Database['public']['Tables']['media_clips']['Row'][];
};

export function PostView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [canViewPost, setCanViewPost] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*, media_clips(*)')
          .eq('id', id)
          .single();

        if (postError) throw postError;

        // Fetch user email
        const { data: userData } = await supabase
          .from('auth.users')
          .select('email')
          .eq('id', postData.user_id)
          .single();

        const post = {
          ...postData,
          user_email: userData?.email,
        };

        setPost(post);
        
        // Check if user can view the post
        const canView = post.is_public || 
                       post.user_id === user?.id || 
                       (post.allowed_users && post.allowed_users.includes(user?.id || ''));
        setCanViewPost(canView);
      } catch (error) {
        console.error('Error fetching post:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, navigate, user?.id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Post deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error deleting post');
      console.error('Error deleting post:', error);
    }
  };

  const handleUploadComplete = async () => {
    // Refresh post data to show new media
    const { data, error } = await supabase
      .from('posts')
      .select('*, media_clips(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error refreshing post:', error);
      return;
    }

    setPost(prev => prev ? { ...prev, media_clips: data.media_clips } : data);
    setShowReplyForm(false);
    toast.success('Reply added successfully');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!post || !canViewPost) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to posts
          </button>
          {user?.id === post.user_id && (
            <div className="flex items-center space-x-4">
              <Link
                to={`/posts/${id}/edit`}
                className="flex items-center text-blue-600 hover:text-blue-700"
              >
                <Edit2 className="h-5 w-5 mr-2" />
                Edit post
              </Link>
              <button
                onClick={handleDelete}
                className="flex items-center text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete post
              </button>
            </div>
          )}
        </div>

        <article className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center mb-8">
              <img
                className="h-12 w-12 rounded-full"
                src={getGravatarUrl(post.user_email || '')}
                alt={`${post.user_email}'s avatar`}
              />
              <div className="ml-4">
                <p className="text-lg font-medium text-gray-900">
                  {post.user_email}
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(post.created_at), 'PPP')}
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{post.body}</p>
            </div>

            {post.media_clips && post.media_clips.length > 0 && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Media</h2>
                {post.media_clips.map((clip) => (
                  <div key={clip.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {clip.user_id === post.user_id ? (
                        <span className="text-sm text-gray-500">Original post</span>
                      ) : (
                        <span className="text-sm text-blue-600">Reply</span>
                      )}
                    </div>
                    <MediaPlayer
                      url={clip.url}
                      type={clip.type}
                    />
                  </div>
                ))}
              </div>
            )}

            {user && (
              <div className="mt-8 border-t pt-6">
                {showReplyForm ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Add a media reply</h3>
                    <MediaUploader
                      postId={post.id}
                      onUploadComplete={handleUploadComplete}
                    />
                    <button
                      onClick={() => setShowReplyForm(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowReplyForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                  >
                    <MessageSquarePlus className="h-5 w-5 mr-2" />
                    Add media reply
                  </button>
                )}
              </div>
            )}
          </div>
        </article>
      </div>
    </Layout>
  );
}