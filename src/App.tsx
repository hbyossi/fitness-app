import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CreatePlanPage from './pages/CreatePlanPage';
import EditPlanPage from './pages/EditPlanPage';
import ViewPlanPage from './pages/ViewPlanPage';
import WorkoutSessionPage from './pages/WorkoutSessionPage';
import HistoryPage from './pages/HistoryPage';
import ExerciseBankPage from './pages/ExerciseBankPage';
import WorkoutSummaryPage from './pages/WorkoutSummaryPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreatePlanPage />} />
              <Route path="/edit/:planId" element={<EditPlanPage />} />
              <Route path="/plan/:planId" element={<ViewPlanPage />} />
              <Route path="/workout/:planId/:workoutId" element={<WorkoutSessionPage />} />
              <Route path="/summary" element={<WorkoutSummaryPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/bank" element={<ExerciseBankPage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AppProvider>
    </ErrorBoundary>
  );
}
