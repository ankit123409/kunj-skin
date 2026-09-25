import type { Product } from '../store/cartSlice'
import p1 from '../assets/p1.png'
import product2 from '../assets/product2.png'
import product3 from '../assets/product3.png'
export const products: Product[] = [
  {
    id: 'p1',
    title: 'Glowkunj Face serum for lightening  & glowing skin',
    price: 799,
    size: '30ml',
    img: p1,
    desc:"Advanced skincare formula for healthy, radiant skin"
  },
  {
    id: 'p2',
    title: 'Vitakunj Face serum for even tone skin',
    price: 799,
    size: '30ml',
    img: product2,
    desc:"Gentle yet effective face wash for sensitive skin"
  },
  {
    id: 'p3',
    title: 'Salikunj Face wash ',
    price: 199,
    size: '70ml',
    img: product3,
    desc:"Effective face wash for oily skin"
  },
 
   
]
