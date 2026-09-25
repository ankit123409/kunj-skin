import { useState } from 'react'
import Navbar from './components/Navbar'
import './App.css'
import ProductList from './components/ProductList'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import ProductDetail from './components/ProductDetail'
import OrderDetail from './components/OrderDetail'
import FavoritesPage from './components/FavoritesPage'
import ProfileModal from './components/ProfileModal'
import { usePath } from './router'
import AdBannerCarousel from './components/AdBannerCarousel'

export default function App() {
  const path = usePath()
  const [searchQuery, setSearchQuery] = useState('')

  let content: React.ReactNode = null
  if (path === '/favorites') {
    content = <FavoritesPage />
  } else if (path.startsWith('/product/')) {
    const id = path.split('/product/')[1]
    if (id) content = <ProductDetail id={id} />
  } else if (path.startsWith('/order/')) {
    const id = path.split('/order/')[1]
    if (id) content = <OrderDetail id={id} />
  } else {
    content = (
      <>
        <AdBannerCarousel />
        <ProductList showHeader={false} search={searchQuery} />
      </>
    )
  }

  return (
    <div id="root">
      <Navbar value={searchQuery} onChange={setSearchQuery} />

      <main id="center">{content}</main>
      <CartDrawer />
      <ProfileModal />
      <Footer />
    </div>
  )
}
