import { useUserStore } from '../modules/user/store/useUserStore';

export const useAuth = () => {
  const user = useUserStore(s => s.user);
  return { user };
};
