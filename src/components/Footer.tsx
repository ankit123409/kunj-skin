import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-col">
          <h3>Know Us Better</h3>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Affiliate Program</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Blogs</a></li>
            <li><a href="#">Sitemap</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Help</h3>
          <ul>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Grievance Officer</a></li>
            <li><a href="#">Our Policies</a></li>
            <li><a href="#">Terms &amp; Conditions</a></li>
            <li><a href="#">Terms Of Service</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h3>Also Available On</h3>
          <ul>
            <li><a href="#">Nykaa</a></li>
            <li><a href="#">Amazon</a></li>
            <li><a href="#">Flipkart</a></li>
            <li><a href="#">Myntra</a></li>
            <li><a href="#">Purple</a></li>
          </ul>
        </div>

        <div className="footer-col footer-newsletter">
          <h3>Sign Up For Updates</h3>

          <div className="subscribe-box">
            <input type="email" placeholder="Enter Your Email" aria-label="Email" />
            <button type="button">Subscribe</button>
          </div>

          <div className="social-wrap">
            <h4>Follow Us</h4>
            <div className="social-list">
              <button className="social-btn" aria-label="Facebook">f</button>
              <button className="social-btn" aria-label="Instagram">◌</button>
              <button className="social-btn" aria-label="YouTube">▶</button>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 kunj &amp; skin Wellness Ltd. All Rights Reserved.
      </div>
    </footer>
  )
}
