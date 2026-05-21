import { searchService } from '../modules/user/services/searchService';

const userService = {
  searchUsers: async (query) => {
    return await searchService.searchGlobal(query);
  }
};

export default userService;
