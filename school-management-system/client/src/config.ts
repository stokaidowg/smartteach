// API Configuration
// This file contains the base API URL for the backend server

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Helper function to build API URLs
export const apiUrl = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};
