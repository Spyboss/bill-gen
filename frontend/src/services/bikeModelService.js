import apiClient from './apiClient';

/**
 * Get all bike models
 * @returns {Promise} - Promise with bike models data
 */
export const getAllBikeModels = async () => {
  try {
    const response = await apiClient.get('/bike-models');
    return response;
  } catch (error) {
    console.error('Error fetching bike models:', error);
    throw error;
  }
};

/**
 * Get bike model by ID
 * @param {string} id - Bike model ID
 * @returns {Promise} - Promise with bike model data
 */
export const getBikeModelById = async (id) => {
  try {
    const response = await apiClient.get(`/bike-models/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching bike model:', error);
    throw error;
  }
};

/**
 * Create a new bike model
 * @param {Object} data - Bike model data
 * @returns {Promise} - Promise with created bike model
 */
export const createBikeModel = async (data) => {
  try {
    const response = await apiClient.post('/bike-models', data);
    return response;
  } catch (error) {
    console.error('Error creating bike model:', error);
    throw error;
  }
};

/**
 * Update a bike model
 * @param {string} id - Bike model ID
 * @param {Object} data - Updated bike model data
 * @returns {Promise} - Promise with updated bike model
 */
export const updateBikeModel = async (id, data) => {
  try {
    const response = await apiClient.put(`/bike-models/${id}`, data);
    return response;
  } catch (error) {
    console.error('Error updating bike model:', error);
    throw error;
  }
};

/**
 * Delete a bike model
 * @param {string} id - Bike model ID
 * @returns {Promise} - Promise with deletion result
 */
export const deleteBikeModel = async (id) => {
  try {
    const response = await apiClient.delete(`/bike-models/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting bike model:', error);
    throw error;
  }
};

export default {
  getAllBikeModels,
  getBikeModelById,
  createBikeModel,
  updateBikeModel,
  deleteBikeModel
};
