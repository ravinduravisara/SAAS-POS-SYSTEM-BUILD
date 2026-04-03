import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import customerService from '../../services/customerService'

const initialState = {
	items: [],
	status: 'idle',
	error: null,
}

export const fetchCustomers = createAsyncThunk(
	'customers/fetchAll',
	async (_, { rejectWithValue }) => {
		try {
			return await customerService.getAll()
		} catch (err) {
			return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to load customers')
		}
	},
)

const customerSlice = createSlice({
	name: 'customers',
	initialState,
	reducers: {
		setCustomers(state, action) {
			state.items = action.payload
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCustomers.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(fetchCustomers.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.items = action.payload
			})
			.addCase(fetchCustomers.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload || 'Failed to load customers'
			})
	},
})

export const { setCustomers } = customerSlice.actions
export default customerSlice.reducer
