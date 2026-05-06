'use client';

import Avatar from "@/app/components/Avatar";
import useOtherUser from "@/app/hooks/useOtherUser";
import { Conversation, User } from "@prisma/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { HiChevronLeft, HiEllipsisHorizontal } from "react-icons/hi2";
import ProfileDrawer from "./ProfileDrawer";
import AvatarGroup from "@/app/components/AvatarGroup";
import useActiveList from "@/app/hooks/useActiveList";
import CallButton from "@/app/components/calls/CallButton";
import IncomingCallModal from "@/app/components/calls/IncomingCallModal";
import useCall from "@/app/hooks/useCall";


interface HeaderProps {
    conversation: Conversation & {
        users: User[];
    }
}

const Header: React.FC<HeaderProps> = ({ 
    conversation 
}) => {
    const otherUser = useOtherUser(conversation);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const { members, lastSeenByUserId } = useActiveList();
    const isActive = !!otherUser?.id && members.includes(otherUser.id);

    const lastSeenIso = useMemo(() => {
        if (!otherUser?.id) return undefined;
        const fromSocket = lastSeenByUserId[otherUser.id];
        if (fromSocket) return fromSocket;
        const ls = otherUser.lastSeenAt;
        if (ls == null) return undefined;
        return typeof ls === "string" ? ls : new Date(ls).toISOString();
    }, [otherUser?.id, otherUser?.lastSeenAt, lastSeenByUserId]);
    
    // Call management
    const { incomingCall, setIncomingCall } = useCall(conversation.id);

    const statusText = useMemo(() => {
        if (conversation.isGroup) {
            return `${conversation.users.length} members`;
        }

        if (isActive) return "Active";

        if (lastSeenIso) {
            try {
                return `Last seen ${formatDistanceToNow(new Date(lastSeenIso), { addSuffix: true })}`;
            } catch {
                return "Offline";
            }
        }

        return "Offline";
    }, [conversation.isGroup, conversation.users.length, isActive, lastSeenIso]);

    return (
        <>
            <ProfileDrawer
                data={conversation}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            />
            <div className="bg-white w-full flex border-b-[1px] sm:px-4 py-3 px-4 lg:px-6 justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/conversations" className="lg:hidden block text-sky-500 hover:text-sky-600 transition cursor-pointer">
                        <HiChevronLeft size={32} />
                    </Link>
                    {conversation.isGroup ? (
                        <AvatarGroup users={conversation.users} />
                    ) : (
                        <Avatar user={otherUser} />
                    )}
                    <div className="flex flex-col">
                        <div>
                            {conversation.name || otherUser.name}
                        </div>
                        <div className="text-sm font-light text-neutral-500">
                            {statusText}
                        </div>
                    </div>
                </div>
                
                {/* Call Buttons */}
                <div className="flex items-center gap-2">
                    <CallButton 
                        conversationId={conversation.id} 
                        type="voice" 
                    />
                    <CallButton 
                        conversationId={conversation.id} 
                        type="video" 
                    />
                    <HiEllipsisHorizontal 
                        size={32} 
                        onClick={() => setDrawerOpen(true)} 
                        className="text-sky-500 cursor-pointer hover:text-sky-600 transition" 
                    />
                </div>
            </div>
            
            {/* Incoming Call Modal */}
            <IncomingCallModal 
                call={incomingCall}
                onClose={() => setIncomingCall(null)}
            />
        </>
    )
}

export default Header;