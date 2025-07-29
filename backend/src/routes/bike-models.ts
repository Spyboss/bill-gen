import { Router } from 'express';
import { 
  getAllBikeModels, 
  getBikeModelById,
  createBikeModel,
  updateBikeModel,
  deleteBikeModel
} from '../controllers/bikeModelController.js';
import { authenticate, requireAdmin } from '../auth/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/bike-models
 * @desc    Get all bike models
 * @access  Public
 */
router.get('/', getAllBikeModels);

/**
 * @route   GET /api/bike-models/:id
 * @desc    Get bike model by ID
 * @access  Public
 */
router.get('/:id', getBikeModelById);

/**
 * @route   POST /api/bike-models
 * @desc    Create a new bike model
 * @access  Private (Admin only)
 */
router.post('/', authenticate, requireAdmin, createBikeModel);

/**
 * @route   PUT /api/bike-models/:id
 * @desc    Update a bike model
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, requireAdmin, updateBikeModel);

/**
 * @route   DELETE /api/bike-models/:id
 * @desc    Delete a bike model
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, deleteBikeModel);

export default router;