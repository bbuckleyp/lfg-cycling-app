import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreateRide from './pages/CreateRide';
import EditRide from './pages/EditRide';
import Rides from './pages/Rides';
import RideDetail from './pages/RideDetail';
import Dashboard from './pages/Dashboard';
import StravaCallback from './pages/StravaCallback';

// Placeholder components
const Home = () => (
  <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
        Welcome to <span className="text-primary-600">LFG</span> Cycling
      </h1>
      <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
        Connect with cyclists in your area and discover amazing group rides. Import routes from Strava and join the cycling community.
      </p>
      <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
        <div className="rounded-md shadow">
          <a
            href="/register"
            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
          >
            Get Started
          </a>
        </div>
        <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
          <a
            href="/rides"
            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
          >
            Browse Rides
          </a>
        </div>
      </div>
    </div>
  </div>
);




function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/rides" element={<Rides />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-ride"
                element={
                  <ProtectedRoute>
                    <CreateRide />
                  </ProtectedRoute>
                }
              />
              <Route path="/rides/:rideId" element={<RideDetail />} />
              <Route
                path="/rides/:rideId/edit"
                element={
                  <ProtectedRoute>
                    <EditRide />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth/strava/callback" element={<StravaCallback />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;