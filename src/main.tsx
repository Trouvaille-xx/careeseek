import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { useAppStore } from './stores/useAppStore'
import { applyTheme } from './utils/theme'
import './index.css'

applyTheme(useAppStore.getState().themeMode)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
