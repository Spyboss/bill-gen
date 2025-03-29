# Payment Types Documentation

## Overview

The system supports different payment types for bill generation, each with its own business rules and processing requirements. This document details each payment type and its implementation.

## Cash Payment

### Description
Cash payment is the standard payment method where the customer pays the full amount upfront.

### Business Rules
- Available for all bike models (e-bicycles and regular bikes)
- For regular bikes, includes RMV charges (13,000 Rs)
- For e-bicycles, no RMV charges are applied
- Customer receives full ownership immediately upon payment

### Process Flow
1. User selects "Cash" as payment method
2. System calculates total amount:
   - Regular bikes: Bike price + 13,000 Rs
   - E-bicycles: Bike price only
3. Bill is generated with "Pending" status
4. Once payment is received, bill status is updated to "Completed"

### Fields Required
- Customer information (name, NIC, address)
- Bike details (model, motor number, chassis number)
- Bill date

## Leasing Payment

### Description
Leasing payment is a method where a third-party leasing company finances the bike purchase, and the customer makes a down payment plus subsequent installments.

### Business Rules
- Only available for regular bikes (not for e-bicycles)
- Includes RMV charges (13,000 Rs) and CPZ fee (500 Rs) for a total of 13,500 Rs
- Requires leasing company information
- Total amount on the bill is the down payment amount only

### Process Flow
1. User selects "Leasing" as payment method
2. User enters down payment amount
3. User selects leasing company
4. System calculates total (down payment amount)
5. Additional paperwork for leasing company is required
6. Bill is generated with "Pending" status
7. Once approved by leasing company and down payment received, status is updated to "Completed"

### Fields Required
- Customer information (name, NIC, address)
- Bike details (model, motor number, chassis number)
- Down payment amount
- Leasing company name
- Bill date

## Advance Payment

### Description
Advance payment is a special case where the customer pays a portion of the total amount in advance and will pay the remaining balance upon delivery.

### Business Rules
- Available for all payment types (cash and leasing)
- Records advance amount paid
- Calculates balance amount due
- Tracks estimated delivery date

### Process Flow
1. User selects primary payment method (cash or leasing)
2. User enables "Advance Payment" option
3. User enters advance amount paid
4. User enters estimated delivery date
5. System calculates balance due (total - advance)
6. Bill is generated with "Pending" status
7. Once full payment is received, status is updated to "Completed"

### Fields Required
- All fields from the primary payment method (cash or leasing)
- Advance amount
- Estimated delivery date
- Calculated balance amount

## Status Transitions

| From Status | To Status | Trigger | Description |
|-------------|-----------|---------|-------------|
| Pending | Completed | Full payment received | All payment requirements met |
| Pending | Cancelled | Transaction cancelled | Customer cancels the purchase |
| Completed | - | - | Final state, no further transitions |
| Cancelled | - | - | Final state, no further transitions | 