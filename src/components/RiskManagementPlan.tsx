import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const RiskManagementPlan: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { answers, plan, fromQuestionnaire, questionnaireData } = location.state || {};

  // Handle case where we come from questionnaire with data
  useEffect(() => {
    if (fromQuestionnaire && questionnaireData) {
      // Generate plan based on questionnaire data
      // This is a simplified example - you'll need to implement your actual plan generation logic
      const generatedPlan = {
        tradesToPass: 10, // Example value
        riskAmount: 100, // Example value
        profitAmount: 200 // Example value
      };
      
      // Store the generated plan in state
      setPlan(generatedPlan);
      
      // Automatically save the plan and redirect to dashboard after a delay
      const timer = setTimeout(() => {
        // Save plan to backend
        savePlanToBackend(generatedPlan);
        // Redirect to dashboard
        navigate('/dashboard');
      }, 5000); // 5 second delay to show the plan
      
      return () => clearTimeout(timer);
    }
  }, [fromQuestionnaire, questionnaireData, navigate]);
  
  const [currentPlan, setPlan] = useState(plan);
  
  const savePlanToBackend = async (planData: any) => {
    try {
      // Replace with your actual API call to save the plan
      await fetch('/api/user/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          plan: planData,
          questionnaire: questionnaireData
        })
      });
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  if ((!answers || !currentPlan) && !fromQuestionnaire) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p>No data available to generate a plan.</p>
        <button
          onClick={() => navigate('/questionnaire')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Questionnaire
        </button>
      </div>
    );
  }

  const { propFirm, accountSize, riskPercentage } = answers;
  const { tradesToPass, riskAmount, profitAmount } = plan;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-4 text-center text-blue-400">Your Trading Plan</h1>
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-semibold mb-6">Prop Firm Challenge Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Account Details</h3>
            <p><span className="font-medium text-gray-300">Prop Firm:</span> {propFirm}</p>
            <p><span className="font-medium text-gray-300">Account Size:</span> ${Number(accountSize).toLocaleString()}</p>
            <p><span className="font-medium text-gray-300">Risk Per Trade:</span> {riskPercentage}%</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Challenge Targets</h3>
            <p><span className="font-medium text-gray-300">Trades to Pass:</span> {tradesToPass}</p>
            <p><span className="font-medium text-gray-300">Risk per Trade:</span> ${riskAmount.toFixed(2)}</p>
            <p><span className="font-medium text-gray-300">Target per Trade (1:2 R:R):</span> ${profitAmount.toFixed(2)}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Trade-by-Trade Plan</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-700">Trade</th>
                  <th className="py-2 px-4 border-b border-gray-700">Risk Amount</th>
                  <th className="py-2 px-4 border-b border-gray-700">Profit Target</th>
                  <th className="py-2 px-4 border-b border-gray-700">Cumulative Profit</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: tradesToPass }, (_, i) => (
                  <tr key={i}>
                    <td className="py-2 px-4 border-b border-gray-700">Trade {i + 1}</td>
                    <td className="py-2 px-4 border-b border-gray-700 text-red-400">${riskAmount.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b border-gray-700 text-green-400">${profitAmount.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b border-gray-700">${(profitAmount * (i + 1)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="text-center mt-8">
          {user?.membershipTier === 'kickstarter' ? (
            <button
              onClick={() => navigate('/upload-screenshot')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Proceed to Upload Screenshot
            </button>
          ) : (
            <button
              onClick={() => {
                if (fromQuestionnaire) {
                  savePlanToBackend(currentPlan);
                }
                navigate('/dashboard');
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              {fromQuestionnaire ? 'Save Plan & Go to Dashboard' : 'Proceed to Dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskManagementPlan;
