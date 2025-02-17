import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { getGravatarUrl } from '../lib/utils';
import type { Database } from '../types/supabase';

type Post = Database['public']['Tables']['posts']['Row'] & {
  user_email?: string;
};

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Fetch user emails for each post
        const postsWithUsers = await Promise.all(
          (postsData || []).map(async (post) => {
            const { data: userData } = await supabase
              .from('auth.users')
              .select('email')
              .eq('id', post.user_id)
              .single();

            return {
              ...post,
              user_email: userData?.email,
            };
          })
        );

        setPosts(postsWithUsers);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new post.
            </p>
            <div className="mt-6">
              <Link
                to="/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
              >
                Create your first post
              </Link>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={getGravatarUrl(post.user_email || '')}
                    alt={`${post.user_email}'s avatar`}
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {post.user_email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(post.created_at), 'PPP')}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/posts/${post.id}`}
                  className="mt-4 block hover:text-primary"
                >
                  <h2 className="text-xl font-semibold text-gray-900">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-base text-gray-500 line-clamp-3">
                    {post.body}
                  </p>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}