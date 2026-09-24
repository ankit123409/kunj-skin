import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

type FavoritesState = {
  items: string[]
}

const initialState: FavoritesState = {
  items: [],
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite(state, action: PayloadAction<string>) {
      const id = action.payload
      const exists = state.items.includes(id)

      if (exists) {
        state.items = state.items.filter((itemId) => itemId !== id)
      } else {
        state.items.push(id)
      }
    },
    clearFavorites(state) {
      state.items = []
    },
  },
})

export const { toggleFavorite, clearFavorites } = favoritesSlice.actions
export default favoritesSlice.reducer
