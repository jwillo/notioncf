import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { PageView } from './components/pages/PageView'
import { Welcome } from './components/pages/Welcome'
import { DatabaseView } from './components/database/DatabaseView'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/page/:id" element={<PageView />} />
        <Route path="/database/:id" element={<DatabaseView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
