import React, { useState } from 'react'
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
]

export default function VideoSection() {
  const [open, setOpen] = useState<string | null>(null)

  const selectedVideo = videos.find((video) => video.id === open)

  return (
    <section className="video-section">

      <div className="video-header">
        <div>
          <span className="video-label">
            KUNJ SKIN
          </span>

          <h3>Videos</h3>

          <p>
            Short clips and product stories
          </p>
        </div>
      </div>


      <div className="video-row">

        {videos.map((video) => (

          <article
            key={video.id}
            className="video-tile"
          >

            <div
              className="thumb"
              onClick={() => setOpen(video.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setOpen(video.id)
                }
              }}
            >

              <img
                src={video.thumb}
                alt={video.title}
              />

              <div className="thumb-overlay" />

              <div className="play">
                ▶
              </div>

            </div>

            <div className="v-title">
              {video.title}
            </div>

          </article>

        ))}

      </div>


      {/* VIDEO MODAL */}

      {selectedVideo && (

        <div
          className="video-modal"
          onClick={() => setOpen(null)}
        >

          <div
            className="video-wrapper"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="close"
              onClick={() => setOpen(null)}
              aria-label="Close video"
            >
              ✕
            </button>

            <video
              controls
              autoPlay
              playsInline
              src={selectedVideo.src}
            />

          </div>

        </div>

      )}

    </section>
  )
}