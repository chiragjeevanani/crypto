import { musicService } from '../modules/user/services/musicService';

const audioService = {
  getAllAudios: async () => {
    const response = await musicService.getActiveMusic(1, "");
    return response.music || response.data || response || [];
  }
};

export default audioService;
