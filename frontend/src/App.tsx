import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EventDetail from './pages/EventDetail';
import SearchPage from './pages/SearchPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;