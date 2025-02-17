import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { formatFileSize } from '../lib/utils';
import { MediaEditor } from './MediaEditor';

type Props = {
  postId: string;
  onUploadComplete: () => void;
};

export function MediaUploader({ postId, onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 
                       'video/mp4', 'video/webm', 'video/ogg'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please select a valid audio (MP3, WAV, OGG) or video (MP4, WebM, OGG) file');
      return;
    }

    // Check file size (max 100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      toast.error('File size must be less than 100MB');
      return;
    }

    setFile(selectedFile);
    setUploadProgress(0);
    setShowEditor(true);
  };

  const handleUpload = async (processedFile: File) => {
    setShowEditor(false);
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Get file duration
      const duration = await getMediaDuration(processedFile);
      
      // Create unique filename
      const timestamp = new Date().getTime();
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `media/${fileName}`;

      // Upload to Supabase Storage with progress tracking
      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          },
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Create media clip record
      const { error: dbError } = await supabase.from('media_clips').insert({
        post_id: postId,
        url: publicUrl,
        type: processedFile.type.startsWith('audio/') ? 'audio' : 'video',
        duration: duration,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (dbError) throw dbError;

      toast.success('Media uploaded successfully');
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadComplete();
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast.error(error.message || 'Error uploading media');
    } finally {
      setUploading(false);
    }
  };

  const getMediaDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const element = file.type.startsWith('audio/') 
        ? document.createElement('audio')
        : document.createElement('video');
      
      element.preload = 'metadata';
      element.onloadedmetadata = () => resolve(element.duration);
      element.src = URL.createObjectURL(file);
    });
  };

  if (showEditor && file) {
    return (
      <MediaEditor
        file={file}
        onProcessed={handleUpload}
        onCancel={() => {
          setFile(null);
          setShowEditor(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-gray-500" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              Supported formats: MP3, WAV, OGG (audio) | MP4, WebM, OGG (video)
            </p>
            <p className="text-xs text-gray-500">Max file size: 100MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="audio/mp3,audio/mpeg,audio/wav,audio/ogg,video/mp4,video/webm,video/ogg"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {file && !showEditor && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="p-1 text-gray-500 hover:text-gray-700"
              disabled={uploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}