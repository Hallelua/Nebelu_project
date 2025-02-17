import { useState, useRef, useEffect } from 'react';
import { Loader2, Upload, Image as ImageIcon, Music } from 'lucide-react';
import { toast } from 'sonner';
import { trimMedia, addBackgroundToAudio, addBackgroundMusic } from '../lib/ffmpeg';

type Props = {
  file: File;
  onProcessed: (processedFile: File) => void;
  onCancel: () => void;
};

export function MediaEditor({ file, onProcessed, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  const isVideo = file.type.includes('video');
  const isAudio = file.type.includes('audio');

  useEffect(() => {
    const element = isVideo ? document.createElement('video') : document.createElement('audio');
    element.src = URL.createObjectURL(file);
    element.onloadedmetadata = () => {
      setDuration(element.duration);
      setTrimEnd(element.duration);
    };
  }, [file, isVideo]);

  const handleProcess = async () => {
    try {
      setLoading(true);

      // First trim the media if needed
      let processedFile = file;
      if (trimStart > 0 || trimEnd < duration) {
        const trimmedBlob = await trimMedia(file, trimStart, trimEnd);
        processedFile = new File([trimmedBlob], file.name, { type: trimmedBlob.type });
      }

      // Then add background if specified
      if (backgroundFile) {
        if (isAudio) {
          const processedBlob = await addBackgroundToAudio(processedFile, backgroundFile);
          processedFile = new File([processedBlob], file.name.replace('.mp3', '.mp4'), { type: 'video/mp4' });
        } else if (isVideo) {
          const processedBlob = await addBackgroundMusic(processedFile, backgroundFile);
          processedFile = new File([processedBlob], file.name, { type: 'video/mp4' });
        }
      }

      onProcessed(processedFile);
    } catch (error) {
      console.error('Error processing media:', error);
      toast.error('Error processing media');
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isAudio && !file.type.startsWith('image/')) {
      toast.error('Please select an image file for audio background');
      return;
    }

    if (isVideo && !file.type.startsWith('audio/')) {
      toast.error('Please select an audio file for video background');
      return;
    }

    setBackgroundFile(file);
  };

  return (
    <div className="space-y-6">
      {isVideo ? (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={URL.createObjectURL(file)}
          className="w-full rounded-lg"
          controls
        />
      ) : (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={URL.createObjectURL(file)}
          className="w-full"
          controls
        />
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trim Media
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min={0}
              max={duration}
              value={trimStart}
              onChange={(e) => setTrimStart(parseFloat(e.target.value))}
              className="flex-1"
            />
            <input
              type="range"
              min={trimStart}
              max={duration}
              value={trimEnd}
              onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
              className="flex-1"
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{trimStart.toFixed(1)}s</span>
            <span>{trimEnd.toFixed(1)}s</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAudio ? 'Background Image' : 'Background Music'}
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              {isAudio ? (
                <ImageIcon className="h-5 w-5 mr-2" />
              ) : (
                <Music className="h-5 w-5 mr-2" />
              )}
              Choose {isAudio ? 'Image' : 'Music'}
              <input
                type="file"
                className="hidden"
                accept={isAudio ? "image/*" : "audio/*"}
                onChange={handleBackgroundSelect}
              />
            </label>
            {backgroundFile && (
              <span className="text-sm text-gray-500">
                {backgroundFile.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProcess}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Process & Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}