import React from 'react'
import Navbar from './components/Navbar'
import './App.css'
import ProductList from './components/ProductList'
import VideoSection from './components/VideoSection'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import ProductDetail from './components/ProductDetail'
import { usePath } from './router'

export default function App() {
  const path = usePath()


  let content: React.ReactNode = null
  if (path.startsWith('/product/')) {
    const id = path.split('/product/')[1]
    if (id) content = <ProductDetail id={id} />
  } else {
    // listing page: show video section then product list
    content = (
      <>
       
        <ProductList showHeader={false} />
         {/* <VideoSection /> */}
      </>
    )
  }

  return (
    <div id="root">
      <Navbar />

      <main id="center">{content}</main>
      <CartDrawer />
      <Footer />
    </div>
  )
}
