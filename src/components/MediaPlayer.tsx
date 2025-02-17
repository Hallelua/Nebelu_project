import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

type Props = {
  url: string;
  type: 'audio' | 'video';
};

export function MediaPlayer({ url, type }: Props) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    setDuration(e.currentTarget.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    const mediaElement = document.getElementById('media-player') as HTMLMediaElement;
    if (mediaElement) {
      mediaElement.currentTime = time;
    }
  };

  const togglePlay = () => {
    const mediaElement = document.getElementById('media-player') as HTMLMediaElement;
    if (mediaElement) {
      if (playing) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
      setPlaying(!playing);
    }
  };

  const toggleMute = () => {
    const mediaElement = document.getElementById('media-player') as HTMLMediaElement;
    if (mediaElement) {
      mediaElement.muted = !muted;
      setMuted(!muted);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {type === 'video' ? (
        <video
          id="media-player"
          src={url}
          className="w-full rounded-lg"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
      ) : (
        <audio
          id="media-player"
          src={url}
          className="hidden"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}

      <div className="mt-4 space-y-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlay}
            className="p-2 text-gray-700 hover:text-gray-900 bg-gray-100 rounded-full"
          >
            {playing ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={toggleMute}
            className="p-2 text-gray-700 hover:text-gray-900 bg-gray-100 rounded-full"
          >
            {muted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
}