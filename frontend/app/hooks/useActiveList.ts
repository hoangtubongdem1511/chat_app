import { create } from "zustand";

interface ActiveListStore {
    /** Connected user ids (JWT `sub`), not emails */
    members: string[];
    /** ISO timestamps from `presence:offline` or hydrated from API */
    lastSeenByUserId: Record<string, string>;
    add: (id: string) => void;
    remove: (id: string) => void;
    set: (ids: string[]) => void;
    setLastSeen: (userId: string, iso: string) => void;
}

const useActiveList = create<ActiveListStore>((set) => ({
    members: [],
    lastSeenByUserId: {},
    add: (id) =>
        set((state) =>
            state.members.includes(id) ? state : { members: [...state.members, id] },
        ),
    remove: (id) => set((state) => ({ members: state.members.filter((memberId) => memberId !== id) })),
    set: (ids) => set({ members: ids }),
    setLastSeen: (userId, iso) =>
        set((state) => ({
            lastSeenByUserId: { ...state.lastSeenByUserId, [userId]: iso },
        })),
}));

export default useActiveList;