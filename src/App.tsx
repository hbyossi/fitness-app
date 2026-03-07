import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';

const HomePage = lazy(() => import('./pages/HomePage'));
const CreatePlanPage = lazy(() => import('./pages/CreatePlanPage'));
const EditPlanPage = lazy(() => import('./pages/EditPlanPage'));
const ViewPlanPage = lazy(() => import('./pages/ViewPlanPage'));
const WorkoutSessionPage = lazy(() => import('./pages/WorkoutSessionPage'));
const WorkoutSummaryPage = lazy(() => import('./pages/WorkoutSummaryPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ExerciseBankPage = lazy(() => import('./pages/ExerciseBankPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏋️</div>
        <div>טוען...</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/create" element={<CreatePlanPage />} />
                  <Route path="/edit/:planId" element={<EditPlanPage />} />
                  <Route path="/plan/:planId" element={<ViewPlanPage />} />
                  <Route path="/workout/:planId/:workoutId" element={<WorkoutSessionPage />} />
                  <Route path="/summary" element={<WorkoutSummaryPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/bank" element={<ExerciseBankPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
