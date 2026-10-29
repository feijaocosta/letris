import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App.tsx'
import { I18nProvider } from '../lib/i18n'
import { migrateRecords } from '../lib/storage'
import '@fontsource-variable/nunito'
import '../styles/globals.css'

// Recordes antigos (sem idioma) eram do jogo em português
migrateRecords('pt')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)