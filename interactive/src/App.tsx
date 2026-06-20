import { Route, Routes } from 'react-router-dom';
import Hub from './pages/Hub';
import DayPage from './pages/DayPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div id="main">
        <Routes>
          <Route path="/" element={<Hub />} />
          <Route path="/day/:slug" element={<DayPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}
