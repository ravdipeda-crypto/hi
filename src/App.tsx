import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import Welcome from './screens/Welcome';
import Today from './screens/Today';
import Timer from './screens/Timer';
import Commitments from './screens/Commitments';
import NewCommitment from './screens/NewCommitment';
import CommitmentDetail from './screens/CommitmentDetail';
import ProgressScreen from './screens/Progress';
import Settings from './screens/Settings';

export default function App() {
  const { loading, settings } = useApp();

  if (loading) {
    return (
      <div className="app-loading" role="status">
        <span className="mono">LOADING…</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={settings.hasOnboarded ? <Navigate to="/today" replace /> : <Welcome />}
      />
      <Route
        element={settings.hasOnboarded ? <Layout /> : <Navigate to="/" replace />}
      >
        <Route path="/today" element={<Today />} />
        <Route path="/timer" element={<Timer />} />
        <Route path="/commitments" element={<Commitments />} />
        <Route path="/new-commitment" element={<NewCommitment />} />
        <Route path="/commitments/:id" element={<CommitmentDetail />} />
        <Route path="/progress" element={<ProgressScreen />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
