import { useEffect, useState } from 'react'
import './AdBannerCarousel.css'
import temp from '../assets/temp.png'
import elem2 from '../assets/elem2.png'
import elem3 from '../assets/elem3..png'

const slides = [
  temp,
  elem2,
  elem3,
  // 'https://res.cloudinary.com/yllqkbrj/image/upload/v1790710271/ChatGPT_Image_Sep_30_2026_12_58_44_AM.png',
  // 'https://res.cloudinary.com/yllqkbrj/image/upload/v1790710271/ChatGPT_Image_Sep_30_2026_12_56_07_AM.png',
  // 'https://res.cloudinary.com/yllqkbrj/image/upload/v1790710271/ChatGPT_Image_Sep_30_2026_01_00_12_AM.png',
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
