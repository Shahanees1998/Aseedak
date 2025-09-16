import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, AuthenticatedRequest } from '@/lib/authMiddleware'
import { uploadCharacterImage } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
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

      // Upload to Cloudinary
      const uploadResult = await uploadCharacterImage(file)

      if (!uploadResult.success) {
        return NextResponse.json(
          { message: uploadResult.error || 'Upload failed' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Character image uploaded successfully',
        imageUrl: uploadResult.url,
        publicId: uploadResult.publicId
      })

    } catch (error) {
      console.error('Character image upload error:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
