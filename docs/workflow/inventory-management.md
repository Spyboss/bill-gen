# Inventory Management Workflow

## Overview

This document describes the complete workflow for managing bike inventory in the system, from adding new bikes to inventory through sales and reporting.

## Workflow Steps

### 1. Adding Bikes to Inventory

#### Individual Addition

**User Actions:**
- User navigates to Inventory > Add Bike
- User selects a bike model from the dropdown
- User enters motor number and chassis number
- User sets status (default: available)
- User adds optional notes
- User submits the form

**System Processing:**
- System validates the motor and chassis numbers for uniqueness
- System records the user who added the bike
- System saves the bike to inventory with 'available' status
- System confirms successful addition

#### Batch Addition

**User Actions:**
- User navigates to Inventory > Batch Add
- User selects a bike model
- User enters motor number and chassis number for the first bike
- User clicks "Add to Batch" to add the bike to the batch
- User repeats for all bikes to be added
- User reviews the batch and clicks "Save All"

**System Processing:**
- System validates all motor and chassis numbers for uniqueness
- System records the user who added the bikes
- System saves all bikes to inventory with 'available' status
- System confirms successful addition with count of bikes added

### 2. Viewing Inventory

**User Actions:**
- User navigates to Inventory
- User can filter by status, search by motor/chassis number
- User can sort by various fields
- User can view details of any inventory item

**System Processing:**
- System retrieves inventory items based on filters
- System displays inventory with pagination
- System shows status indicators for each bike

### 3. Updating Inventory Items

**User Actions:**
- User navigates to an inventory item
- User clicks Edit
- User updates fields as needed
- User submits changes

**System Processing:**
- System validates changes
- System updates the inventory record
- System confirms successful update

### 4. Generating Inventory Reports

**User Actions:**
- User navigates to Inventory > Report
- User views summary statistics
- User can print or export the report

**System Processing:**
- System calculates inventory statistics:
  - Total bikes in inventory
  - Available bikes
  - Sold bikes
  - Total inventory value
- System generates a detailed breakdown by model
- System provides export functionality

### 5. Integration with Bill Generation

**User Actions:**
- User starts creating a new bill
- User selects a bike model
- User clicks "Select Bike from Inventory"
- User selects an available bike from the inventory list
- User completes the bill as normal

**System Processing:**
- System filters inventory to show only available bikes of the selected model
- System auto-fills motor and chassis numbers from the selected inventory item
- System links the bill to the inventory item
- When bill is completed, system updates inventory item status to 'sold'
- System records the bill ID and sale date in the inventory record

## Special Cases

### Reserving Bikes

**User Actions:**
- User navigates to an inventory item
- User changes status to 'reserved'
- User adds notes about the reservation

**System Processing:**
- System updates the bike status to 'reserved'
- System maintains the link between the inventory item and potential customer via notes

### Handling Damaged Bikes

**User Actions:**
- User navigates to an inventory item
- User changes status to 'damaged'
- User adds notes about the damage

**System Processing:**
- System updates the bike status to 'damaged'
- Damaged bikes are excluded from available inventory for sales

### Cancelling Bills

**User Actions:**
- User navigates to a bill linked to an inventory item
- User cancels the bill

**System Processing:**
- System updates the bill status to 'cancelled'
- System reverts the inventory item status from 'sold' back to 'available'
- System clears the billId and dateSold fields from the inventory item

## Inventory Status Flow

```
┌─────────────┐     reserve     ┌─────────────┐
│             │───────────────▶│             │
│  AVAILABLE  │                 │  RESERVED   │
│             │◀───────────────│             │
└─────────────┘     cancel      └─────────────┘
       │                               │
       │                               │
       │                               │
       │ sell                          │ sell
       │                               │
       ▼                               ▼
┌─────────────┐                 ┌─────────────┐
│             │                 │             │
│    SOLD     │                 │  DAMAGED    │
│             │                 │             │
└─────────────┘                 └─────────────┘
```

## System Calculations

### Inventory Value Calculation
```
Total Inventory Value = Sum of (Bike Model Price) for all Available Bikes
```

### Inventory Counts
```
Total Bikes = Available + Reserved + Sold + Damaged
Available Percentage = (Available / Total) * 100
```
