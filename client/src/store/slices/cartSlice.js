import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	items: [],
}

const cartSlice = createSlice({
	name: 'cart',
	initialState,
	reducers: {
		addToCart(state, action) {
			const product = action.payload
			const existing = state.items.find((i) => i.productId === product.id)
			if (existing) {
				existing.quantity += 1
			} else {
				state.items.push({
					productId: product.id,
					name: product.name,
					price: product.price,
					quantity: 1,
				})
			}
		},
		removeFromCart(state, action) {
			state.items = state.items.filter((i) => i.productId !== action.payload)
		},
		setQuantity(state, action) {
			const { productId, quantity } = action.payload
			const item = state.items.find((i) => i.productId === productId)
			if (item) item.quantity = Math.max(1, quantity)
		},
		clearCart(state) {
			state.items = []
		},
	},
})

export const { addToCart, removeFromCart, setQuantity, clearCart } =
	cartSlice.actions
export default cartSlice.reducer
