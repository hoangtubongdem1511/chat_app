import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ callId: string }> }
) {
  try {
    const { callId } = await params;
    const currentUser = await getCurrentUser();
    
    if (!currentUser?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
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
    
    // Check if user is part of the conversation
    const isUserInConversation = call.conversation.users.some(
      user => user.id === currentUser.id
    );
    
    if (!isUserInConversation) {
      return new NextResponse("Not authorized for this call", { status: 403 });
    }
    
    return NextResponse.json(call);
  } catch (error) {
    console.error('GET_CALL_ERROR:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
