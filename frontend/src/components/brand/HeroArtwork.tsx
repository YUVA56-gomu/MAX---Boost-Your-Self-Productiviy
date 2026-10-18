import React from 'react'
import heroArtworkImg from '@/assets/brand/hero-artwork.png'

interface HeroArtworkProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const HeroArtwork: React.FC<HeroArtworkProps> = ({
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative pointer-events-none select-none overflow-hidden ${className}`}
      aria-hidden="true"
      role="presentation"
      {...props}
    >
      <img
        src={heroArtworkImg}
        alt=""
        className="w-full h-full object-cover object-right"
        loading="eager"
      />
      {/* Subtle dark gradient fades to blend seamlessly into background and preserve text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F17] via-[#0B0F17]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/40 via-transparent to-[#0B0F17]/20" />
    </div>
  )
}
