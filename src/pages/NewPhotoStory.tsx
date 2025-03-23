import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';
import { nanoid } from 'nanoid';

export function NewPhotoStory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !photo) return;

    setLoading(true);
    try {
      // Upload photo to storage
      const fileExt = photo.name.split('.').pop();
      const fileName = `${nanoid()}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, photo, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Calculate expiry time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create photo story record
      const { error: dbError } = await supabase.from('photo_stories').insert({
        user_id: user.id,
        photo_url: publicUrl,
        caption,
        expires_at: expiresAt.toISOString(),
        public_url_id: nanoid(10),
      });

      if (dbError) throw dbError;

      toast.success('Photo story created successfully!');
      navigate('/stories');
    } catch (error: any) {
      toast.error(error.message || 'Error creating photo story');
      console.error('Error creating photo story:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Create Photo Story</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                    >
                      <span className="sr-only">Remove photo</span>
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80">
                        <span>Upload a photo</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="caption" className="block text-sm font-medium text-gray-700">
              Caption
            </label>
            <textarea
              id="caption"
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Write a caption for your photo..."
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/stories')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !photo}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Creating...
                </>
              ) : (
                'Create Story'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
