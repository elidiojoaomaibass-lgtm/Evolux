import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThankYouPage } from './components/ThankYouPage.tsx'

const isThankYouPage = window.location.pathname === '/obrigado';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isThankYouPage ? <ThankYouPage /> : <App />}
  </StrictMode>,
)
