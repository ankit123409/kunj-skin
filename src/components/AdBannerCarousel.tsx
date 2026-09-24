import { useEffect, useState } from 'react'
import './AdBannerCarousel.css'
import heroImage from '../assets/banner1.png'
import productImage from '../assets/banner2.png'

const slides = [
  heroImage,
  productImage,
]

export default function AdBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [])

  const activeSlide = slides[currentIndex]

  return (
    <section className="ads-carousel" aria-label="Featured Kunj Skin advertisements">
      <div className="ads-carousel__inner">
        <img src={activeSlide} alt="Kunj Skin promotional banner" className="ads-banner-image" />
      </div>
    </section>
  )
}
