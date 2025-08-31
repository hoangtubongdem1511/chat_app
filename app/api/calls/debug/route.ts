import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all calls for debugging
    const allCalls = await prisma.call.findMany({
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
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    return NextResponse.json({
      totalCalls: allCalls.length,
      calls: allCalls.map(call => ({
        id: call.id,
        status: call.status,
        type: call.type,
        roomName: call.roomName,
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        conversationId: call.conversationId,
        callerEmail: call.caller.email,
        participantsCount: call.participants.length
      }))
    });

  } catch (error) {
    console.error('DEBUG_CALLS_ERROR:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
