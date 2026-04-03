import { createContext, useContext } from 'react'

export const ThemeContext = createContext({ theme: 'light' })

export function useThemeContext() {
	return useContext(ThemeContext)
}
