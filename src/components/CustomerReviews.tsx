import './CustomerReviews.css'

const reviews = [
  {
    id: 1,
    name: 'MEGHA',
    surname: 'PARASHAR',
    rating: 5,
    title: 'Just Love It!',
    text: 'I’ve been using Dot & Key Vitamin C Sunscreen for a year now. It’s lightweight & quick-absorbing. Reduces dullness too with a dewy finish. A must-buy!',
    product: 'Megha Recommends This Product',
    productTone: 'pink',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 2,
    name: 'RESHMA',
    surname: 'SATHEESH',
    rating: 5,
    title: 'Blends In No Time',
    text: 'This is my third bottle of using this sunscreen. Zero white cast & non-pilling formula, just love it!',
    product: 'Reshma Recommends This Product',
    productTone: 'peach',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 3,
    name: 'MUSKAN',
    surname: 'CHOWDHURY',
    rating: 5,
    title: 'No More Dry Skin',
    text: 'Ceramide in this moisturizer protects the natural barrier of my skin while deeply moisturizing. It also soothes redness & dry skin.',
    product: 'Muskan Recommends This Product',
    productTone: 'mint',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 4,
    name: 'SONAL',
    surname: 'SAREEN',
    rating: 5,
    title: 'It Works!',
    text: 'I have been using this moisturizer for almost 6 months now. It feels so light and gives a healthy glow without feeling greasy.',
    product: 'Sonal Recommends This Product',
    productTone: 'gold',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80',
  },
]

export default function CustomerReviews() {
  return (
    <section className="customer-reviews">
      <h2>Love That Keeps Us Going</h2>

      <div className="reviews-grid">
        {reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <div className="review-head">
              <img src={review.avatar} alt={review.name} className="review-avatar" />

              <div className="review-name-block">
                <span className="review-name">{review.name}</span>
                <span className="review-surname">{review.surname}</span>
              </div>

              <span className="review-badge" aria-label="Verified user">✓</span>
            </div>

            <div className="review-stars" aria-label={`${review.rating} star review`}>
              {Array.from({ length: review.rating }).map((_, index) => (
                <span key={index}>★</span>
              ))}
            </div>

            <h3>{review.title}</h3>

            <p>{review.text}</p>

            <div className={`review-product review-product--${review.productTone}`}>
              <div className="review-product__thumb" aria-hidden="true" />
              <span>{review.product}</span>
              <button type="button">SHOP NOW »</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
