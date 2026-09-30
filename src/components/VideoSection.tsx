import { useState } from 'react'
import './VideoSection.css'
import heroImage from '../assets/banner1.png'
import bannerImage from '../assets/banner2.png'
import productHero from '../assets/product2.png'

const videos = [
  {
    id: 'product1video',
    title: 'All About ACV CQR Plus Effervescent',
    src: 'https://player.cloudinary.com/embed/?cloud_name=yllqkbrj&public_id=product1video',
    thumb: heroImage,
  },
  {
    id: 'product2video',
    title: 'Why Soha Chooses Super Strength',
    src: 'https://player.cloudinary.com/embed/?cloud_name=yllqkbrj&public_id=product2video',
    thumb: bannerImage,
  },
  {
    id: 'gemini_generated_video_fd4c45f1',
    title: "Shehnaaz Gill's hack to boost metabolism",
    src: 'https://player.cloudinary.com/embed/?cloud_name=yllqkbrj&public_id=gemini_generated_video_fd4c45f1',
    thumb: productHero,
  },
  {
    id: 'video-4',
    title: 'Glow Naturally With Dot & Key',
    src: 'https://player.cloudinary.com/embed/?cloud_name=yllqkbrj&public_id=gemini_generated_video_fd4c45f1',
    thumb: heroImage,
  },
]

export default function VideoSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const selectedVideo =
    openIndex !== null ? videos[openIndex] : null

  const previousVideo = () => {
    if (openIndex === null) return

    setOpenIndex(
      openIndex === 0
        ? videos.length - 1
        : openIndex - 1
    )
  }

  const nextVideo = () => {
    if (openIndex === null) return

    setOpenIndex(
      openIndex === videos.length - 1
        ? 0
        : openIndex + 1
    )
  }

  return (
    <section className="video-section">

      {/* HEADER */}

      <div className="video-header">

        <div>
          <span className="video-label">
            Kunj &  Skin
          </span>

          <h3>Watch & Discover</h3>

          <p>
            Discover our products through quick videos
          </p>
        </div>

        <div className="video-scroll-hint">
          Swipe →
        </div>

      </div>


      {/* CAROUSEL */}

      <div className="video-carousel">

        <div className="video-row">

          {videos.map((video, index) => (

            <article
              key={video.id}
              className="video-tile"
              onClick={() => setOpenIndex(index)}
            >

              <div className="video-thumb">

                <img
                  src={video.thumb}
                  alt={video.title}
                />

                <div className="video-gradient" />

                {/* PLAY */}

                <button
                  className="play-button"
                  aria-label={`Play ${video.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenIndex(index)
                  }}
                >
                  <span>▶</span>
                </button>


                {/* VIDEO LABEL */}

                <div className="video-card-label">
                  Kunj Skin
                </div>

              </div>


              {/* TITLE */}

              <div className="video-card-content">

                <h4>
                  {video.title}
                </h4>

                <span className="watch-video">
                  Watch video →
                </span>

              </div>

            </article>

          ))}

        </div>

      </div>


      {/* DOTS */}

      <div className="video-dots">

        {videos.map((video, index) => (
          <span
            key={video.id}
            className={`video-dot ${
              index === 0 ? 'active' : ''
            }`}
          />
        ))}

      </div>


      {/* MODAL */}

      {selectedVideo && (

        <div
          className="video-modal"
          onClick={() => setOpenIndex(null)}
        >

          <button
            className="modal-close"
            onClick={() => setOpenIndex(null)}
          >
            ✕
          </button>


          {/* PREVIOUS */}

          <button
            className="modal-arrow modal-prev"
            onClick={(e) => {
              e.stopPropagation()
              previousVideo()
            }}
          >
            ‹
          </button>


          {/* VIDEO */}

          <div
            className="video-modal-content"
            onClick={(e) => e.stopPropagation()}
          >

            <iframe
              key={selectedVideo.id}
              src={selectedVideo.src}
              title={selectedVideo.title}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="video-embed"
            />

          </div>


          {/* NEXT */}

          <button
            className="modal-arrow modal-next"
            onClick={(e) => {
              e.stopPropagation()
              nextVideo()
            }}
          >
            ›
          </button>

        </div>

      )}

    </section>
  )
}