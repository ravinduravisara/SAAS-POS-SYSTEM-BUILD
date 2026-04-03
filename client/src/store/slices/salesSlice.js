import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	recent: [],
}

const salesSlice = createSlice({
	name: 'sales',
	initialState,
	reducers: {
		addSale(state, action) {
			state.recent.unshift(action.payload)
		},
	},
})

export const { addSale } = salesSlice.actions
export default salesSlice.reducer
