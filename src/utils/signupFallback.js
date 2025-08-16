// Immediate fallback for signup errors - works without deployment
window.handleSignupFallback = function(formData, selectedPlan, navigate, login, setShowTempNotice) {
  console.log('Executing signup fallback...');
  
  // Generate a temporary token
  const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('access_token', tempToken);
  
  const userData = {
    id: `temp_user_${Date.now()}`,
    name: `${formData.firstName} ${formData.lastName}`,
    email: formData.email,
    membershipTier: selectedPlan.name.toLowerCase(),
    accountType: 'personal',
    riskTolerance: 'moderate',
    isAuthenticated: true,
    setupComplete: false,
    selectedPlan,
    token: tempToken,
    isTemporary: true,
  };

  login(userData, tempToken);
  localStorage.setItem('user_data', JSON.stringify(userData));
  localStorage.setItem('temp_signup_data', JSON.stringify({
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    password: formData.password,
    plan_type: selectedPlan.name.toLowerCase(),
    timestamp: Date.now()
  }));

  // Show notification and navigate
  if (setShowTempNotice) setShowTempNotice(true);
  navigate('/payment', { state: { selectedPlan } });
  
  return true;
};
