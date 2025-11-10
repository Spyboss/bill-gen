import apiClient from '../config/apiClient';

// Types matching backend payloads
export interface VerificationStatusResponse {
  enabled: boolean;
  verified: boolean;
  verifiedAt: string | null;
}

export interface VerificationRequestResponse {
  message: string;
}

export interface VerificationConfirmResponse {
  message: string;
}

// API calls
export const requestVerification = async (email: string): Promise<VerificationRequestResponse> => {
  const data = await apiClient.post('/api/auth/verify/request', { email });
  return data as VerificationRequestResponse;
};

export const confirmVerification = async (email: string, token: string): Promise<VerificationConfirmResponse> => {
  const data = await apiClient.post('/api/auth/verify/confirm', { email, token });
  return data as VerificationConfirmResponse;
};

export const getVerificationStatus = async (): Promise<VerificationStatusResponse> => {
  const data = await apiClient.get('/api/auth/verify/status');
  return data as VerificationStatusResponse;
};