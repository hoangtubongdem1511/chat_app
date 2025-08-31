import { NextResponse } from "next/server";
import getCurrentUser from "@/app/actions/getCurrentUser";
import prisma from "@/app/libs/prismadb";

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return new NextResponse("Conversation ID is required", { status: 400 });
    }

    // Check for active calls in this conversation
    const activeCalls = await prisma.call.findMany({
      where: {
        conversationId,
        status: {
          in: ['INCOMING', 'ONGOING']
        }
      },
      include: {
        caller: true,
        participants: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json({
      activeCalls,
      count: activeCalls.length
    });

  } catch (error) {
    console.error('CHECK_ACTIVE_CALLS_ERROR:', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
