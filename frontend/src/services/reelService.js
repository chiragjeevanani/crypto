import { postService } from '../modules/user/services/postService';

const reelService = {
  uploadReel: async (formData) => {
    return await postService.createPost(formData);
  }
};

export default reelService;
