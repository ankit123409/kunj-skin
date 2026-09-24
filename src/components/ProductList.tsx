import { products } from '../data/products'
import CustomerReviews from './CustomerReviews'
import ProductCard from './ProductCard'
import './ProductList.css'

export default function ProductList({
  showHeader = true,
  search = '',
}: {
  showHeader?: boolean
  search?: string
}) {
  const query = search.trim().toLowerCase()

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
        {filteredProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {query && filteredProducts.length === 0 && (
        <div className="no-results">No products found for "{search}"</div>
      )}

      {!query && <CustomerReviews />}
    </section>
  )
}
