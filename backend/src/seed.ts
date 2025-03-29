import mongoose from 'mongoose';
import BikeModel from './models/BikeModel.js';
import dotenv from 'dotenv';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

// Function to add TMR-N7 model
async function addTMRN7Model() {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI || '');
    logger.info('Connected to MongoDB');

    // Check if the model already exists
    const existingModel = await BikeModel.findOne({ name: 'TMR-N7' });
    
    if (existingModel) {
      // Update existing model with correct values
      existingModel.price = 400000;
      existingModel.is_ebicycle = true;
      existingModel.can_be_leased = false;
      existingModel.first_sale = true;
      await existingModel.save();
      logger.info('Updated TMR-N7 model');
    } else {
      // Create the new model
      const tmrN7Model = new BikeModel({
        name: 'TMR-N7',
        price: 400000,
        motor_number_prefix: 'TMRN7',
        chassis_number_prefix: 'TMRN7',
        is_ebicycle: true,
        can_be_leased: false,
        first_sale: true
      });
      
      await tmrN7Model.save();
      logger.info('Created TMR-N7 model');
    }

    logger.info('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Error in seed: ${error}`);
    process.exit(1);
  }
}

// Run the seed
addTMRN7Model(); 