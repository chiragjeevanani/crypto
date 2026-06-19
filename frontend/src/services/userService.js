import { searchService } from '../modules/user/services/searchService';

const userService = {
  searchUsers: async (query) => {
    return await searchService.search(query);
  }
};

export default userService;
