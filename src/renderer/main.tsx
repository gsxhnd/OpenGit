import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App'
import './i18n'
import './index.css'
import { TooltipProvider } from './components/ui/tooltip'
import {} from "@dnd-kit/helpers"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TooltipProvider delay={400} closeDelay={0}>
    <HashRouter>
      <App />
    </HashRouter>
  </TooltipProvider>,
)
