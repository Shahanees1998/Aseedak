'use client'

import { Avatar } from 'primereact/avatar'

interface AvatarDisplayProps {
  avatarType: string
  size?: 'small' | 'normal' | 'large' | 'xlarge'
  className?: string
}

export default function AvatarDisplay({ avatarType, size = 'normal', className = '' }: AvatarDisplayProps) {
  const getImagePath = (avatar: string) => {
    const imageNumber = avatar.replace('IMAGE', '')
    return `/images/avatar${imageNumber}.png`
  }

  return (
    <Avatar
      image={getImagePath(avatarType)}
      size={size}
      className={className}
      imageAlt={`Avatar ${avatarType}`}
    />
  )
}
