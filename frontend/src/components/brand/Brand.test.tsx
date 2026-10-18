import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MaxLogo } from './MaxLogo'
import { HeroArtwork } from './HeroArtwork'
import { PromoArtwork } from './PromoArtwork'

describe('Brand Components (Milestone 4 Visual Branding Pass)', () => {
  it('renders MaxLogo with role="img", aria-label, and aperture mask', () => {
    const { container } = render(<MaxLogo size={40} className="custom-logo" />)
    const svgEl = screen.getByRole('img', { name: /max brand mark/i })
    expect(svgEl).toBeInTheDocument()
    expect(svgEl).toHaveAttribute('width', '40')
    expect(svgEl).toHaveAttribute('height', '40')
    expect(svgEl).toHaveClass('custom-logo')

    // Check for aperture mask and 4 petal gradients
    const mask = container.querySelector('#maxLogoApertureMask')
    expect(mask).toBeInTheDocument()
    expect(container.querySelector('#maxLobeTop')).toBeInTheDocument()
    expect(container.querySelector('#maxLobeRight')).toBeInTheDocument()
    expect(container.querySelector('#maxLobeBottom')).toBeInTheDocument()
    expect(container.querySelector('#maxLobeLeft')).toBeInTheDocument()
  })

  it('renders HeroArtwork with supplied hero-artwork.png image and dark blend gradients', () => {
    const { container } = render(<HeroArtwork className="hero-custom" />)
    const wrapper = container.querySelector('.hero-custom')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveAttribute('aria-hidden', 'true')
    expect(wrapper).toHaveAttribute('role', 'presentation')

    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img?.src).toContain('hero-artwork.png')
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('renders PromoArtwork reusing hero-artwork.png with coordinated crop and blend overlays', () => {
    const { container } = render(<PromoArtwork className="promo-custom" />)
    const wrapper = container.querySelector('.promo-custom')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveAttribute('aria-hidden', 'true')
    expect(wrapper).toHaveAttribute('role', 'presentation')

    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img?.src).toContain('hero-artwork.png')
    expect(img).toHaveAttribute('loading', 'lazy')
  })
})
