import './Navbar.css'
import { useAppSelector, useAppDispatch } from '../hooks'
import { openCart, openProfile } from '../store/uiSlice'
import { navigate } from '../router'

export default function Navbar({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const dispatch = useAppDispatch()
  const count = useAppSelector((s) => s.cart.items.reduce((acc, i) => acc + i.quantity, 0))
  const favoritesCount = useAppSelector((s) => s.favorites.items.length)

  return (
    <header className="site-navbar">
      <div className="container">
        <div className="left">
          <div className="logo" onClick={() => navigate('/')}>Kunj<span className="amp">&</span>Skin</div>
        </div>

        <div className="right">
          <div className="search">
            <button className="search-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
            <input
              aria-label="Search"
              placeholder="Search for products"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>

          <button className="icon-btn badge" aria-label="Favorites" onClick={() => navigate('/favorites')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 20.5s-7.5-4.35-9.5-8.4C1.2 9.7 2.5 5 7 5c2.1 0 3.3 1.14 4 2.14C11.7 6.14 12.9 5 15 5c4.5 0 5.8 4.7 4.5 7.1-2 4.05-9.5 8.4-9.5 8.4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {favoritesCount > 0 && <span className="badge-dot">{favoritesCount}</span>}
          </button>

          <button className="icon-btn badge" aria-label="Cart" onClick={() => dispatch(openCart())}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-1.5 9h-11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
            {count > 0 && <span className="badge-dot">{count}</span>}
          </button>

          <button className="icon-btn" aria-label="Profile" onClick={() => dispatch(openProfile())}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </header>
  )
}
