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

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Probe for audio streams
    const probe = (p) => new Promise((res) => {
        ffmpeg.ffprobe(p, (err, data) => res(data || { streams: [] }));
    });

    const info = await probe(inputPath);
    const hasAudio = info.streams.some(s => s.codec_type === 'audio');

    let secondHasAudio = false;
    if (secondFile) {
        const info2 = await probe(secondFile.path.replace(/\\/g, '/'));
        secondHasAudio = info2.streams.some(s => s.codec_type === 'audio');
    }

    return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath);

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

        let complexFilters = [];
        let videoMap = '0:v';
        let audioMap = hasAudio ? '0:a' : null;

        // Layouts (Video processing)
        if (secondFile && (layout === 'side-by-side' || layout === 'top-bottom')) {
            const secondInputPath = secondFile.path.replace(/\\/g, '/');
            command.input(secondInputPath);

            const ratio = splitRatio / 100;
            const invRatio = 1 - ratio;

            const layoutFilter = layout === 'side-by-side' 
                ? `[0:v]${rotStr}scale=w='trunc(1280*a/2)*2':h=1280,crop='trunc(720*${ratio}/2)*2':1280[v0];[1:v]scale=w='trunc(1280*a/2)*2':h=1280,crop='trunc(720*${invRatio}/2)*2':1280[v1];[v0][v1]hstack=inputs=2,format=yuv420p[vout]` 
                : `[0:v]${rotStr}scale=w=720:h='trunc(720/a/2)*2',crop=720:'trunc(1280*${ratio}/2)*2'[v0];[1:v]scale=w=720:h='trunc(720/a/2)*2',crop=720:'trunc(1280*${invRatio}/2)*2'[v1];[v0][v1]vstack=inputs=2,format=yuv420p[vout]`;
            
            complexFilters.push(layoutFilter);
            videoMap = '[vout]';
        } else if (rFilters[rotation]) {
             complexFilters.push(`[0:v]${rFilters[rotation]},format=yuv420p[vout]`);
             videoMap = '[vout]';
        }

        // Music Mixing (Audio processing)
        if (music && music.audioUrl) {
            command.input(music.audioUrl);
            const musicIdx = secondFile ? 2 : 1;
            
            let audioInputLabels = [];
            if (hasAudio) audioInputLabels.push('[0:a]');
            if (secondFile && secondHasAudio) audioInputLabels.push('[1:a]');
            audioInputLabels.push(`[${musicIdx}:a]`);

            const amixFilter = `${audioInputLabels.join('')}amix=inputs=${audioInputLabels.length}:duration=first:dropout_transition=2[aout]`;
            complexFilters.push(amixFilter);
            audioMap = '[aout]';
        } else if (secondFile && secondHasAudio) {
            // Mix original audios from both videos
            const amixFilter = `[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
            complexFilters.push(amixFilter);
             audioMap = '[aout]';
        }

        if (complexFilters.length > 0) {
            command.complexFilter(complexFilters.join(';'));
        }

        command.map(videoMap);
        if (audioMap) {
            command.map(audioMap);
        } else {
            // If no audio at all, output without audio track or explicitly copy silence if needed
            // For simplicity, just don't map audio.
        }

        command
            .videoCodec('libx264')
            .audioCodec('aac')
            .format('mp4')
            .outputOptions('-pix_fmt yuv420p')
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
