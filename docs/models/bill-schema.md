# Bill Schema Documentation

## Overview

The bill schema represents a sales transaction in the system. It captures customer information, bike details, payment method, and financial calculations.

## Schema Definition

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| billNumber | String | Unique identifier for the bill (auto-generated) | Auto-generated |
| bill_number | String | Legacy field for backward compatibility | Auto-synced with billNumber |
| billDate | Date | Date when the bill was created | Default: current date |
| status | String | Status of the bill: 'pending', 'completed', or 'cancelled' | Default: 'pending' |
| customerName | String | Name of the customer | Yes |
| customerNIC | String | National ID card number of the customer | Yes |
| customerAddress | String | Address of the customer | Yes |
| bikeModel | String | Name of the bike model purchased | Yes |
| motorNumber | String | Unique motor number for the bike | Yes |
| chassisNumber | String | Unique chassis number for the bike | Yes |
| bikePrice | Number | Base price of the bike | Yes |
| billType | String | Type of bill: 'cash' or 'leasing' | Default: 'cash' |
| isEbicycle | Boolean | Whether the bike is an e-bicycle | Default: false |
| rmvCharge | Number | RMV registration charge | Default: 13,000 |
| downPayment | Number | Down payment amount (for leasing) | Only for leasing |
| isAdvancePayment | Boolean | Whether this is an advance payment | Default: false |
| advanceAmount | Number | Amount paid in advance | For advance payments |
| balanceAmount | Number | Remaining amount to be paid | For advance payments |
| estimatedDeliveryDate | Date | Expected delivery date | For advance payments |
| totalAmount | Number | Total bill amount | Yes |

## Bill Number Generation

Bill numbers are automatically generated following this pattern:
```
BILL-YYMMDD-XXX
```
Where:
- YY: Last two digits of the year
- MM: Month (01-12)
- DD: Day (01-31)
- XXX: Random 3-digit number

## Business Rules

1. **E-Bicycle Bills**:
   - Do not include RMV charges
   - Can only be cash bills (not leasing)
   - Total amount = bikePrice

2. **Regular Bike Bills - Cash**:
   - Include RMV charges (13,000 Rs)
   - Total amount = bikePrice + rmvCharge
   
3. **Regular Bike Bills - Leasing**:
   - Include RMV charges (13,500 Rs, includes CPZ fee)
   - Total amount is the down payment amount
   - Requires additional leasing company information

4. **Advance Payment Bills**:
   - Record the advance amount paid
   - Calculate the balance remaining
   - Track estimated delivery date

## Bill Status Workflow

1. **Pending**: Initial state after bill creation
2. **Completed**: Payment fully received, bike delivered
3. **Cancelled**: Transaction cancelled

## PDF Generation

Bills can be exported as PDF documents with all relevant details formatted according to company standards. 