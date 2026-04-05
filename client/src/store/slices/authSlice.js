import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import authService from '../../services/authService'

const TOKEN_KEY = 'pos_token'
const USER_KEY = 'pos_user'
const TENANT_KEY = 'pos_tenant'
const SUBSCRIPTION_KEY = 'pos_subscription'
const PLAN_FEATURES_KEY = 'pos_plan_features'
const SUPERADMIN_KEY = 'pos_is_super_admin'

function safeJsonParse(value, fallback) {
	try {
		return JSON.parse(value)
	} catch {
		return fallback
	}
}

function setSessionStorage(payload) {
	localStorage.setItem(TOKEN_KEY, payload.token)
	localStorage.setItem(USER_KEY, JSON.stringify(payload.user || null))
	localStorage.setItem(TENANT_KEY, JSON.stringify(payload.tenant || null))
	localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(payload.subscription || null))
	localStorage.setItem(PLAN_FEATURES_KEY, JSON.stringify(payload.planFeatures || null))
	localStorage.setItem(SUPERADMIN_KEY, JSON.stringify(Boolean(payload.isSuperAdmin)))
}

const initialState = {
	token: localStorage.getItem(TOKEN_KEY) || null,
	user: safeJsonParse(localStorage.getItem(USER_KEY), null),
	tenant: safeJsonParse(localStorage.getItem(TENANT_KEY), null),
	subscription: safeJsonParse(localStorage.getItem(SUBSCRIPTION_KEY), null),
	planFeatures: safeJsonParse(localStorage.getItem(PLAN_FEATURES_KEY), null),
	isSuperAdmin: safeJsonParse(localStorage.getItem(SUPERADMIN_KEY), false),
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
			state.tenant = null
			state.subscription = null
			state.planFeatures = null
			state.isSuperAdmin = false
			state.status = 'idle'
			state.error = null
			localStorage.removeItem(TOKEN_KEY)
			localStorage.removeItem(USER_KEY)
			localStorage.removeItem(TENANT_KEY)
			localStorage.removeItem(SUBSCRIPTION_KEY)
			localStorage.removeItem(PLAN_FEATURES_KEY)
			localStorage.removeItem(SUPERADMIN_KEY)
		},
		setSession(state, action) {
			state.token = action.payload.token || null
			state.user = action.payload.user || null
			state.tenant = action.payload.tenant || null
			state.subscription = action.payload.subscription || null
			state.planFeatures = action.payload.planFeatures || null
			state.isSuperAdmin = Boolean(action.payload.isSuperAdmin)
			state.status = 'succeeded'
			state.error = null
			setSessionStorage(action.payload)
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
				state.tenant = action.payload.tenant || null
				state.subscription = action.payload.subscription || null
				state.planFeatures = action.payload.planFeatures || null
				state.isSuperAdmin = Boolean(action.payload.isSuperAdmin)
				setSessionStorage(action.payload)
			})
			.addCase(login.rejected, (state, action) => {
				state.status = 'failed'
				state.error = action.payload || 'Login failed'
			})
	},
})

export const { logout, setSession } = authSlice.actions
export default authSlice.reducer
