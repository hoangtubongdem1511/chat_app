import { useEffect } from 'react';
import getSocket from '../libs/socket';
import useActiveList from './useActiveList';

const usePresence = () => {
  const { set, add, remove } = useActiveList();

  useEffect(() => {
    const socket = getSocket();

    const onList = ({ userIds }: { userIds: string[] }) => {
      set(userIds);
    };

    const onOnline = ({ userId }: { userId: string }) => {
      add(userId);
    };

    const onOffline = ({ userId }: { userId: string }) => {
      remove(userId);
    };

    socket.on('presence:list', onList);
    socket.on('presence:online', onOnline);
    socket.on('presence:offline', onOffline);

    return () => {
      socket.off('presence:list', onList);
      socket.off('presence:online', onOnline);
      socket.off('presence:offline', onOffline);
    };
  }, [set, add, remove]);
};

export default usePresence;
