import React from 'react'
import './Navbar.css'
import { useAppSelector, useAppDispatch } from '../hooks'
import { openCart } from '../store/uiSlice'

export default function Navbar() {
  const dispatch = useAppDispatch()
  const count = useAppSelector((s) => s.cart.items.reduce((acc, i) => acc + i.quantity, 0))

  return (
    <header className="site-navbar">
      <div className="container">
        <div className="left">
          <div className="logo">DOT<span className="amp">&</span>KEY</div>
        </div>

        <div className="center">
          <div className="search">
            <button className="search-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
            <input aria-label="Search" placeholder="Face Wash" />
          </div>
        </div>

        <div className="right">
          <button className="icon-btn" aria-label="Orders">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3h18v13H3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 13v4a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>

          <button className="icon-btn badge" aria-label="Cart" onClick={() => dispatch(openCart())}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-1.5 9h-11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
            {count > 0 && <span className="badge-dot">{count}</span>}
          </button>

          <button className="icon-btn" aria-label="Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </header>
  )
}
