import { useAppSelector } from '../hooks'
import CustomerReviews from './CustomerReviews'
import ProductCard from './ProductCard'
import VideoSection from './VideoSection'
import './ProductList.css'

export default function ProductList({
  showHeader = true,
  search = '',
}: {
  showHeader?: boolean
  search?: string
}) {
  const query = search.trim().toLowerCase()

  const products = useAppSelector((s) => s.products.items)
  const loading = useAppSelector((s) => s.products.loading)
  const isLoadingProducts = loading && products.length === 0

  const filteredProducts = query
    ? products.filter((product) =>
        product.title.toLowerCase().includes(query) ||
        product.size?.toLowerCase().includes(query)
      )
    : products

  return (
    <section className="product-list">
      {showHeader && (
        <h2>
          Showing {filteredProducts.length} products for "{query || 'Face Wash'}"
        </h2>
      )}

      <div className="grid">
        {isLoadingProducts
          ? Array.from({ length: 6 }).map((_, index) => (
              <div className="product-card product-card-skeleton" key={`product-skeleton-${index}`}>
                <div className="product-media skeleton-media">
                  <div className="skeleton skeleton-image" />
                </div>
                <div className="product-card-body">
                  <div className="skeleton skeleton-line skeleton-line-short" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line skeleton-line-price" />
                </div>
              </div>
            ))
          : filteredProducts?.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>

      {query && filteredProducts?.length === 0 && (
        <div className="no-results">No products found for "{search}"</div>
      )}

      {!query && <VideoSection />}
      {!query && <CustomerReviews variant="static" />}
    </section>
  )
}
