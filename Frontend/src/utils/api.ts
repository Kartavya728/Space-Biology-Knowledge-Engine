// API service for connecting to the Django backend

interface AnalysisRequest {
  query: string;
  userType?: string;
  analyst?: string;
}

interface AnalysisResponse {
  response: any;
  analysis_type: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const api = {
  /**
   * Perform scientific analysis
   */
  scientificAnalysis: async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/scientific/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Scientific analysis error:', error);
      throw error;
    }
  },

  /**
   * Perform investment analysis
   */
  investmentAnalysis: async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/investment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Investment analysis error:', error);
      throw error;
    }
  },

  /**
   * Perform mission planning analysis
   */
  missionAnalysis: async (request: AnalysisRequest): Promise<AnalysisResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/analysis/mission/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Mission analysis error:', error);
      throw error;
    }
  },

  /**
   * Get the appropriate analysis function based on user type
   */
  getAnalysisFunction: (userType: string) => {
    switch (userType) {
      case 'scientist':
        return api.scientificAnalysis;
      case 'investor':
        return api.investmentAnalysis;
      case 'mission-architect':
        return api.missionAnalysis;
      default:
        return api.scientificAnalysis; // Default to scientific analysis
    }
  }
};