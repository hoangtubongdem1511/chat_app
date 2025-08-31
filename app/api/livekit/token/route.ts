import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import getCurrentUser from '@/app/actions/getCurrentUser';

export async function POST(request: Request) {
  try {
    console.log('LiveKit token request received');
    const currentUser = await getCurrentUser();
    const { roomName } = await request.json();
    
    console.log('Token request for:', { user: currentUser?.email, roomName });
    
    if (!currentUser?.email) {
      console.log('Unauthorized: No current user');
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    if (!roomName) {
      console.log('Bad request: No room name');
      return new NextResponse("Room name is required", { status: 400 });
    }
    
    // Check if LiveKit credentials are configured
    console.log('LiveKit credentials check:', {
      hasApiKey: !!process.env.LIVEKIT_API_KEY,
      hasApiSecret: !!process.env.LIVEKIT_API_SECRET,
      hasUrl: !!process.env.NEXT_PUBLIC_LIVEKIT_URL
    });
    
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      console.error('LiveKit credentials not configured');
      return new NextResponse("Server configuration error", { status: 500 });
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
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });
    
    return NextResponse.json({ 
      token: at.toJwt(),
      roomName,
      identity: currentUser.email
    });
  } catch (error) {
    console.error('LIVEKIT_TOKEN_ERROR:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
