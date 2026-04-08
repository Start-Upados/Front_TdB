import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//import tailwindcss from '@tailwindcss/vite'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)