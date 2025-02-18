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


  //  I'm going to leave all the end points here as that is what
  //  the instructions seemed to explicitly state, but please know 
  //  that I would normally organize them into different files and 
  //  possibly different folders for better readability and maintainability

  //  Please also note that with more time and in a different context 
  //  I would likely create a collection of model objects that would
  //  also be stored in a specific location in the file structure

  //  I would also add integration tests for these endpoints

  // I would also consider implementing and using an ORM to insulate 
  // the data layer, which can help support security and integrity. 
  // Additionally, it makes the code more maintainable because new developers 
  // only need to learn one technology rather than both SQL and nodejs,
  // and it also supports an object-oriented approach.


  /*
    User based end points
     - Get all users
     - get a row\profile for a single user by id
     - get the average revenue for a user by date (defaults to all time)
     - get the total revenue for a user by date (defaults to all time
     )
  */

     //return all users
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

    // return a user
    app.get('/getuser/:id', async (req, res) => {
      try {
        const userId = req.query.user_id;
        const result = await pool.query('SELECT * FROM users WHERE id = $1;', [userId])
        res.status(200).json(result.rows);
        console.log(`request info for user ${userId}`);
      }
      catch (error) {
        res.status(500).json({error: 'Database error while looking for user ${userId}'})
      }
    });

  /*
    Group based end points
     - Get all groups
     - get a row\profile for a single group by id
     - get the average revenue for a group by date (defaults to all time)
     - get the total revenue for a user by date (defaults to all time)
     )
  */

  


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

  app.get('/timeseries', async (req, res) => {
    try {
      // Get the optional user_id from the query string
      const userId = req.query.user_id;
      let query;
      let values = [];
    
      if (userId) {
        // Query for a specific user's sales aggregated by day (for example)
        query = `
          SELECT DATE_TRUNC('day', date) AS date,
                 SUM(amount) AS totalSales,
                 AVG(amount) AS averageSale
          FROM sales
          WHERE user_id = $1
          GROUP BY date
          ORDER BY date;
        `;
        values = [userId];
      } else {
        // Query for all users' sales aggregated by day
        query = `
          SELECT DATE_TRUNC('day', date) AS date,
                 SUM(amount) AS totalSales,
                 AVG(amount) AS averageSale
          FROM sales
          GROUP BY date
          ORDER BY date;
        `;
      }
    
      const result = await pool.query(query, values);
      res.status(200).json(result.rows);

        // const result = await pool.query('SELECT DATE_TRUNC(\'Month\', date) AS date, SUM(amount) AS totalSales, AVG(amount) AS averageSale FROM sales GROUP BY date ORDER BY date;')
        // res.status(200).json(result.rows);
        // console.log('Quering all sales');
    } catch (error) {
      console.error('Error fetching time series data:', error);
      res.status(500).json({ error: 'Database query failure' });
    }
  });
    

  // Write your endpoints here
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.listen(PORT, HOST);
  console.log(`Server is running on http://${HOST}:${PORT}`);
}

start();
