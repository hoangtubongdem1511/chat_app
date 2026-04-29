import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HiChat } from "react-icons/hi";
import { HiArrowLeftOnRectangle, HiUsers } from "react-icons/hi2";
import useConversation from "./useConversation";
import { useJwtAuth } from "../context/JwtAuthContext";

const useRoutes = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { conversationId } = useConversation();
    const { logout } = useJwtAuth();

    const handleLogout = () => {
        logout().then(() => router.push('/'));
    };

    const routes = useMemo(() => [
        {
            label: 'Chat',
            href: '/conversations',
            icon: HiChat,
            active: pathname === '/conversations' || !!conversationId
        },
        {
            label: 'Users',
            href: '/users',
            icon: HiUsers,
            active: pathname === '/users'
        },
        {
            label: 'Logout',
            href: '#',
            onClick: handleLogout,
            icon: HiArrowLeftOnRectangle
        }
    ], [pathname, conversationId]);

    return routes;
};

export default useRoutes;
