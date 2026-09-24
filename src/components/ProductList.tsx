import React from 'react'
import { products } from '../data/products'
import ProductCard from './ProductCard'
import './ProductList.css'

export default function ProductList({ showHeader = true }: { showHeader?: boolean }){
  return (
    <section className="product-list">
      {showHeader && <h2>Showing {products.length} products For "Face Wash"</h2>}

      <div className="grid">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
