import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { PrismaClient } from '@prisma/client'
import { deleteCharacterImage } from '@/lib/cloudinary'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const { id } = params
      const body = await request.json()
      const { name, description, imageUrl, isActive } = body

      // Get existing character to check for image changes
      const existingCharacter = await prisma.character.findUnique({
        where: { id }
      })

      if (!existingCharacter) {
        return NextResponse.json(
          { message: 'Character not found' },
          { status: 404 }
        )
      }

      // If image URL changed, delete old image from Cloudinary
      if (imageUrl && imageUrl !== existingCharacter.imageUrl && existingCharacter.imageUrl) {
        // Extract public ID from the old image URL
        const urlParts = existingCharacter.imageUrl.split('/')
        const publicId = urlParts[urlParts.length - 1].split('.')[0]
        await deleteCharacterImage(`aseedak/characters/${publicId}`)
      }

      const character = await prisma.character.update({
        where: { id },
        data: {
          name: name || existingCharacter.name,
          description: description !== undefined ? description : existingCharacter.description,
          imageUrl: imageUrl || existingCharacter.imageUrl,
          packId: existingCharacter.packId // Keep existing packId or null
        }
      })

      return NextResponse.json({
        message: 'Character updated successfully',
        character
      })

    } catch (error) {
      console.error('Error updating character:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const { id } = params

      // Get character to delete image from Cloudinary
      const character = await prisma.character.findUnique({
        where: { id }
      })

      if (!character) {
        return NextResponse.json(
          { message: 'Character not found' },
          { status: 404 }
        )
      }

      // Delete image from Cloudinary if it exists
      if (character.imageUrl) {
        try {
          const urlParts = character.imageUrl.split('/')
          const publicId = urlParts[urlParts.length - 1].split('.')[0]
          await deleteCharacterImage(`aseedak/characters/${publicId}`)
        } catch (error) {
          console.error('Error deleting character image from Cloudinary:', error)
          // Continue with character deletion even if image deletion fails
        }
      }

      await prisma.character.delete({
        where: { id }
      })

      return NextResponse.json({
        message: 'Character deleted successfully'
      })

    } catch (error) {
      console.error('Error deleting character:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
