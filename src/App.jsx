import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CreatePlanPage from './pages/CreatePlanPage';
import EditPlanPage from './pages/EditPlanPage';
import WorkoutSessionPage from './pages/WorkoutSessionPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <WorkoutProvider>
      <HashRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreatePlanPage />} />
              <Route path="/edit/:planId" element={<EditPlanPage />} />
              <Route path="/workout/:planId/:workoutId" element={<WorkoutSessionPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </WorkoutProvider>
  );
}
