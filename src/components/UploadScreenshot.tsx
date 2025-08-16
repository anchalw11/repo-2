import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const UploadScreenshot: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useUser();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('screenshot', file);
    if (user?.email) {
      formData.append('email', user.email);
    }

    try {
      await axios.post('/api/upload-screenshot', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user?.token}`,
        },
      });
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to upload screenshot. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl border border-gray-700 p-8">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-400">Upload Prop Firm Dashboard</h1>
        <p className="text-gray-400 text-center mb-6">
          Please upload a screenshot of your prop firm dashboard. This helps us verify your account and tailor your experience.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="screenshot" className="block text-sm font-medium text-gray-300 mb-2">
              Screenshot File
            </label>
            <input
              type="file"
              id="screenshot"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              accept="image/png, image/jpeg"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-2 rounded-lg font-semibold transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadScreenshot;
