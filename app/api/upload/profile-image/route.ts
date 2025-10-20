import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, requireAuth, AuthenticatedUser } from '@/lib/jwt-auth'
import { PrismaClient } from '@prisma/client'
import { uploadProfileImage, deleteProfileImage } from '@/lib/cloudinary'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user?.userId) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json(
        { message: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await uploadProfileImage(buffer, user.userId)

    if (!uploadResult.success) {
      return NextResponse.json(
        { message: uploadResult.error || 'Upload failed' },
        { status: 500 }
      )
    }

    // Get current user to check for existing profile image
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { profileImageUrl: true, profileImagePublicId: true }
    })

    // Delete old profile image if it exists
    if (currentUser?.profileImagePublicId) {
      await deleteProfileImage(currentUser.profileImagePublicId)
    }

    // Update user with new profile image
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        profileImageUrl: uploadResult.url,
        profileImagePublicId: uploadResult.publicId
      },
      select: {
        id: true,
        username: true,
        profileImageUrl: true,
        avatar: true
      }
    })

    return NextResponse.json({
      message: 'Profile image uploaded successfully',
      user: updatedUser,
      imageUrl: uploadResult.url
    })

  } catch (error) {
    console.error('Profile image upload error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user?.userId) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { profileImagePublicId: true }
    })

    if (!currentUser?.profileImagePublicId) {
      return NextResponse.json(
        { message: 'No profile image to delete' },
        { status: 400 }
      )
    }

    // Delete from Cloudinary
    const deleteResult = await deleteProfileImage(currentUser.profileImagePublicId)

    if (!deleteResult.success) {
      return NextResponse.json(
        { message: deleteResult.error || 'Delete failed' },
        { status: 500 }
      )
    }

    // Update user to remove profile image
    await prisma.user.update({
      where: { id: user.userId },
      data: {
        profileImageUrl: null,
        profileImagePublicId: null
      }
    })

    return NextResponse.json({
      message: 'Profile image deleted successfully'
    })

  } catch (error) {
    console.error('Profile image delete error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
