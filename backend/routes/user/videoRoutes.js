const express = require('express');
const router = express.Router();
const { upload } = require('../../utils/upload');
const { processVideo } = require('../../services/videoProcessor');
const path = require('path');
const fs = require('fs');

router.post('/process-video', upload.fields([{ name: 'video', maxCount: 1 }, { name: 'secondVideo', maxCount: 1 }]), async (req, res) => {
    try {
        const { trim, layout, rotation, splitRatio, music } = req.body;
        const video = req.files['video'] ? req.files['video'][0] : null;
        const secondVideo = req.files['secondVideo'] ? req.files['secondVideo'][0] : null;

        if (!video) {
            return res.status(400).json({ success: false, message: 'No video provided' });
        }

        const parsedTrim = trim ? JSON.parse(trim) : null;
        
        const result = await processVideo({
            file: video,
            secondFile: secondVideo,
            trim: parsedTrim,
            layout: layout || 'single',
            rotation: rotation ? parseInt(rotation) : 0,
            splitRatio: splitRatio ? parseInt(splitRatio) : 50,
            music: music ? JSON.parse(music) : null
        });

        // Get full URL for frontend
        const protocol = req.protocol;
        const host = req.get('host');
        const fullUrl = `${protocol}://${host}${result.url}`;

        res.json({
            success: true,
            url: fullUrl,
            filename: result.filename
        });
    } catch (error) {
        console.error('Processing failed:', error);
        res.status(500).json({ success: false, message: 'Video processing failed', error: error.message });
    }
});

module.exports = router;
