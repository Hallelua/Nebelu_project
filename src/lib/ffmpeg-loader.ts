declare global {
  interface Window {
    FFmpeg: {
      createFFmpeg: (options: any) => any;
      fetchFile: (file: File | string) => Promise<Uint8Array>;
    };
  }
}

export const loadFFmpeg = async () => {
  try {
    // Check if FFmpeg is already loaded
    if (window.FFmpeg) {
      console.log('FFmpeg already loaded, reusing instance');
      return {
        createFFmpeg: window.FFmpeg.createFFmpeg,
        fetchFile: window.FFmpeg.fetchFile
      };
    }

    // Check if browser supports required features
    if (!window.SharedArrayBuffer) {
      throw new Error('SharedArrayBuffer is not supported. Please use a modern browser with cross-origin isolation enabled.');
    }

    console.log('Loading FFmpeg script...');
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.2/dist/ffmpeg.min.js";
      
      script.onload = () => {
        console.log('FFmpeg script loaded successfully');
        if (!window.FFmpeg) {
          reject(new Error('FFmpeg failed to initialize after script load'));
          return;
        }
        resolve({
          createFFmpeg: window.FFmpeg.createFFmpeg,
          fetchFile: window.FFmpeg.fetchFile
        });
      };
      
      script.onerror = (error) => {
        console.error('Failed to load FFmpeg script:', error);
        reject(new Error('Failed to load FFmpeg.wasm script'));
      };

      document.body.appendChild(script);
    });
  } catch (error) {
    console.error('Error in loadFFmpeg:', error);
    throw error;
  }
};