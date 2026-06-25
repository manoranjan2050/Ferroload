import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import RssManager from './pages/RssManager'
import SettingsPage from './pages/SettingsPage'
import AiPage from './pages/AiPage'
import AboutPage from './pages/AboutPage'
import { useEffect } from 'react'
import { useSettingsStore } from './stores/settingsStore'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 } },
})

function AppInit() {
  const { setAiAvailable } = useSettingsStore()

  useEffect(() => {
    fetch('/api/v1/ai/status')
      .then((r) => r.json())
      .then((d) => setAiAvailable(d.data?.available ?? false))
      .catch(() => setAiAvailable(false))
  }, [])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInit />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rss" element={<RssManager />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/ai" element={<AiPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
