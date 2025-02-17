import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { UserSelect } from '../components/UserSelect';
import { MediaUploader } from '../components/MediaUploader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';

export function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [postId, setPostId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.from('posts').insert({
        title,
        body,
        user_id: user.id,
        is_public: isPublic,
        allowed_users: isPublic ? null : allowedUsers,
      }).select().single();

      if (error) throw error;

      setPostId(data.id);
      toast.success('Post created successfully! You can now add media.');
    } catch (error) {
      toast.error('Error creating post');
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUploadComplete = () => {
    navigate('/');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Post</h1>
        {!postId ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Enter post title"
              />
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                id="body"
                required
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Write your post content here..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                  Make this post public
                </label>
              </div>

              {!isPublic && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Share with specific users
                  </label>
                  <UserSelect
                    value={allowedUsers}
                    onChange={setAllowedUsers}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Post'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700">
                Your post has been created! You can now add media files to your post.
              </p>
            </div>
            <MediaUploader
              postId={postId}
              onUploadComplete={handleMediaUploadComplete}
            />
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                Skip adding media
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}