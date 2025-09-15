import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bootstrap CSS is loaded from Flatly theme in index.html
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import './darkmode.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
