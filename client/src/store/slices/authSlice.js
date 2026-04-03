import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import authService from '../../services/authService'

const TOKEN_KEY = 'pos_token'
const USER_KEY = 'pos_user'

function safeJsonParse(value, fallback) {
	try {
		return JSON.parse(value)
	} catch {
		return fallback
	}
}

const initialState = {
	token: localStorage.getItem(TOKEN_KEY) || null,
	user: safeJsonParse(localStorage.getItem(USER_KEY), null),
	status: 'idle',
	error: null,
}

export const login = createAsyncThunk(
	'auth/login',
	async ({ email, password }, { rejectWithValue }) => {
		try {
			const data = await authService.login({ email, password })
			return data
		} catch (err) {
			return rejectWithValue(err?.message || 'Login failed')
		}
	},
)

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		logout(state) {
			state.token = null
			state.user = null
			state.status = 'idle'
			state.error = null
			localStorage.removeItem(TOKEN_KEY)
			localStorage.removeItem(USER_KEY)
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(login.pending, (state) => {
				state.status = 'loading'
				state.error = null
			})
			.addCase(login.fulfilled, (state, action) => {
				state.status = 'succeeded'
				state.token = action.payload.token
				state.user = action.payload.user
				localStorage.setItem(TOKEN_KEY, action.payload.token)
				localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user))
			})
			.addCase(login.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload || 'Login failed'
			})
	},
})

export const { logout } = authSlice.actions
export default authSlice.reducer
