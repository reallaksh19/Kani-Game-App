import React from 'react';

export const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-white">Loading questions...</p>
  </div>
);

export default LoadingSpinner;
