# Bike Inventory Schema Documentation

## Overview

The bike inventory schema represents individual bikes in stock that are available for sale. It tracks each bike's details, status, and lifecycle from addition to inventory through sale.

## Schema Definition

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| bikeModelId | ObjectId | Reference to the bike model | Yes |
| motorNumber | String | Unique motor number for the bike | Yes |
| chassisNumber | String | Unique chassis number for the bike | Yes |
| status | String | Status of the bike: 'available', 'sold', 'reserved', or 'damaged' | Default: 'available' |
| dateAdded | Date | Date when the bike was added to inventory | Default: current date |
| dateSold | Date | Date when the bike was sold | Only for sold bikes |
| billId | ObjectId | Reference to the bill when sold | Only for sold bikes |
| notes | String | Additional notes about the bike | No |
| addedBy | ObjectId | Reference to the user who added the bike | Yes |
| createdAt | Date | Date when the record was created | Auto-generated |
| updatedAt | Date | Date when the record was last updated | Auto-generated |

## Bike Status Lifecycle

1. **AVAILABLE**: Initial state when a bike is added to inventory
2. **RESERVED**: Bike is temporarily reserved for a potential customer
3. **SOLD**: Bike has been sold and is no longer available
4. **DAMAGED**: Bike is damaged and not available for sale

## Integration with Bill Generation

When a bill is created using a bike from inventory:

1. The bike's details (motor number, chassis number) are automatically populated in the bill
2. The bill includes a reference to the inventory item via `inventoryItemId`
3. When the bill is completed, the inventory item's status is automatically updated to 'SOLD'
4. The inventory item is linked to the bill via `billId` and the sale date is recorded

## Inventory Management Features

### Adding Bikes to Inventory

Bikes can be added to inventory individually or in batches. When adding a bike:
- The bike model must be selected from existing models
- Motor and chassis numbers must be unique
- The system can suggest motor/chassis numbers based on model prefixes

### Inventory Reporting

The system provides inventory reports including:
- Current stock levels by model
- Available bikes by model
- Total inventory value
- Sales history

## Business Rules

1. **Unique Identifiers**:
   - Each bike must have a unique motor number
   - Each bike must have a unique chassis number

2. **Status Transitions**:
   - Available → Reserved → Sold
   - Available → Sold
   - Available → Damaged
   - Reserved → Available (if reservation is cancelled)
   - Reserved → Sold
   - Damaged → Available (if repaired)

3. **Deletion Rules**:
   - Sold bikes cannot be deleted from inventory
   - Available, reserved, or damaged bikes can be deleted by administrators

## Indexes

The schema includes the following indexes for performance optimization:
- Compound index on `{ bikeModelId: 1, status: 1 }` for filtering available bikes by model
- Text index on `{ motorNumber: 'text', chassisNumber: 'text' }` for searching by motor or chassis number
