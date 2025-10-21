import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { GameNotifications } from '@/lib/fcm'


const assignAvatarSchema = z.object({
  avatar: z.enum(['IMAGE1', 'IMAGE2', 'IMAGE3', 'IMAGE4', 'IMAGE5', 'IMAGE6', 'IMAGE7', 'IMAGE8', 'IMAGE9', 'IMAGE10', 'IMAGE11', 'IMAGE12', 'IMAGE13', 'IMAGE14', 'IMAGE15', 'IMAGE16'])
})

/**
 * PUT /api/admin/users/[id]/assign-avatar
 * Assign a new avatar to a user and send notification
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const adminUser = authenticatedReq.user!
      
      // Check if user is admin
      if (adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { message: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }

      const body = await authenticatedReq.json()
      const validatedData = assignAvatarSchema.parse(body)

      // Find the target user
      const targetUser = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
          id: true,
          username: true,
          firstName: true,
          avatar: true,
          role: true
        }
      })

      if (!targetUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Update user's avatar
      const updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: { avatar: validatedData.avatar },
        select: {
          id: true,
          username: true,
          firstName: true,
          avatar: true,
          role: true
        }
      })

      // Send FCM notification to user about new avatar (only for non-admin users)
      if (targetUser.role !== 'ADMIN') {
        try {
          await GameNotifications.newAvatarAssigned(
            targetUser.id,
            validatedData.avatar
          )
          console.log(`✅ Avatar assignment notification sent to ${targetUser.username}`)
        } catch (error) {
          console.error(`Failed to send avatar assignment notification to ${targetUser.username}:`, error)
        }
      }

      // Create notification record in database
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          title: 'New Avatar Assigned',
          message: `You have been assigned a new avatar: ${validatedData.avatar}`,
          type: 'avatar_assigned',
          data: {
            avatar: validatedData.avatar,
            assignedBy: adminUser.firstName && adminUser.lastName ? `${adminUser.firstName} ${adminUser.lastName}` : 'Admin'
          }
        }
      })

      return NextResponse.json({
        message: 'Avatar assigned successfully',
        user: updatedUser,
        notificationSent: targetUser.role !== 'ADMIN'
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: error.errors[0].message },
          { status: 400 }
        )
      }

      console.error('Error assigning avatar:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } 
  })
}

