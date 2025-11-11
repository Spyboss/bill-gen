# Bike Models Documentation

## Overview

The system manages various electric vehicle models for bill generation. Each model has specific properties that affect billing calculations, documentation, and business rules.

## Model Categories

The system supports three categories of electric vehicles:

1. **E-MOTORCYCLES** - Standard electric motorcycles/scooters
2. **E-MOTORBICYCLES** - Electric motor bicycles
3. **E-TRICYCLES** - Electric three-wheeled vehicles (Added March 2025)

Each category has different business rules for billing and registration.

## Model Schema

### BikeModel

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| name | String | Name of the bike model | Yes |
| price | Number | Base price of the model (LKR) | Yes |
| is_ebicycle | Boolean | Whether this is an e-bicycle (affects RMV charges) | No (default: false) |
| can_be_leased | Boolean | Whether this model can be sold through leasing | No (default: true) |
| is_tricycle | Boolean | Whether this is a tricycle model | No (default: false) |
| createdAt | Date | When the model was created | Auto-generated |
| updatedAt | Date | When the model was last updated | Auto-generated |

## Business Rules

1. **E-MOTORCYCLES**:
   - Standard RMV charges apply (13,000 Rs for cash, 13,500 Rs for leasing)
   - Can be sold through both cash and leasing options
   - Total bill amount includes bike price + RMV charges

2. **E-MOTORBICYCLES**:
   - No RMV charges are applied
   - Can only be sold through cash payment (no leasing)
   - Total bill amount is just the bike price

3. **E-TRICYCLES**:
   - No RMV charges are applied
   - Can only be sold through cash payment (no leasing)
   - Total bill amount is just the bike price
   - Special handling for the first sale

## Current Models

### E-MOTORCYCLES

| Model Name | Price (LKR) | Leasing Available |
|------------|-------------|------------------|
| TMR-XGW | 299,500 | Yes |
| TMR-ZS | 349,500 | Yes |
| TMR-ZL | 399,500 | Yes |
| TMR-Q1 | 449,500 | Yes |
| TMR-MNK3 | 475,000 | Yes |
| TMR-G18 | 499,500 | Yes |

### E-MOTORBICYCLES

| Model Name | Price (LKR) | Leasing Available |
|------------|-------------|------------------|
| TMR-X01 | 219,500 | No |
| TMR-COLA5 | 249,500 | No |

### E-TRICYCLES

| Model Name | Price (LKR) | Leasing Available |
|------------|-------------|------------------|
| TMR-N7 | 400,000 | No |

## Implementation Details

1. **Motor and Chassis Number Prefixes**:
   - Each model has specific prefixes used for generating motor and chassis numbers
   - These prefixes help identify the model from the numbers alone

2. **Vehicle Type Display**:
   - Bills should display the vehicle type:
     - "E-MOTORCYCLE" for standard models
     - "E-MOTORBICYCLE" for bicycle models
     - "E-TRICYCLE" for tricycle models

3. **Special Handling for First Tricycle Sale**:
   - The first sale of a tricycle model (TMR-N7) should be handled specially
   - May include special documentation, notification, or visual elements

## Planned Additions

### Tricycle Model
A new tricycle model is planned with the following characteristics:
- Will have special pricing structure
- Requires specific documentation
- Will have unique chassis and motor number patterns