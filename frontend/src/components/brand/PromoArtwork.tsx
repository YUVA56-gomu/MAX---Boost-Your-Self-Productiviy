import React from 'react'
import heroArtworkImg from '@/assets/brand/hero-artwork.png'

interface PromoArtworkProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const PromoArtwork: React.FC<PromoArtworkProps> = ({
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
        className="w-[260%] h-[260%] max-w-none object-cover -translate-x-[46%] -translate-y-[10%] transform"
        loading="lazy"
      />
      {/* Subtle dark gradient fades to blend seamlessly into promo card background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#151924] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#151924] via-transparent to-transparent" />
    </div>
  )
}
