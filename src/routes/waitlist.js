const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.post('/', async (req, res) => {
  try {
    const { name, phone, service, city } = req.body;
    
    // Validate required fields
    if (!name || !phone || !service) {
      return res.status(400).json({
        success: false,
        error: 'Name, phone, and service are required.'
      });
    }
    
    // Clean phone number - remove non-digits and country code
    const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '');
    
    // Validate Indian phone number (10 digits starting with 6-9)
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Enter a valid 10-digit Indian mobile number.'
      });
    }
    
    // Check if phone already exists in database
    const existingUser = await query(
      'SELECT * FROM waitlist WHERE phone = $1',
      [cleanPhone]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This phone number is already registered.'
      });
    }
    
    // Insert new entry into database
    const result = await query(
      `INSERT INTO waitlist (name, phone, service, city, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [name, cleanPhone, service, city || null]
    );
    
    // Success response
    res.status(201).json({
      success: true,
      message: 'Request submitted successfully!',
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        phone: result.rows[0].phone,
        service: result.rows[0].service,
        city: result.rows[0].city
      }
    });
    
  } catch (
