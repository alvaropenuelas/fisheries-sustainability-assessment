import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import TestLayout from './TestLayout.tsx'
import './index.css'

const Root = window.location.search.includes('test') ? TestLayout : App

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
