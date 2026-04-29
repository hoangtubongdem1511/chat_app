import { redirect } from "next/navigation";
import VideoCallInterface from "@/app/components/calls/VideoCallInterface";
import { serverGet, serverPost } from "@/app/lib/server-api-client";
import { User } from "@prisma/client";

interface CallParticipant {
  user: User;
}

interface CallData {
  id: string;
  status: string;
  roomName: string;
  participants: CallParticipant[];
}

interface TokenData {
  token: string;
  roomName: string;
}

interface CallPageProps {
  params: Promise<{ callId: string }>;
}

const CallPage = async ({ params }: CallPageProps) => {
  const { callId } = await params;

  const currentUser = await serverGet<User>('/auth/me');

  if (!currentUser?.email) {
    redirect('/');
  }

  const call = await serverGet<CallData>(`/calls/${callId}`);

  if (!call) {
    redirect('/conversations');
  }

  const isParticipant = call.participants?.some(
    (p) => p.user?.email === currentUser.email
  );

  if (!isParticipant) {
    redirect('/conversations');
  }

  if (!['INCOMING', 'ONGOING'].includes(call.status)) {
    redirect('/conversations');
  }

  const tokenData = await serverPost<TokenData>('/livekit/token', { roomName: call.roomName });

  if (!tokenData?.token) {
    redirect('/conversations');
  }

  return (
    <VideoCallInterface
      callId={callId}
      token={tokenData.token}
    />
  );
};

export default CallPage;
