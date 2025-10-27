import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './style.css'
import App from './App'
import Dashboard from './pages/Dashboard'
import Planning from './pages/Planning'
import Picking from './pages/Picking'
import Admin from './pages/Admin'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App/>,
    children: [
      { index: true, element: <Dashboard/> },
      { path: 'planning', element: <Planning/> },
      { path: 'picking', element: <Picking/> },
      { path: 'admin', element: <Admin/> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
