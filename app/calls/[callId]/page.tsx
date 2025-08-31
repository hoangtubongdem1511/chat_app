import getCurrentUser from "@/app/actions/getCurrentUser";
import { redirect } from "next/navigation";
import prisma from "@/app/libs/prismadb";
import VideoCallInterface from "@/app/components/calls/VideoCallInterface";
import { AccessToken } from 'livekit-server-sdk';

interface CallPageProps {
  params: Promise<{ callId: string }>;
}

const CallPage = async ({ params }: CallPageProps) => {
  const { callId } = await params;
  const currentUser = await getCurrentUser();
  
  if (!currentUser?.email) {
    redirect('/');
  }
  
  // Get call details
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      participants: {
        include: {
          user: true
        }
      },
      conversation: {
        include: {
          users: true
        }
      }
    }
  });
  
  if (!call) {
    redirect('/conversations');
  }
  
  // Check if user is participant
  const isParticipant = call.participants.some(
    p => p.user.email === currentUser.email
  );
  
  if (!isParticipant) {
    redirect('/conversations');
  }
  
  // Check if call is active
  if (!['INCOMING', 'ONGOING'].includes(call.status)) {
    redirect('/conversations');
  }
  
           // Generate LiveKit token directly
   console.log('Generating LiveKit token for room:', call.roomName);
   console.log('Current user:', currentUser?.email);
   
   // Check if LiveKit credentials are configured
   if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
     console.error('LiveKit credentials not configured');
     redirect('/conversations');
   }
   
   const at = new AccessToken(
     process.env.LIVEKIT_API_KEY,
     process.env.LIVEKIT_API_SECRET,
     {
       identity: currentUser.email,
       name: currentUser.name || currentUser.email,
     }
   );
   
   // Grant permissions for the specific room
   at.addGrant({ 
     roomJoin: true, 
     room: call.roomName,
     canPublish: true,
     canSubscribe: true,
     canPublishData: true
   });
   
   const token = await at.toJwt();
   console.log('Token generated successfully for room:', call.roomName);
   
   return (
     <VideoCallInterface
       callId={callId}
       roomName={call.roomName}
       token={token}
     />
   );
};

export default CallPage;

