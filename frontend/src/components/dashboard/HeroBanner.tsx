import { useState } from 'react'
import { HeroArtwork } from '@/components/brand/HeroArtwork'

function getInitialDateInfo() {
  const now = new Date()
  const hour = now.getHours()
  let greet = 'Good evening'
  if (hour < 12) greet = 'Good morning'
  else if (hour < 18) greet = 'Good afternoon'

  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(now)
  const day = now.getDate()
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(now)
  const year = now.getFullYear()
  const dateStr = `${weekday}, ${day} ${month} ${year}`

  return { greeting: greet, formattedDate: dateStr }
}

export const HeroBanner: React.FC = () => {
  const [{ greeting, formattedDate }] = useState(getInitialDateInfo)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0B0F17]/80 border border-white/10 p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 min-h-[140px]">
      {/* Decorative background hero artwork positioned on right with subtle dark gradient fade */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-4/5 md:w-3/4 lg:w-2/3 pointer-events-none select-none overflow-hidden">
        <HeroArtwork className="w-full h-full" />
      </div>

      {/* Left Greeting & Subtitle */}
      <div className="relative z-10 space-y-1 max-w-md">
        <div className="text-xs font-medium text-[#94A3B8]">
          {formattedDate}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC] flex items-center gap-2">
          <span>{greeting},</span>
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
            Yuvaraj
          </span>
        </h1>
        <p className="text-xs text-[#94A3B8] flex items-center gap-1.5 pt-0.5">
          <span>Let’s make today productive</span>
          <span>✨</span>
        </p>
      </div>

      {/* Motivational Quote Card - Translucent Glassmorphism with Comfortable Width */}
      <div className="relative z-10 w-full sm:w-80 md:w-88 lg:w-96 p-4 sm:p-5 rounded-2xl bg-[#0B0F17]/35 hover:bg-[#0B0F17]/45 backdrop-blur-md border border-white/15 shadow-lg transition-all duration-300 flex flex-col justify-center shrink-0">
        <span className="text-white/60 font-serif text-2xl leading-none mb-1.5 select-none" aria-hidden="true">
          “
        </span>
        <p className="text-xs sm:text-[13px] text-[#F8FAFC] leading-relaxed font-normal tracking-wide drop-shadow-sm">
          Discipline today builds the freedom tomorrow.
        </p>
      </div>
    </div>
  )
}
