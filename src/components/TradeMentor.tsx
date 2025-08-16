import React, { useState, useEffect } from 'react';

const TradeMentor = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Placeholder for Gemini API call
    setMessage('Welcome to Trade Mentor! Connecting to real-time trade data...');
  }, []);

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-2">Trade Mentor</h2>
      <p>{message}</p>
    </div>
  );
};

export default TradeMentor;
