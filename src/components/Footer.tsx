import React from 'react'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div className="col brand-col">
            <div className="brand">Kunj Skin</div>
            <p className="desc">Cleanse • Purify • Reveal — natural, effective skincare crafted for daily use.</p>

            <div className="address">
              B/H, Sharda Complex Dhirubhai Nayak Hall, B 301, Brahmin Faliya St., Kansarwad, Killa-pardi, Gujarat 396124
            </div>

            <div className="signup">
              <div className="signup-title">Sign up for exclusive deals and offers</div>
              <button className="signup-btn">SIGN UP</button>
            </div>
          </div>

          <div className="col">
            <div className="heading">Concerns</div>
            <ul>
              <li><a href="#">Weight</a></li>
              <li><a href="#">Skin</a></li>
              <li><a href="#">Daily Wellbeing</a></li>
              <li><a href="#">Performance</a></li>
              <li><a href="#">Hair</a></li>
            </ul>
          </div>

          <div className="col">
            <div className="heading">Learn</div>
            <ul>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Our Story</a></li>
              <li><a href="#">Personal Guidance</a></li>
            </ul>
          </div>

          <div className="col">
            <div className="heading">Legal</div>
            <ul>
              <li><a href="#">Refund & Cancellation</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms & Conditions</a></li>
            </ul>
          </div>
        </div>

        <div className="bottom">
          <div>© {new Date().getFullYear()} Kunj Skin. All rights reserved.</div>
          <div className="links"><a href="#">Terms</a> · <a href="#">Privacy</a></div>
        </div>
      </div>
    </footer>
  )
}
