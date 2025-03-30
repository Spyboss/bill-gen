// Script to add the TMR-N7 tricycle model to the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BikeModel from '../models/BikeModel.js';
import { connectToMongoose } from '../config/database.js';
import logger from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const run = async () => {
  try {
    await connectToMongoose();
    logger.info('Connected to MongoDB');

    // Check if TMR-N7 already exists
    const existingModel = await BikeModel.findOne({ name: 'TMR-N7' });
    
    if (existingModel) {
      logger.info('TMR-N7 tricycle model already exists. Updating...');
      
      // Update the existing model
      existingModel.price = 400000;
      existingModel.motor_number_prefix = 'N7';
      existingModel.chassis_number_prefix = 'N7';
      existingModel.is_tricycle = true;
      existingModel.is_ebicycle = false;
      existingModel.can_be_leased = false;
      
      await existingModel.save();
      logger.info('TMR-N7 tricycle model updated successfully');
    } else {
      logger.info('Creating new TMR-N7 tricycle model...');
      
      // Create new TMR-N7 model
      const tricycleModel = new BikeModel({
        name: 'TMR-N7',
        price: 400000,
        motor_number_prefix: 'N7',
        chassis_number_prefix: 'N7',
        is_tricycle: true,
        is_ebicycle: false,
        can_be_leased: false
      });
      
      await tricycleModel.save();
      logger.info('TMR-N7 tricycle model created successfully');
    }

    // List all bike models
    const models = await BikeModel.find().sort({ name: 1 });
    logger.info(`Current bike models in the database (${models.length}):`);
    models.forEach(model => {
      const type = model.is_tricycle ? 'E-TRICYCLE' : model.is_ebicycle ? 'E-MOTORBICYCLE' : 'E-MOTORCYCLE';
      logger.info(`- ${model.name}: Rs. ${model.price.toLocaleString()} (${type})`);
    });

    logger.info('Script completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

run(); 