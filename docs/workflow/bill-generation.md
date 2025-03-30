# Bill Generation Workflow

## Overview

This document describes the complete workflow for generating a bill in the system, from user input to final bill generation and PDF export.

## Workflow Steps

### 1. Model Selection

**User Actions:**
- User selects a bike model from the dropdown list
- System loads the model details and price

**System Processing:**
- If the selected model is an e-bicycle:
  - "Cash" is automatically selected as the payment method
  - Leasing option is disabled
  - RMV charges are not applied
- If the selected model is a regular bike:
  - Both cash and leasing payment options are available
  - RMV charges are applied (13,000 Rs for cash, 13,500 Rs for leasing)

### 2. Payment Method Selection

**User Actions:**
- User selects payment method (cash or leasing)

**System Processing:**
- If "Cash" is selected:
  - Total = Bike Price + RMV Charges (if applicable)
- If "Leasing" is selected:
  - Down payment field is shown
  - Leasing company field is shown
  - Total is calculated as down payment only

### 3. Advance Payment Option

**User Actions:**
- User indicates if this is an advance payment
- If yes, user enters advance amount and estimated delivery date

**System Processing:**
- If advance payment is selected:
  - System calculates balance amount (total - advance)
  - Estimated delivery date is recorded

### 4. Customer Details

**User Actions:**
- User enters customer name, NIC, and address

**System Processing:**
- System validates required fields

### 5. Bike Details

**User Actions:**
- User enters motor number and chassis number

**System Processing:**
- System prefills prefixes based on selected model
- Validates the format of entered numbers

### 6. Bill Preview

**User Actions:**
- User clicks "Preview Bill" button
- System generates a preview PDF
- User reviews the bill details

### 7. Bill Generation

**User Actions:**
- User clicks "Generate Bill" button

**System Processing:**
- System creates a new bill record with:
  - Auto-generated bill number
  - Customer details
  - Bike details
  - Financial calculations
  - Current date and time
  - Initial status: "Pending"

### 8. Bill Export

**User Actions:**
- User can download the bill as PDF
- User can print the bill

## Special Cases

### E-Bicycle Bills
- No RMV charges
- Cash payment only
- Simplified calculations

### Leasing Bills
- Down payment recorded
- Additional CPZ fee (500 Rs)
- Leasing company details required

### Advance Payment Bills
- Only part of the payment collected
- Balance calculated
- Delivery date estimated

## System Calculations

### Total Amount Calculation
1. **Cash Payment (Regular Bike)**:
   ```
   Total = Bike Price + RMV Charge (13,000 Rs)
   ```

2. **Cash Payment (E-Bicycle)**:
   ```
   Total = Bike Price
   ```

3. **Leasing Payment**:
   ```
   Total = Down Payment
   ```

### Balance Calculation (Advance Payment)
```
Balance = Total - Advance Amount
``` 