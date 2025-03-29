import mongoose, { Document, Schema } from 'mongoose';

// Define interface for bill document
export interface IBill extends Document {
  // Bill identification
  billNumber: string;
  bill_number: string;
  billDate: Date;
  status: 'pending' | 'completed' | 'cancelled';
  
  // Customer details
  customerName: string;
  customerNIC: string;
  customerAddress: string;
  
  // Bike details
  bikeModel: string;
  motorNumber: string;
  chassisNumber: string;
  bikePrice: number;
  vehicleType?: string; // Added for displaying vehicle type
  
  // Bill type
  billType: 'cash' | 'leasing';
  isEbicycle: boolean;
  isTricycle: boolean; // Added for tricycles
  
  // RMV/CPZ charges
  rmvCharge: number;
  
  // Leasing details
  downPayment?: number;
  
  // Advance payment details
  isAdvancePayment: boolean;
  advanceAmount?: number;
  balanceAmount?: number;
  estimatedDeliveryDate?: Date;
  
  // Special handling for first tricycle sale
  isFirstTricycleSale?: boolean;
  
  // Other details
  totalAmount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema = new Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  bill_number: {
    type: String,
    unique: true,
    sparse: true
  },
  billDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Customer details
  customerName: {
    type: String,
    required: true
  },
  customerNIC: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String,
    required: true
  },
  
  // Bike details
  bikeModel: {
    type: String,
    required: true
  },
  motorNumber: {
    type: String,
    required: true
  },
  chassisNumber: {
    type: String,
    required: true
  },
  bikePrice: {
    type: Number,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['E-MOTORCYCLE', 'E-MOTORBICYCLE', 'E-TRICYCLE'],
    default: 'E-MOTORCYCLE'
  },
  
  // Bill type
  billType: {
    type: String,
    enum: ['cash', 'leasing'],
    required: true,
    default: 'cash'
  },
  isEbicycle: {
    type: Boolean,
    default: false
  },
  isTricycle: {
    type: Boolean,
    default: false
  },
  
  // RMV/CPZ charges
  rmvCharge: {
    type: Number,
    default: 13000
  },
  
  // Leasing details
  downPayment: {
    type: Number
  },
  
  // Advance payment details
  isAdvancePayment: {
    type: Boolean,
    default: false
  },
  advanceAmount: {
    type: Number
  },
  balanceAmount: {
    type: Number
  },
  estimatedDeliveryDate: {
    type: Date
  },
  
  // Special handling for first tricycle sale
  isFirstTricycleSale: {
    type: Boolean,
    default: false
  },
  
  // Other details
  totalAmount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { 
    transform: function (doc, ret) {
      // Ensure billNumber and bill_number are in sync
      if (ret.billNumber && !ret.bill_number) {
        ret.bill_number = ret.billNumber;
      } else if (ret.bill_number && !ret.billNumber) {
        ret.billNumber = ret.bill_number;
      }
      return ret;
    } 
  }
});

// Generate bill number BEFORE validation
BillSchema.pre('validate', function(this: any, next) {
  if (this.isNew && !this.billNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.billNumber = `BILL-${year}${month}${day}-${random}`;
    
    // Also set bill_number for backward compatibility
    this.bill_number = this.billNumber;
  }
  next();
});

// Set vehicle type based on e-bicycle and tricycle flags
BillSchema.pre('validate', function(this: any, next) {
  // Set vehicle type based on flags
  if (this.isTricycle) {
    this.vehicleType = 'E-TRICYCLE';
  } else if (this.isEbicycle) {
    this.vehicleType = 'E-MOTORBICYCLE';
  } else {
    this.vehicleType = 'E-MOTORCYCLE';
  }

  // For first tricycle sale check
  if (this.isTricycle && this.isNew) {
    // Check if this is the first tricycle sale
    mongoose.model('Bill').countDocuments({ isTricycle: true }).then((count) => {
      if (count === 0) {
        this.isFirstTricycleSale = true;
      }
      next();
    }).catch(err => {
      console.error('Error checking for first tricycle sale:', err);
      next();
    });
  } else {
    next();
  }
});

// Always ensure bill_number matches billNumber before saving
BillSchema.pre('save', function(this: any, next) {
  if (this.billNumber) {
    this.bill_number = this.billNumber;
  } else if (this.bill_number) {
    this.billNumber = this.bill_number;
  }
  
  // Set default status based on bill type if it's a new document
  if (this.isNew && this.status === 'pending') {
    // If it's an advancement bill, keep it as pending
    // If it's a regular bill, set it to completed
    const isAdvancement = this.isAdvancePayment || this.is_advance_payment;
    if (!isAdvancement) {
      this.status = 'completed';
    }
  }
  
  next();
});

const Bill = mongoose.model<IBill>('Bill', BillSchema);

export default Bill; 