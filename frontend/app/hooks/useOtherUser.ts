import { useMemo } from "react";
import { FullConversationType } from "../types";
import { User } from "@prisma/client";
import { useJwtAuth } from "../context/JwtAuthContext";

const useOtherUser = (conversation: FullConversationType | {
    users: User[];
}) => {
    const { user } = useJwtAuth();

    const otherUser = useMemo(() => {
        const currentUserEmail = user?.email;
        const others = conversation.users.filter((u) => u.email !== currentUserEmail);
        return others[0];
    }, [conversation.users, user?.email]);

    return otherUser;
}

export default useOtherUser;
