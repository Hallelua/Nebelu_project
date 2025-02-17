import { loadFFmpeg } from './ffmpeg-loader';

let ffmpegInstance: any = null;

export async function getFFmpeg() {
  try {
    if (ffmpegInstance) {
      console.log('Reusing existing FFmpeg instance');
      return ffmpegInstance;
    }

    console.log('Initializing new FFmpeg instance...');
    const { createFFmpeg, fetchFile } = await loadFFmpeg();
    
    // Create FFmpeg instance with proper configuration
    ffmpegInstance = createFFmpeg({
      log: true,
      corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
    });
    
    console.log('Loading FFmpeg WASM...');
    await ffmpegInstance.load();
    
    console.log('FFmpeg instance ready');
    return ffmpegInstance;
  } catch (error) {
    console.error('Error initializing FFmpeg:', error);
    throw new Error(`Failed to initialize FFmpeg: ${error.message}`);
  }
}

export async function trimMedia(file: File, start: number, end: number): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();
    const { fetchFile } = await loadFFmpeg();

    const inputFileName = 'input' + (file.type.includes('video') ? '.mp4' : '.mp3');
    const outputFileName = 'output' + (file.type.includes('video') ? '.mp4' : '.mp3');

    ffmpeg.FS('writeFile', inputFileName, await fetchFile(file));

    await ffmpeg.run(
      '-i', inputFileName,
      '-ss', start.toString(),
      '-to', end.toString(),
      '-c', 'copy',
      outputFileName
    );

    const data = ffmpeg.FS('readFile', outputFileName);
    return new Blob([data.buffer], { type: file.type });
  } catch (error) {
    console.error('Error trimming media:', error);
    throw new Error(`Failed to trim media: ${error.message}`);
  }
}

export async function addBackgroundToAudio(audioFile: File, imageFile: File): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();
    const { fetchFile } = await loadFFmpeg();

    // Write input files
    ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(audioFile));
    ffmpeg.FS('writeFile', 'image.jpg', await fetchFile(imageFile));

    // Use a more robust FFmpeg command with explicit duration
    await ffmpeg.run(
      '-i', 'audio.mp3',
      '-i', 'image.jpg',
      '-filter_complex', '[1:v]scale=1280:720,setsar=1:1[v];[v]loop=loop=-1:size=1[vout]',
      '-map', '[vout]',
      '-map', '0:a',
      '-shortest',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-tune', 'stillimage',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      'output.mp4'
    );

    const data = ffmpeg.FS('readFile', 'output.mp4');
    
    // Clean up files
    ['audio.mp3', 'image.jpg', 'output.mp4'].forEach(file => {
      try {
        ffmpeg.FS('unlink', file);
      } catch (e) {
        console.warn(`Could not unlink file ${file}:`, e);
      }
    });

    return new Blob([data.buffer], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error adding background to audio:', error);
    throw new Error(`Failed to add background to audio: ${error.message}`);
  }
}

export async function addBackgroundMusic(videoFile: File, audioFile: File): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();
    const { fetchFile } = await loadFFmpeg();

    ffmpeg.FS('writeFile', 'video.mp4', await fetchFile(videoFile));
    ffmpeg.FS('writeFile', 'audio.mp3', await fetchFile(audioFile));

    await ffmpeg.run(
      '-i', 'video.mp4',
      '-i', 'audio.mp3',
      '-filter_complex', '[1:a]volume=0.3[a1];[0:a][a1]amix=inputs=2:duration=first[aout]',
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      'output.mp4'
    );

    const data = ffmpeg.FS('readFile', 'output.mp4');
    
    // Clean up files
    ['video.mp4', 'audio.mp3', 'output.mp4'].forEach(file => {
      try {
        ffmpeg.FS('unlink', file);
      } catch (e) {
        console.warn(`Could not unlink file ${file}:`, e);
      }
    });

    return new Blob([data.buffer], { type: 'video/mp4' });
  } catch (error) {
    console.error('Error adding background music:', error);
    throw new Error(`Failed to add background music: ${error.message}`);
  }
}