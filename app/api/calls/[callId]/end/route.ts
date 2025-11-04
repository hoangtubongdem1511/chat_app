import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Get call details
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        caller: true,
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
      return new NextResponse("Call not found", { status: 404 });
    }
    
    // Check if call is active (INCOMING or ONGOING)
    if (!['INCOMING', 'ONGOING'].includes(call.status)) {
      return new NextResponse("Call is not active", { status: 400 });
    }
    
    // Check if user is part of the conversation
    const isUserInConversation = call.conversation.users.some(
      user => user.id === currentUser.id
    );
    
    if (!isUserInConversation) {
      return new NextResponse("Not authorized for this call", { status: 403 });
    }
    
    // Calculate call duration if call was ongoing
    let duration: number | undefined;
    if (call.status === 'ONGOING' && call.startedAt) {
      const endTime = new Date();
      duration = Math.floor((endTime.getTime() - call.startedAt.getTime()) / 1000); // Duration in seconds
    }
    
    // Determine final status
    let finalStatus: 'ENDED' | 'MISSED' | 'CANCELLED';
    if (call.status === 'INCOMING') {
      finalStatus = call.callerId === currentUser.id ? 'CANCELLED' : 'MISSED';
    } else {
      finalStatus = 'ENDED';
    }
    
    // Update call status
    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status: finalStatus,
        endedAt: new Date(),
        duration: duration || undefined
      },
      include: {
        caller: true,
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
    
    // Notify all participants about call ending
    call.conversation.users.forEach((user) => {
      if (user.email) {
        pusherServer.trigger(user.email, 'call:ended', updatedCall);
      }
    });
    
    return NextResponse.json(updatedCall);
  } catch (error) {
    console.error('END_CALL_ERROR:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
