const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const processVideo = async ({ file, secondFile, trim, layout, rotation, splitRatio = 50, music }) => {
    // Convert to forward slashes for FFmpeg compatibility on Windows
    const inputPath = file.path.replace(/\\/g, '/');
    const outputName = `processed-${Date.now()}.mp4`;
    const uploadsDir = path.join(__dirname, '..', 'uploads').replace(/\\/g, '/');
    const outputPath = path.join(uploadsDir, outputName).replace(/\\/g, '/');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

        // Rotation
        const rFilters = {
            90: 'transpose=1',
            180: 'transpose=1,transpose=1',
            270: 'transpose=2'
        };
        const rotStr = rFilters[rotation] ? rFilters[rotation] + ',' : '';

        // Trim
        if (trim && (trim.start !== undefined || trim.end !== undefined)) {
            const start = trim.start || 0;
            const duration = (trim.end || 0) - start;
            if (duration > 0) {
                command = command.setStartTime(start).setDuration(duration);
            }
        }

        let audioInputs = ['0:a?'];

        if (secondFile && (layout === 'side-by-side' || layout === 'top-bottom')) {
            const secondInputPath = secondFile.path.replace(/\\/g, '/');
            command.input(secondInputPath);
            audioInputs.push('1:a?');

            const ratio = splitRatio / 100;
            const invRatio = 1 - ratio;

            // Define canvas 720x1280 (standard vertical)
            const complexFilter = layout === 'side-by-side' 
                ? `[0:v]${rotStr}scale=w='trunc(1280*a/2)*2':h=1280,crop='trunc(720*${ratio}/2)*2':1280[v0];[1:v]scale=w='trunc(1280*a/2)*2':h=1280,crop='trunc(720*${invRatio}/2)*2':1280[v1];[v0][v1]hstack=inputs=2,format=yuv420p[v]` 
                : `[0:v]${rotStr}scale=w=720:h='trunc(720/a/2)*2',crop=720:'trunc(1280*${ratio}/2)*2'[v0];[1:v]scale=w=720:h='trunc(720/a/2)*2',crop=720:'trunc(1280*${invRatio}/2)*2'[v1];[v0][v1]vstack=inputs=2,format=yuv420p[v]`;
            
            command.complexFilter([complexFilter]);
            command.map('[v]');
        } else {
            if (rFilters[rotation]) {
                command.videoFilters(rFilters[rotation].split(','));
            }
            command.outputOptions('-pix_fmt yuv420p');
        }

        // Handle Music mixing
        if (music && music.audioUrl) {
            command.input(music.audioUrl);
            const musicInputIndex = secondFile ? 2 : 1;
            
            // Limit music to video duration and loop if needed (simplified: just take and mix)
            // mix all available audio inputs
            const amixFilter = audioInputs.length === 1 
                ? `[0:a][${musicInputIndex}:a]amix=inputs=2:duration=first:dropout_transition=2[a]`
                : `[0:a][1:a][${musicInputIndex}:a]amix=inputs=3:duration=first:dropout_transition=2[a]`;
             
            command.complexFilter([amixFilter]);
            command.map('[a]');
        } else {
            // Map original audios if no background music
            audioInputs.forEach((map) => command.outputOptions(`-map ${map}`));
        }

        command
            .videoCodec('libx264')
            .audioCodec('aac')
            .format('mp4')
            .on('start', (cmd) => console.log('[FFmpeg PRO] Executing:', cmd))
            .on('error', (err, stdout, stderr) => {
                console.error('[FFmpeg PRO] Error:', err.message);
                console.error('[FFmpeg PRO] Stderr:', stderr);
                reject(err);
            })
            .on('end', () => {
                console.log('[FFmpeg PRO] Processing complete');
                resolve({
                    url: `/uploads/${outputName}`,
                    path: outputPath,
                    filename: outputName
                });
            })
            .save(outputPath);
    });
};

module.exports = { processVideo };
