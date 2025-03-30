# Payment Types Documentation

## Overview

The system supports different payment types for bill generation, each with its own business rules and processing requirements based on the vehicle type. This document details each payment type and its implementation.

## Vehicle Types and Payment Rules

### 1. E-MOTORCYCLES
- Standard electric motorcycles (TMR-XGW, TMR-ZS, TMR-ZL, TMR-Q1, TMR-MNK3, TMR-G18)
- Can be sold through both cash and leasing payment methods
- RMV charges apply:
  * 13,000 Rs for cash sales
  * 13,500 Rs for leasing sales (referred to as "CPZ")

### 2. E-MOTORBICYCLES
- Electric motor bicycles (TMR-X01, TMR-COLA5)
- Can only be sold through cash payment
- No RMV charges apply
- Price on bill is final price

### 3. E-TRICYCLES
- Electric three-wheeled vehicles (TMR-N7)
- Can only be sold through cash payment
- No RMV charges apply
- Price on bill is final price
- Special handling for first sale

## Payment Methods

### Cash Payment

#### Description
Cash payment is the standard payment method where the customer pays the full amount upfront.

#### Business Rules by Vehicle Type
- **E-MOTORCYCLES**:
  * Total Amount = Bike Price + RMV (13,000 Rs)
  * Bill shows both bike price and RMV separately
  
- **E-MOTORBICYCLES and E-TRICYCLES**:
  * Total Amount = Bike Price (final price)
  * No RMV charges displayed or added
  * No leasing option available

#### Process Flow
1. User selects vehicle model
2. System automatically determines if it's an E-MOTORCYCLE, E-MOTORBICYCLE, or E-TRICYCLE
3. For E-MOTORCYCLES, "Cash" or "Leasing" options are available
4. For E-MOTORBICYCLES and E-TRICYCLES, only "Cash" option is available
5. System calculates total amount based on vehicle type
6. Bill is generated with "Completed" status
7. PDF can be generated for download or printing

### Leasing Payment

#### Description
Leasing payment is a method where a third-party leasing company finances the vehicle purchase, and the customer makes a down payment plus subsequent installments.

#### Business Rules
- Only available for E-MOTORCYCLES
- Includes RMV charges as "CPZ" (13,500 Rs)
- Total amount on the bill is the down payment amount only

#### Process Flow
1. User selects an E-MOTORCYCLE model
2. User selects "Leasing" as payment method
3. User enters down payment amount
4. System calculates total (down payment amount)
5. Bill is generated with "Completed" status
6. PDF can be generated for download or printing

### Advance Payment

#### Description
Advance payment is a special case where the customer pays a portion of the total amount in advance and will pay the remaining balance upon delivery.

#### Business Rules
- **For Cash Sale Advance (E-MOTORCYCLES)**:
  * Shows: Bike Price, RMV (13,000), Advance Amount
  * Balance = (Bike Price + RMV) - Advance Amount
  * Status remains "Pending" until fully paid

- **For Cash Sale Advance (E-MOTORBICYCLES and E-TRICYCLES)**:
  * Shows: Bike Price, Advance Amount
  * Balance = Bike Price - Advance Amount
  * Status remains "Pending" until fully paid
   
- **For Leasing Advance (E-MOTORCYCLES only)**:
  * Shows: Bike Price, CPZ (13,500), Down Payment, Advance Amount
  * Balance = Down Payment - Advance Amount
  * Total = Down Payment (not full bike price + CPZ)
  * Status remains "Pending" until fully paid

#### Process Flow
1. User selects vehicle model
2. User selects primary payment method (cash or leasing, if available)
3. User enables "Advance Payment" option
4. User enters advance amount paid
5. User enters estimated delivery date
6. System calculates balance due
7. Bill is generated with "Pending" status
8. Bill can be updated to "Completed" once full payment is received

## Bill Status Workflow

| Status | Description | Applicable To | Next Possible Status |
|--------|-------------|--------------|----------------------|
| Pending | Partial payment received | Advance payment bills | Completed, Cancelled |
| Completed | Full payment received | All bill types | Cancelled |
| Cancelled | Transaction cancelled | Any bill | None |

## Vehicle Type Display

All bills display the appropriate vehicle type classification:
- "E-MOTORCYCLE" for standard models
- "E-MOTORBICYCLE" for bicycle models
- "E-TRICYCLE" for tricycle models 