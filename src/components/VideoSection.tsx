import { useState } from 'react'
import './VideoSection.css'

const videos = [
  {
    id: 'v1',
    title: 'All About ACV CQR Plus Effervescent',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumb: '/assets/p1.png',
  },
  {
    id: 'v2',
    title: 'Why Soha Chooses Super Strength',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumb: '/assets/p2.jpg',
  },
  {
    id: 'v3',
    title: "Shehnaaz Gill's hack to boost metabolism",
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumb: '/assets/p3.jpg',
  },
  {
    id: 'v4',
    title: 'Glow Naturally With Dot & Key',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumb: '/assets/p1.png',
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
            DOT & KEY
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
                  Dot & Key
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

            <video
              key={selectedVideo.id}
              controls
              autoPlay
              playsInline
              src={selectedVideo.src}
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