'use strict';

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://user:pass@db:5432/actifai'
});
const seeder = require('./seed');
const swaggerDocument = YAML.load('./openapi.yaml');



// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

async function start() {
  // Seed the database
  await seeder.seedDatabase();

  // App
  const app = express();
  
  // Health check
  app.get('/health', (req, res) => {
    res.send('Hello World!');
    // res.send('Goodbye World');
  });

  app.get('/getallusers', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM users;')
      res.status(200).json(result.rows);
      console.log('Quering all users');
    }
    catch (error) {
      res.status(500).json({error: 'Database query failure'})
    }
  });

  app.get('/getallgroups', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM groups;')
      res.status(200).json(result.rows);
      console.log('Quering all groups');
    }
    catch (error) {
      res.status(500).json({error: 'Database query failure'})
    }
  });

  app.get('/getallsales', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM sales;')
      res.status(200).json(result.rows);
      console.log('Quering all sales');
    }
    catch (error) {
      res.status(500).json({error: 'Database query failure'})
    }
  });

  // Write your endpoints here
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.listen(PORT, HOST);
  console.log(`Server is running on http://${HOST}:${PORT}`);
}

start();
