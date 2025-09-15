'use client'

import { Avatar } from 'primereact/avatar'

interface AvatarDisplayProps {
  avatarType: string | null
  size?: 'normal' | 'large' | 'xlarge'
  className?: string
}

export default function AvatarDisplay({ avatarType, size = 'normal', className = '' }: AvatarDisplayProps) {
  const getImagePath = (avatar: string) => {
    const imageNumber = avatar.replace('IMAGE', '')
    return `/images/avatars/${imageNumber}.png`
  }

  // If no avatar is assigned, show a default icon
  if (!avatarType) {
    return (
      <Avatar
        icon="pi pi-user"
        size={size}
        className={className}
        imageAlt="No avatar assigned"
      />
    )
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
