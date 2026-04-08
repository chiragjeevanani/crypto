import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const videoService = {
    processVideo: async ({ file, secondFile, trim, layout, rotation, splitRatio, music }) => {
        const formData = new FormData();
        formData.append('video', file);
        if (secondFile) formData.append('secondVideo', secondFile);
        formData.append('trim', JSON.stringify(trim));
        formData.append('layout', layout);
        formData.append('rotation', rotation || 0);
        formData.append('splitRatio', splitRatio || 50);
        if (music) formData.append('music', JSON.stringify(music));

        const response = await axios.post(`${API_URL}/video/process-video`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
