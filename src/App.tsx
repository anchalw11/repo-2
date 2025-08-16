import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import MembershipPlans from './components/MembershipPlans';
import PropFirmSelection from './components/PropFirmSelection';
import AccountConfiguration from './components/AccountConfiguration';
import RiskConfiguration from './components/RiskConfiguration';
import TradingPlanGeneration from './components/TradingPlanGenerator';
import PaymentFlow from './components/PaymentFlow';
import Questionnaire from './components/Questionnaire';
import RiskManagementPage from './components/RiskManagementPage';
import RiskManagementPlan from './components/RiskManagementPlan';
import ComprehensiveRiskPlan from './components/ComprehensiveRiskPlan';
import UploadScreenshot from './components/UploadScreenshot';
import TradeMentor from './components/TradeMentor';
import Dashboard from './components/Dashboard';
import DashboardConcept1 from './components/DashboardConcept1';
import DashboardConcept2 from './components/DashboardConcept2';
import DashboardConcept3 from './components/DashboardConcept3';
import DashboardConcept4 from './components/DashboardConcept4';
import ThemeSwitcher from './components/ThemeSwitcher';
import AdminMpinLogin from './components/AdminMpinLogin';
import AdminDashboard from './components/AdminDashboard';
import AffiliateLinks from './components/AffiliateLinks';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import { UserProvider, useUser } from './contexts/UserContext';
import { TradingPlanProvider, useTradingPlan } from './contexts/TradingPlanContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { clearState } from './trading/dataStorage';
import Features from './components/Features';
import About from './components/About';
import Terms from './components/Terms';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQ from './components/FAQ';
import { SignalDistributionProvider } from './components/SignalDistributionService';
import FuturisticCursor from './components/FuturisticCursor';
import FuturisticBackground from './components/FuturisticBackground';
import CustomerServiceMpinLogin from './components/CustomerServiceMpinLogin';
import EnhancedCustomerServiceDashboard from './components/EnhancedCustomerServiceDashboard';

const AppContent = () => {
  const [theme, setTheme] = useState(localStorage.getItem('dashboard-theme') || 'concept1');
  const { logout: userLogout } = useUser();
  const { logout: adminLogout } = useAdmin();
  const { resetPlan } = useTradingPlan();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedTheme = localStorage.getItem('dashboard-theme');
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  const handleLogout = () => {
    userLogout();
    resetPlan();
    clearState();
    navigate('/signin');
  };

  const handleAdminLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  const handleThemeChange = (selectedTheme: string) => {
    setTheme(selectedTheme);
    localStorage.setItem('dashboard-theme', selectedTheme);
  };

  const renderDashboard = () => {
    switch (theme) {
      case 'concept1':
        return <DashboardConcept1 onLogout={handleLogout} />;
      case 'concept2':
        return <DashboardConcept2 onLogout={handleLogout} />;
      case 'concept3':
        return <DashboardConcept3 onLogout={handleLogout} />;
      case 'concept4':
        return <DashboardConcept4 onLogout={handleLogout} />;
      default:
        return <Dashboard onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen">
      <FuturisticBackground />
      <FuturisticCursor />
      {location.pathname.startsWith('/dashboard') && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999 }}>
          <ThemeSwitcher onThemeChange={handleThemeChange} />
        </div>
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/membership" element={<MembershipPlans />} />
        <Route path="/payment" element={<PaymentFlow />} />
        <Route path="/questionnaire" element={<Questionnaire />} />
        <Route path="/risk-management" element={<RiskManagementPage />} />
        <Route path="/risk-management-plan" element={<RiskManagementPlan />} />
        <Route path="/comprehensive-risk-plan" element={<ComprehensiveRiskPlan />} />
        <Route path="/upload-screenshot" element={<UploadScreenshot />} />
        <Route path="/setup/prop-firm" element={<PropFirmSelection />} />
        <Route path="/setup/account" element={<AccountConfiguration />} />
        <Route path="/setup/risk" element={<RiskConfiguration />} />
        <Route path="/setup/plan" element={<TradingPlanGeneration />} />
        <Route
          path="/dashboard/:tab"
          element={
            <ProtectedRoute>
              {renderDashboard()}
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {renderDashboard()}
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<AdminMpinLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard onLogout={handleAdminLogout} />
            </AdminProtectedRoute>
          }
        />
        <Route path="/affiliate-links" element={<AffiliateLinks />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/trade-mentor/:tradeId" element={<TradeMentor />} />
        <Route path="/customer-service" element={<CustomerServiceMpinLogin />} />
        <Route
          path="/customer-service/dashboard"
          element={
            <ProtectedRoute>
              <EnhancedCustomerServiceDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <SignalDistributionProvider>
      <AdminProvider>
        <UserProvider>
          <TradingPlanProvider>
            <Router>
              <AppContent />
            </Router>
          </TradingPlanProvider>
        </UserProvider>
      </AdminProvider>
    </SignalDistributionProvider>
  );
}

export default App;
