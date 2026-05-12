import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router'
import './monaco-setup'
import App from './App'
import './i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
)
