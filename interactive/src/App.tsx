import { Route, Routes, useParams } from 'react-router-dom';
import Hub from './pages/Hub';
import DayPage from './pages/DayPage';
import NotFound from './pages/NotFound';

// Keying DayPage by slug forces a full remount when navigating between days,
// so per-attempt state (debrief, mistakes, timer) never bleeds across days.
function DayPageRoute() {
  const { slug } = useParams();
  return <DayPage key={slug} />;
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div id="main">
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/day/:slug" element={<DayPageRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
