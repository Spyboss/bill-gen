# Adding New Features

This document outlines the process for adding new features to the Bill Generation System, specifically focusing on the implementation of a new tricycle model feature.

## Feature Development Process

### 1. Planning Phase

1. **Create a GitHub Issue**
   - Describe the feature in detail
   - List specific requirements and expected behavior
   - Add relevant labels (e.g., "enhancement", "tricycle")

2. **Design Database Changes**
   - Plan schema updates or new collections needed
   - Document changes to existing models
   - Consider migration strategy for existing data

3. **Design API Endpoints**
   - Document new API endpoints needed
   - Plan updates to existing endpoints
   - Consider versioning if breaking changes are introduced

### 2. Implementation Phase

1. **Create Feature Branch**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/tricycle-model
   ```

2. **Implement Backend Changes**
   - Update or create models
   - Implement API endpoints
   - Write tests for new functionality

3. **Implement Frontend Changes**
   - Create new components or modify existing ones
   - Update forms and validation logic
   - Ensure responsive design

4. **Test Feature**
   - Test in development environment
   - Verify all requirements are met
   - Check edge cases and error handling

### 3. Review and Integration Phase

1. **Self-Review Code**
   - Check code against project standards
   - Ensure documentation is updated
   - Verify all tests are passing

2. **Create Pull Request**
   - Submit PR from feature branch to `dev`
   - Reference the issue number
   - Provide summary of changes

3. **Address Feedback**
   - Make requested changes from code review
   - Re-test after changes

4. **Merge to Development**
   - After approval, merge to `dev` branch
   - Delete feature branch after successful merge

## Tricycle Model Implementation Guide

This section outlines the specific steps for implementing the tricycle model feature.

### Database Changes

1. **Update BikeModel Schema**
   
   ```typescript
   // Add to BikeModel.ts
   interface IBikeModel extends Document {
     // Existing fields...
     
     // New fields for tricycle
     is_tricycle: boolean;
     cargo_capacity: number;     // Capacity in kg
     has_cabin: boolean;         // Whether it has an enclosed cabin
     wheel_count: number;        // Default 3 for tricycles
   }
   
   const BikeModelSchema = new Schema<IBikeModel>({
     // Existing fields...
     
     // New fields
     is_tricycle: {
       type: Boolean,
       default: false
     },
     cargo_capacity: {
       type: Number,
       default: 0
     },
     has_cabin: {
       type: Boolean,
       default: false
     },
     wheel_count: {
       type: Number,
       default: 3,
       validate: {
         validator: function(v: number) {
           return v >= 3;
         },
         message: 'Wheel count must be at least 3 for a tricycle'
       }
     }
   });
   ```

2. **Update Bill Schema**

   ```typescript
   // Add to Bill.ts
   interface IBill extends Document {
     // Existing fields...
     
     // New fields for tricycle
     is_tricycle: boolean;
     cargo_capacity: number;
     cabin_type: string;        // None, Basic, Premium
   }
   
   const BillSchema = new Schema({
     // Existing fields...
     
     // New fields
     is_tricycle: {
       type: Boolean,
       default: false
     },
     cargo_capacity: {
       type: Number
     },
     cabin_type: {
       type: String,
       enum: ['None', 'Basic', 'Premium'],
       default: 'None'
     }
   });
   ```

### API Changes

1. **Update BikeModel Controller**
   
   ```typescript
   // Add validation for tricycle specific fields
   export const createBikeModel = async (req: Request, res: Response) => {
     try {
       const bikeModelData = req.body;
       
       // Special validation for tricycles
       if (bikeModelData.is_tricycle) {
         // Ensure wheel count is at least 3
         bikeModelData.wheel_count = bikeModelData.wheel_count || 3;
         
         // Tricycles always can be leased
         bikeModelData.can_be_leased = true;
       }
       
       const newBikeModel = new BikeModel(bikeModelData);
       const savedModel = await newBikeModel.save();
       
       res.status(201).json(savedModel);
     } catch (error) {
       res.status(400).json({ error: (error as Error).message });
     }
   };
   ```

2. **Update Bill Routes for Tricycle Specifics**
   
   ```typescript
   // Handle tricycle-specific bill generation
   router.post('/', async (req: Request, res: Response) => {
     try {
       const billData = req.body;
       
       // Special processing for tricycles
       if (billData.is_tricycle) {
         // Add tricycle registration fee
         billData.rmvCharge = 15000;  // Higher RMV charge for tricycles
         
         // Add cabin cost if applicable
         if (billData.cabin_type === 'Basic') {
           billData.cabinCost = 20000;
         } else if (billData.cabin_type === 'Premium') {
           billData.cabinCost = 35000;
         } else {
           billData.cabinCost = 0;
         }
         
         // Recalculate total amount
         billData.totalAmount = 
           parseFloat(billData.bikePrice) + 
           billData.rmvCharge + 
           billData.cabinCost;
       }
       
       const newBill = new Bill(billData);
       const savedBill = await newBill.save();
       
       res.status(201).json(savedBill);
     } catch (error) {
       res.status(400).json({ error: (error as Error).message });
     }
   });
   ```

### Frontend Changes

1. **Update BillGenerator Component**

   ```jsx
   // Add tricycle-specific fields to form
   {selectedModel?.is_tricycle && (
     <div className="bg-yellow-50 p-4 mb-6 rounded border border-yellow-200">
       <h3 className="text-yellow-800 font-medium">Tricycle Selected</h3>
       <p className="text-yellow-600 text-sm mt-1">
         This is a tricycle model with special configuration options.
       </p>
       
       <Form.Item
         name="cabin_type"
         label="Cabin Type"
       >
         <Select
           options={[
             { label: 'No Cabin', value: 'None' },
             { label: 'Basic Cabin (+20,000 Rs)', value: 'Basic' },
             { label: 'Premium Cabin (+35,000 Rs)', value: 'Premium' }
           ]}
           onChange={calculateTotalAmount}
         />
       </Form.Item>
       
       <Form.Item
         name="cargo_capacity"
         label="Cargo Capacity"
       >
         <InputNumber
           min={0}
           addonAfter="kg"
           style={{ width: '100%' }}
         />
       </Form.Item>
     </div>
   )}
   ```

2. **Update Bill Preview and PDF Generation**

   Add tricycle-specific details to the bill preview and PDF generator to include the new fields.

## Testing the Tricycle Feature

1. **Test Creating Tricycle Models**
   - Verify tricycle-specific fields are saved
   - Test validation rules

2. **Test Bill Generation for Tricycles**
   - Test bill generation with different cabin options
   - Verify correct calculation of total amount
   - Verify PDF generation includes tricycle details

3. **Test Edge Cases**
   - Test with minimum and maximum values for cargo capacity
   - Test tricycle models with and without cabins
   - Test interactions with existing features (advance payment, leasing)

## Dynamic Bike Model Management (Implemented May 2025)

This feature allows administrators to dynamically add, update, and delete bike models through the UI.

### Backend Changes

1.  **Refactor `BikeModel.ts` (`backend/src/models/BikeModel.ts`)**
    *   Consolidated business logic for the `can_be_leased` property into the `pre('save')` hook.
    *   Ensured that `can_be_leased` is set to `false` if `is_tricycle` or `is_ebicycle` is true.

    ```typescript
    // backend/src/models/BikeModel.ts - pre('save') hook
    BikeModelSchema.pre('save', function(next) {
      // If this is a tricycle or an e-bicycle, it cannot be leased.
      if (this.is_tricycle || this.is_ebicycle) {
        this.can_be_leased = false;
      }
      next();
    });
    ```

2.  **Refactor `bikeModelController.ts` (`backend/src/controllers/bikeModelController.ts`)**
    *   Removed redundant `can_be_leased` logic from `createBikeModel` and `updateBikeModel` functions, as this is now handled by the model's `pre('save')` hook.
    *   Improved error handling by checking `error instanceof Error` before accessing `error.message`.

### Frontend Changes

1.  **Create Admin UI for Bike Model Management**
    *   **`BikeModelList.jsx` (`frontend/src/pages/Admin/BikeModelList.jsx`)**:
        *   Displays a table of all bike models.
        *   Provides "Edit" and "Delete" buttons for each model.
        *   Includes an "Add New Bike Model" button linking to the form.
    *   **`BikeModelForm.jsx` (`frontend/src/pages/Admin/BikeModelForm.jsx`)**:
        *   A form for creating new bike models and editing existing ones.
        *   Includes fields for name, price, motor number prefix, chassis number prefix, and checkboxes for `is_ebicycle` and `is_tricycle`.
        *   Handles API calls for creating/updating bike models.

2.  **Add Admin Routes in `App.jsx` (`frontend/src/App.jsx`)**
    *   New protected routes were added for the bike model management pages:
        *   `/admin/bike-models` (for `BikeModelList`)
        *   `/admin/bike-models/new` (for `BikeModelForm` - create mode)
        *   `/admin/bike-models/edit/:id` (for `BikeModelForm` - edit mode)

3.  **Update Navbar (`frontend/src/components/Navbar.jsx`)**
    *   Added a "Manage Models" link in the main navigation and mobile menu, visible to authenticated users, linking to `/admin/bike-models`.

### Testing

1.  Verify that bike models can be created, updated, and deleted from the admin UI.
2.  Confirm that the `can_be_leased` status is correctly set based on the `is_ebicycle` and `is_tricycle` flags.
3.  Ensure that form validations work as expected.
4.  Test navigation to and from the admin pages.

## Dark Theme Implementation (Implemented May 2025)

This feature introduces a toggleable dark theme for the frontend application, with preference persistence.

### Frontend Changes

1.  **Enable Dark Mode in Tailwind CSS (`frontend/tailwind.config.js`)**
    *   Set `darkMode: 'class'` in the Tailwind configuration.

    ```javascript
    // frontend/tailwind.config.js
    module.exports = {
      darkMode: 'class',
      // ... other configurations
    };
    ```

2.  **Create Theme Context (`frontend/src/contexts/ThemeContext.jsx`)**
    *   `ThemeContext` created to manage `isDarkMode` state and `toggleTheme` function.
    *   Initial theme is determined by `localStorage` or system preference (`prefers-color-scheme`).
    *   Theme preference is saved to `localStorage` on change.
    *   The `<html>` element's class (`dark`) is updated based on the theme.

3.  **Wrap Application with `ThemeProvider` (`frontend/src/App.jsx`)**
    *   The root of the application in `App.jsx` is wrapped with `<ThemeProvider>` to make the theme context available globally.
    *   Added `dark:bg-gray-900` to the main container `div` for the base dark background.

4.  **Add Theme Toggle to Navbar (`frontend/src/components/Navbar.jsx`)**
    *   Imported `useTheme` hook.
    *   Added a button with sun/moon icons to toggle the theme.
    *   This button is available in both desktop and mobile navigation views.

5.  **Apply Dark Mode Styles**
    *   Updated various components with Tailwind's `dark:` prefix for styling in dark mode. This includes:
        *   `App.jsx` (main layout, footer)
        *   `Navbar.jsx` (background, text, links, buttons, dropdowns)
        *   `BikeModelList.jsx` (text, table, buttons)
        *   `BikeModelForm.jsx` (text, form elements, buttons)
    *   Ensured consistent look and feel across light and dark themes.

### Testing

1.  Verify the theme toggle button correctly switches between light and dark modes.
2.  Confirm that the theme preference is saved in `localStorage` and persists across browser sessions.
3.  Check that the initial theme respects system preference if no user preference is set.
4.  Review all pages and components to ensure proper styling and readability in both themes.
5.  Test accessibility, particularly color contrast, in dark mode.
