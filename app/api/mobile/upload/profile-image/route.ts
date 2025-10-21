import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { uploadProfileImage, deleteProfileImage } from '@/lib/cloudinary'


export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any

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
    const uploadResult = await uploadProfileImage(buffer, decoded.userId)

    if (!uploadResult.success) {
      return NextResponse.json(
        { message: uploadResult.error || 'Upload failed' },
        { status: 500 }
      )
    }

    // Get current user to check for existing profile image
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { profileImageUrl: true, profileImagePublicId: true }
    })

    // Delete old profile image if it exists
    if (user?.profileImagePublicId) {
      await deleteProfileImage(user.profileImagePublicId)
    }

    // Update user with new profile image
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        profileImageUrl: uploadResult.url,
        profileImagePublicId: uploadResult.publicId
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        avatar: true
      }
    })

    return NextResponse.json({
      success: true,
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
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { profileImagePublicId: true }
    })

    if (!user?.profileImagePublicId) {
      return NextResponse.json(
        { message: 'No profile image to delete' },
        { status: 400 }
      )
    }

    // Delete from Cloudinary
    const deleteResult = await deleteProfileImage(user.profileImagePublicId)

    if (!deleteResult.success) {
      return NextResponse.json(
        { message: deleteResult.error || 'Delete failed' },
        { status: 500 }
      )
    }

    // Update user to remove profile image
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        profileImageUrl: null,
        profileImagePublicId: null
      }
    })

    return NextResponse.json({
      success: true,
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
