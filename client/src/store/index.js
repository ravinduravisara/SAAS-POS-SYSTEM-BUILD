import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import cartReducer from './slices/cartSlice'
import productReducer from './slices/productSlice'
import salesReducer from './slices/salesSlice'
import customerReducer from './slices/customerSlice'

export const store = configureStore({
	reducer: {
		auth: authReducer,
		cart: cartReducer,
		products: productReducer,
		sales: salesReducer,
		customers: customerReducer,
	},
})
