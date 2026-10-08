import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '@/components/AppShell'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const ContentList = lazy(() => import('@/pages/ContentList'))
const ContentBoard = lazy(() => import('@/pages/ContentBoard'))
const ContentCalendar = lazy(() => import('@/pages/ContentCalendar'))
const ContentDetail = lazy(() => import('@/pages/ContentDetail'))
const Ideas = lazy(() => import('@/pages/Ideas'))
const Campaigns = lazy(() => import('@/pages/Campaigns'))
const Assets = lazy(() => import('@/pages/Assets'))
const Scripts = lazy(() => import('@/pages/Scripts'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const AIStudio = lazy(() => import('@/pages/AIStudio'))
const Team = lazy(() => import('@/pages/Team'))
const Reports = lazy(() => import('@/pages/Reports'))
const SettingsPage = lazy(() => import('@/pages/Settings'))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex items-center gap-2.5 text-ink-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-600 border-t-brand-500" />
        <span className="text-[13px]">Memuat...</span>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/content"
          element={
            <Suspense fallback={<PageLoader />}>
              <ContentList />
            </Suspense>
          }
        />
        <Route
          path="/content/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <ContentDetail />
            </Suspense>
          }
        />
        <Route
          path="/board"
          element={
            <Suspense fallback={<PageLoader />}>
              <ContentBoard />
            </Suspense>
          }
        />
        <Route
          path="/calendar"
          element={
            <Suspense fallback={<PageLoader />}>
              <ContentCalendar />
            </Suspense>
          }
        />
        <Route
          path="/ideas"
          element={
            <Suspense fallback={<PageLoader />}>
              <Ideas />
            </Suspense>
          }
        />
        <Route
          path="/campaigns"
          element={
            <Suspense fallback={<PageLoader />}>
              <Campaigns />
            </Suspense>
          }
        />
        <Route
          path="/assets"
          element={
            <Suspense fallback={<PageLoader />}>
              <Assets />
            </Suspense>
          }
        />
        <Route
          path="/scripts"
          element={
            <Suspense fallback={<PageLoader />}>
              <Scripts />
            </Suspense>
          }
        />
        <Route
          path="/analytics"
          element={
            <Suspense fallback={<PageLoader />}>
              <Analytics />
            </Suspense>
          }
        />
        <Route
          path="/ai"
          element={
            <Suspense fallback={<PageLoader />}>
              <AIStudio />
            </Suspense>
          }
        />
        <Route
          path="/team"
          element={
            <Suspense fallback={<PageLoader />}>
              <Team />
            </Suspense>
          }
        />
        <Route
          path="/reports"
          element={
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes