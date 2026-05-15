import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import './i18n'
import './index.css'
import { TooltipProvider } from './components/ui/tooltip'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TooltipProvider delay={350} closeDelay={80}>
    <HashRouter>
      <App />
    </HashRouter>
  </TooltipProvider>,
)
