// Script to add the TMR-N7 tricycle model to the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tmr';

// Create bike model schema
const BikeModelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required']
  },
  motor_number_prefix: {
    type: String,
    required: [true, 'Motor number prefix is required'],
    trim: true
  },
  chassis_number_prefix: {
    type: String,
    required: [true, 'Chassis number prefix is required'],
    trim: true
  },
  is_ebicycle: {
    type: Boolean,
    default: false
  },
  is_tricycle: {
    type: Boolean,
    default: false
  },
  can_be_leased: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false,
  collection: 'bike_models' // Explicitly set the collection name
});

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    return mongoose.connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Run the migration
const runMigration = async () => {
  try {
    const db = await connectToMongoDB();
    
    // Create model from schema
    const BikeModel = mongoose.model('BikeModel', BikeModelSchema);
    
    // Check if TMR-N7 already exists
    const existingModel = await BikeModel.findOne({ name: 'TMR-N7' });
    
    if (existingModel) {
      console.log('TMR-N7 tricycle model already exists. Updating...');
      
      // Update the existing model
      existingModel.price = 400000;
      existingModel.motor_number_prefix = 'N7';
      existingModel.chassis_number_prefix = 'N7';
      existingModel.is_tricycle = true;
      existingModel.is_ebicycle = false;
      existingModel.can_be_leased = false;
      
      await existingModel.save();
      console.log('TMR-N7 tricycle model updated successfully');
    } else {
      console.log('Creating new TMR-N7 tricycle model...');
      
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
      console.log('TMR-N7 tricycle model created successfully');
    }

    // List all bike models
    const models = await BikeModel.find().sort({ name: 1 });
    console.log(`Current bike models in the database (${models.length}):`);
    models.forEach(model => {
      const type = model.is_tricycle ? 'E-TRICYCLE' : model.is_ebicycle ? 'E-MOTORBICYCLE' : 'E-MOTORCYCLE';
      console.log(`- ${model.name}: Rs. ${model.price.toLocaleString()} (${type})`);
    });

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error.message);
    process.exit(1);
  }
};

// Execute the migration
runMigration();