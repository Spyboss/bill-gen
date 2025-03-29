# Bike Models Documentation

## Overview

The system manages various bike models for bill generation. Each bike model has specific properties that affect billing calculations, documentation, and business rules.

## Model Schema

### BikeModel

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| name | String | Name of the bike model | Yes |
| price | Number | Base price of the model | Yes |
| motor_number_prefix | String | Prefix used for motor numbers | Yes |
| chassis_number_prefix | String | Prefix used for chassis numbers | Yes |
| is_ebicycle | Boolean | Whether this is an e-bicycle (affects RMV charges) | No (default: false) |
| can_be_leased | Boolean | Whether this model can be sold through leasing | No (default: true) |
| createdAt | Date | When the model was created | Auto-generated |
| updatedAt | Date | When the model was last updated | Auto-generated |

## Business Rules

1. **E-Bicycles**:
   - Cannot be sold through leasing (can_be_leased is forced to false)
   - Do not incur RMV charges (13,000 Rs fee is not applied)
   - Only support cash payment

2. **Regular Bikes**:
   - Have RMV charges of 13,000 Rs added to the base price
   - Can be sold through either cash or leasing options
   - When sold through leasing, additional processing is required

## Usage in Bill Generation

When generating a bill, selecting a bike model automatically:
- Sets the base price
- Determines available payment methods (cash only or cash/leasing)
- Applies appropriate fees based on type
- Sets prefixes for motor and chassis numbers

## Example Models

| Model Name | Price | Type | Leasing | Notes |
|------------|-------|------|---------|-------|
| TMR-100 | 185,000 Rs | Regular | Yes | Standard bike model |
| E-Bike Eco | 95,000 Rs | E-Bicycle | No | No RMV charges |

## Planned Additions

### Tricycle Model
A new tricycle model is planned with the following characteristics:
- Will have special pricing structure
- Requires specific documentation
- Will have unique chassis and motor number patterns 