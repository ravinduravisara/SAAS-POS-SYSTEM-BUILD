import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import productService from '../../services/productService'

const initialState = {
	items: [],
	status: 'idle',
	error: null,
}

export const fetchProducts = createAsyncThunk(
	'products/fetchAll',
	async (_, { rejectWithValue }) => {
		try {
			return await productService.getAll()
		} catch (err) {
			return rejectWithValue(err?.message || 'Failed to load products')
		}
	},
)

export const createProduct = createAsyncThunk(
	'products/create',
	async (payload, { rejectWithValue }) => {
		try {
			return await productService.create(payload)
		} catch (err) {
			return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to create product')
		}
	},
)

export const updateProduct = createAsyncThunk(
	'products/update',
	async ({ id, payload }, { rejectWithValue }) => {
		try {
			return await productService.update(id, payload)
		} catch (err) {
			return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to update product')
		}
	},
)

export const deleteProduct = createAsyncThunk(
	'products/delete',
	async (id, { rejectWithValue }) => {
		try {
			await productService.remove(id)
			return id
		} catch (err) {
			return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to delete product')
		}
	},
)

const productSlice = createSlice({
	name: 'products',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProducts.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchProducts.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.items = action.payload
			})
			.addCase(fetchProducts.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload || 'Failed to load products'
			})
			.addCase(createProduct.fulfilled, (state, action) => {
				state.items.unshift(action.payload)
			})
			.addCase(updateProduct.fulfilled, (state, action) => {
				const idx = state.items.findIndex((p) => p.id === action.payload.id)
				if (idx >= 0) state.items[idx] = action.payload
			})
			.addCase(deleteProduct.fulfilled, (state, action) => {
				state.items = state.items.filter((p) => p.id !== action.payload)
			})
	},
})

export default productSlice.reducer
