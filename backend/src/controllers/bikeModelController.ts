import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import BikeModel from '../models/BikeModel.js';
import logger from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get all bike models
 * @route GET /api/bike-models
 * @access Public
 */
export const getAllBikeModels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bikeModels = await BikeModel.find().sort({ make: 1, bikeModel: 1 });
    res.status(200).json(bikeModels);
  } catch (error) {
    logger.error(`Error getting bike models: ${(error as Error).message}`);
    next(new AppError(`Failed to fetch bike models: ${(error as Error).message}`, 500));
  }
};

/**
 * Get bike model by ID
 * @route GET /api/bike-models/:id
 * @access Public
 */
export const getBikeModelById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid bike model ID', 400));
    }
    
    const bikeModel = await BikeModel.findById(id);
    
    if (!bikeModel) {
      return next(new AppError('Bike model not found', 404));
    }
    
    res.status(200).json(bikeModel);
  } catch (error) {
    logger.error(`Error getting bike model: ${(error as Error).message}`);
    next(new AppError(`Failed to fetch bike model: ${(error as Error).message}`, 500));
  }
};

/**
 * Create a new bike model
 * @route POST /api/bike-models
 * @access Private
 */
export const createBikeModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const bikeModel = new BikeModel(req.body);
    const savedBikeModel = await bikeModel.save();
    res.status(201).json(savedBikeModel);
  } catch (error) {
    logger.error(`Error creating bike model: ${(error as Error).message}`);
    next(new AppError(`Failed to create bike model: ${(error as Error).message}`, 400));
  }
};

/**
 * Add the TMR-N7 electric tricycle model
 * @route POST /api/bike-models/add-tmr-n7
 * @access Private
 */
export const addTMRN7Model = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if model already exists
    const existingModel = await BikeModel.findOne({ name: 'TMR-N7' });
    
    if (existingModel) {
      // Update the existing model
      existingModel.price = 400000;
      existingModel.is_ebicycle = true;
      existingModel.can_be_leased = false;
      existingModel.first_sale = true;
      
      const updatedModel = await existingModel.save();
      res.status(200).json(updatedModel);
      return;
    }
    
    // Create the TMR-N7 model
    const tmrN7Model = new BikeModel({
      name: 'TMR-N7',
      price: 400000,
      motor_number_prefix: 'TMRN7',
      chassis_number_prefix: 'TMRN7',
      is_ebicycle: true,
      can_be_leased: false,
      first_sale: true
    });
    
    const savedModel = await tmrN7Model.save();
    res.status(201).json(savedModel);
  } catch (error) {
    logger.error(`Error adding TMR-N7 model: ${(error as Error).message}`);
    next(new AppError(`Failed to add TMR-N7 model: ${(error as Error).message}`, 400));
  }
};

/**
 * Update bike model
 * @route PUT /api/bike-models/:id
 * @access Private
 */
export const updateBikeModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { make, model, year } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid bike model ID', 400));
    }
    
    const updateData: Record<string, any> = {};
    if (make) updateData.make = make;
    if (model) updateData.bikeModel = model;
    if (year) updateData.year = parseInt(year);
    
    const updatedModel = await BikeModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedModel) {
      return next(new AppError('Bike model not found', 404));
    }
    
    res.status(200).json(updatedModel);
  } catch (error) {
    // Check for validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation error: ${messages.join(', ')}`, 400));
    }
    
    // Check for duplicate key error
    if ((error as any).code === 11000) {
      return next(new AppError('Bike model with this make, model, and year already exists', 400));
    }
    
    logger.error(`Error updating bike model: ${(error as Error).message}`);
    next(new AppError(`Failed to update bike model: ${(error as Error).message}`, 500));
  }
};

/**
 * Delete bike model
 * @route DELETE /api/bike-models/:id
 * @access Private
 */
export const deleteBikeModel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid bike model ID', 400));
    }
    
    const deletedModel = await BikeModel.findByIdAndDelete(id);
    
    if (!deletedModel) {
      return next(new AppError('Bike model not found', 404));
    }
    
    res.status(200).json({ message: 'Bike model deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting bike model: ${(error as Error).message}`);
    next(new AppError(`Failed to delete bike model: ${(error as Error).message}`, 500));
  }
}; 