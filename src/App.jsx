import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import AdaptiveFit from '@/pages/AdaptiveFit';
import MobilityCheck from '@/pages/MobilityCheck';
import SignLearn from '@/pages/SignLearn';
import SignTranslate from '@/pages/SignTranslate';
import SignDrill from '@/pages/SignDrill';
import SignCalibrate from '@/pages/SignCalibrate';
import ModelSandbox from '@/pages/ModelSandbox';
import AgentLab from '@/pages/AgentLab';
import Whitepaper from '@/pages/Whitepaper';
import Dashboard from '@/pages/Dashboard';
import TherapistPortal from '@/pages/TherapistPortal';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<SignLearn />} />
      <Route path="/signs/translate" element={<SignTranslate />} />
      <Route path="/signs/drill" element={<SignDrill />} />
      <Route path="/signs/calibrate" element={<SignCalibrate />} />
      <Route path="/exercise" element={<AdaptiveFit />} />
      <Route path="/exercise/mobility" element={<MobilityCheck />} />
      <Route path="/sandbox" element={<ModelSandbox />} />
      <Route path="/agent-lab" element={<AgentLab />} />
      <Route path="/whitepaper" element={<Whitepaper />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/therapist" element={<TherapistPortal />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App