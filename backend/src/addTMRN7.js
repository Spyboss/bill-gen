const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define BikeModel schema
const BikeModelSchema = new mongoose.Schema({
  name: String,
  price: Number,
  motor_number_prefix: String,
  chassis_number_prefix: String,
  is_ebicycle: Boolean,
  can_be_leased: Boolean,
  first_sale: Boolean,
  vehicle_type: {
    type: String,
    default: 'Motorcycle',
    enum: ['Motorcycle', 'Electric Bicycle', 'Electric Tricycle']
  }
}, {
  timestamps: true,
  versionKey: false,
  collection: 'bike_models'
});

// Create model
const BikeModel = mongoose.model('BikeModel', BikeModelSchema);

// Function to add TMR-N7 model
async function addTMRN7() {
  try {
    // Check if model already exists
    const existingModel = await BikeModel.findOne({ name: 'TMR-N7' });
    
    if (existingModel) {
      // Update existing model
      console.log('Updating existing TMR-N7 model...');
      existingModel.price = 400000;
      existingModel.is_ebicycle = true;
      existingModel.can_be_leased = false;
      existingModel.first_sale = true;
      existingModel.vehicle_type = 'Electric Tricycle';
      await existingModel.save();
      console.log('TMR-N7 model updated successfully!');
    } else {
      // Create new model
      console.log('Creating new TMR-N7 model...');
      const tmrN7 = new BikeModel({
        name: 'TMR-N7',
        price: 400000,
        motor_number_prefix: 'TMRN7',
        chassis_number_prefix: 'TMRN7',
        is_ebicycle: true,
        can_be_leased: false,
        first_sale: true,
        vehicle_type: 'Electric Tricycle'
      });
      
      await tmrN7.save();
      console.log('TMR-N7 model created successfully!');
    }
    
    // Exit when done
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
addTMRN7(); 