import React from 'react'

interface MaxLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

export const MaxLogo: React.FC<MaxLogoProps> = ({
  size = 32,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
      aria-label="MAX Brand Mark"
      role="img"
      {...props}
    >
      <defs>
        {/* Transparent Center Hole Mask */}
        <mask id="maxLogoApertureMask">
          <rect x="0" y="0" width="100" height="100" fill="#FFFFFF" />
          <circle cx="50" cy="50" r="11" fill="#000000" />
        </mask>

        {/* Top Petal: Vibrant Pink / Magenta */}
        <linearGradient id="maxLobeTop" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FF2E93" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>

        {/* Right Petal: Azure to Deep Sapphire Blue */}
        <linearGradient id="maxLobeRight" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Bottom Petal: Cyan-Teal to Amber-Orange */}
        <linearGradient id="maxLobeBottom" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Left Petal: Fire Orange to Crimson Coral */}
        <linearGradient id="maxLobeLeft" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>

      <g mask="url(#maxLogoApertureMask)">
        {/* Top Petal */}
        <circle cx="50" cy="32" r="22" fill="url(#maxLobeTop)" />
        {/* Right Petal */}
        <circle cx="68" cy="50" r="22" fill="url(#maxLobeRight)" />
        {/* Bottom Petal */}
        <circle cx="50" cy="68" r="22" fill="url(#maxLobeBottom)" />
        {/* Left Petal */}
        <circle cx="32" cy="50" r="22" fill="url(#maxLobeLeft)" />
      </g>
    </svg>
  )
}
