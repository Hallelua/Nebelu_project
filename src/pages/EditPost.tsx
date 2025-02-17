import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { UserSelect } from '../components/UserSelect';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';

export function EditPost() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data: post, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (post.user_id !== user?.id) {
          toast.error('You can only edit your own posts');
          navigate('/');
          return;
        }

        setTitle(post.title);
        setBody(post.body);
        setIsPublic(post.is_public);
        setAllowedUsers(post.allowed_users || []);
      } catch (error) {
        console.error('Error fetching post:', error);
        navigate('/');
      }
    }

    fetchPost();
  }, [id, user?.id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title,
          body,
          is_public: isPublic,
          allowed_users: isPublic ? null : allowedUsers,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Post updated successfully!');
      navigate(`/posts/${id}`);
    } catch (error) {
      toast.error('Error updating post');
      console.error('Error updating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Post</h1>
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

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/posts/${id}`)}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}