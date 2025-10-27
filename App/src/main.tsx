import React from 'react'
import { createRoot } from 'react-dom/client'
import AppShell from './AppShell'
import './index.css'
import { Toaster } from 'sonner'

const root = createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <AppShell />
    <Toaster richColors position="top-right" />
  </React.StrictMode>
)
