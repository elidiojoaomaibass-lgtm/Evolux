import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThankYouPage } from './components/ThankYouPage.tsx'
import { CheckoutPage } from './components/CheckoutPage.tsx'

const path = window.location.pathname;
const isThankYouPage = path === '/obrigado';
const isCheckoutPage = path === '/checkout';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isThankYouPage ? (
      <ThankYouPage />
    ) : isCheckoutPage ? (
      <CheckoutPage />
    ) : (
      <App />
    )}
  </StrictMode>,
)
