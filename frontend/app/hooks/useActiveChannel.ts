import { useEffect, useState } from "react";
import { pusherClient } from "../libs/pusher";
import useActiveList from "./useActiveList";
import { Channel, Members } from "pusher-js";


const useActiveChannel = () => {
    const { set , add , remove } = useActiveList();
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

    useEffect(() => {
        let channel = activeChannel;
        if (!channel) {
            channel = pusherClient.subscribe('presence-messager');
            setActiveChannel(channel);
        }
        channel.bind('pusher:subscription_succeeded', (members: Members) => {
            console.log('Pusher subscription succeeded:', members);
            const initialMembers: string[] = [];
            members.each((member: Record<string, unknown>) => initialMembers.push(member.id as string));
            console.log('Initial members:', initialMembers);
            set(initialMembers);
        });
        channel.bind('pusher:member_added', (member: Record<string, unknown>) => {
            add(member.id as string);
        });

        channel.bind('pusher:member_removed', (member: Record<string, unknown>) => {
            remove(member.id as string);
        });
        return () => {
            if (activeChannel) {
                pusherClient.unsubscribe('presence-messager');
                setActiveChannel(null);
            }
        }
    }, [activeChannel, set, add, remove]);
}

export default useActiveChannel;
