import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { PageView } from './components/pages/PageView'
import { Welcome } from './components/pages/Welcome'
import { DatabaseView } from './components/database/DatabaseView'
import { Settings } from './components/pages/Settings'
import { ExcalidrawPage } from './components/draw/ExcalidrawPage'

function App() {
  return (
    <Routes>
      <Route path="/draw" element={<ExcalidrawPage />} />
      <Route path="/draw/:id" element={<ExcalidrawPage />} />
      <Route path="*" element={
        <AppShell>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/page/:id" element={<PageView />} />
            <Route path="/database/:id" element={<DatabaseView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      } />
    </Routes>
  )
}

export default App
