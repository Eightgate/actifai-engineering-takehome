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
  // Responds with a plain text message to confirm the server is running.
  app.get('/health', (req, res) => {
    res.send('Hello World!');
  });

    // Write your endpoints here

  /*
    User based end points
     -> Get all users
     -> get a row\profile for a single user by id
     -> get the average revenue for a user by date (defaults to all time)
     -> get the average revenue for a user by date daily (defaults to all time)
     -> get the average revenue for a user by date monthly (defaults to all time)
     - Add user
     - remove user
     - modify user
     )
  */

     // Retrieves all user records from the database and returns them as JSON
     app.get('/allUserInfo', async (req, res) => {
      try {
        const result = await pool.query('SELECT * FROM users;')
        res.status(200).json(result.rows);
        console.log('Quering all users');
      }
      catch (error) {
        res.status(500).json({error: 'Database query failure'})
      }
    });

    // Retrieves the details of a single user by ID (from the URL parameter) and returns the user data as JSON
    app.get('/userInfo/:id', async (req, res) => {
      try {
        const userId = parseInt(req.params.id, 10);
        const result = await pool.query('SELECT * FROM users WHERE id = $1;', [userId])
        res.status(200).json(result.rows);
        console.log(`request info for user with id ` + userId);
      }
      catch (error) {
        res.status(500).json({error: 'Database error while looking for user ${userId}'})
      }
    });

    // Calculates and returns the overall average revenue for the specified user.
    // If start and end query parameters are provided, the average is calculated for that date range.
    app.get('/averageUserRevenue/:id', async (req, res) => {
      try {
        const userId = parseInt(req.params.id, 10);
        const { start, end } = req.query;

        let query;
        let values = [];
        //if non start or end date is provided, default to unbound (all time)
        if (!start || !end) {  
          query = `
            SELECT user_id, AVG(amount) AS averageRevenue
            FROM sales
            WHERE user_id = $1
            GROUP BY user_id
            ;
          `;
          values = [userId];
        }
        // else use the times given to produce an average within the stated bounds
        else {
          query = `
          SELECT user_id, AVG(amount) AS averageRevenue
          FROM sales
          WHERE user_id = $1 AND date BETWEEN $2 AND $3
          GROUP BY user_id
          ;
        `;
          values = [userId, start, end]; 
        }       
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
        console.log(`Querying average revenue for user ${userId}`);
      } catch (error) {
          console.error('Error getting user average revenue:', error);
          res.status(500).json({ error: 'Database query failure' });
      }
    });

    // Retrieves a daily time series of the user's average sales
    // If start and end query parameters are provided, the average is calculated for that date range
    app.get('/averageDailyRevenue/:id', async (req, res) => {
      try {
        // Get the optional user_id from the query string
        const userId = parseInt(req.params.id, 10);
        const { start, end } = req.query;
        let query;
        let values = [];

        // return users average daily revenue time series (default is all time, optional date range parameters)
        if (!start || !end) {
          query = `
            SELECT DATE_TRUNC('day', date) AS date,
                AVG(amount) AS averageSale
            FROM sales
            WHERE user_id = $1
            GROUP BY date
            ORDER BY date
            ;
          `;
          values = [userId];
        }
        else {
          // else use the times given to produce an average within the stated bounds
          query = `
          SELECT DATE_TRUNC('day', date) AS date,
          AVG(amount) AS averageSale
          FROM sales
          WHERE user_id = $1 AND date BETWEEN $2 AND $3
          GROUP BY date
          ORDER BY date          
          ;
        `;
          values = [userId, start, end]; 
        }    
      
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
        console.log('Quering all sales');
      } catch (error) {
        console.error('Error getting user revenue:', error);
        res.status(500).json({ error: 'Database query failure' });
      }
    });

    // return average sales monthly time series for a user 
    app.get('/averageMonthlyRevenue/:id', async (req, res) => {
      try {
        // Get the optional user_id from the query string
        const userId = parseInt(req.params.id, 10);
        const { start, end } = req.query;
        let query;
        let values = [];

        // return users average daily revenue time series (default is all time, optional date range parameters)
        if (!start || !end) {
          query = `
            SELECT DATE_TRUNC('month', date) AS date,
                AVG(amount) AS averageSale
            FROM sales
            WHERE user_id = $1
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY date
            ;
          `;
          values = [userId];
        }
        else {
          // else use the times given to produce an average within the stated bounds
          query = `
          SELECT DATE_TRUNC('month', date) AS date,
          AVG(amount) AS averageSale
          FROM sales
          WHERE user_id = $1 AND date BETWEEN $2 AND $3
          GROUP BY DATE_TRUNC('month', date)
          ORDER BY date          
          ;
        `;
          values = [userId, start, end]; 
        }    
      
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
        console.log('Quering all sales');
      } catch (error) {
        console.error('Error getting user revenue:', error);
        res.status(500).json({ error: 'Database query failure' });
      }
    });



  /*
    Group based end points
     -> Get all groups
     -> get a row\profile for a single group by id
     - get the average revenue for a group by date (defaults to all time)
     - get the total revenue for a user by date (defaults to all time)
     )
  */

  // Retrieves all group records from the database and returns them as JSON
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

  // Retrieves the details of a specific group by ID and returns the group data as JSON
  app.get('/groupInfo/:id', async (req, res) => {
    try {
      const groupId = parseInt(req.params.id, 10);
      const result = await pool.query('SELECT * FROM groups WHERE id = $1;', [userId])
      res.status(200).json(result.rows);
      console.log(`request info for user with id ` + userId);
    }
    catch (error) {
      res.status(500).json({error: 'Database error while looking for group ${userId}'})
    }
  });

  // Calculates and returns the overall average revenue for the specified group
// If start and end dates are provided as query parameters, the average is calculated for that range
  app.get('/averageGroupRevenue/:id', async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const { start, end } = req.query;

      let query;
      let values = [];
      //if non start or end date is provided, default to unbound (all time)
      if (!start || !end) {  
        query = `
          SELECT group_id, AVG(amount) AS averageGroupRevenue
          FROM sales s JOIN user_groups u 
          ON s.user_id = u.user_id
          WHERE group_id = $1
          GROUP BY group_id
          ;
        `;
        values = [userId];
      }
      // else use the times given to produce an average within the stated bounds
      else {
        query = `
        SELECT group_id, AVG(amount) AS averageGroupRevenue
        FROM sales s JOIN user_groups u 
        ON s.user_id = u.user_id
        WHERE group_id = $1 AND date BETWEEN $2 AND $3
        GROUP BY user_id
        ;
      `;
        values = [userId, start, end]; 
      }       
      const result = await pool.query(query, values);
      res.status(200).json(result.rows);
      console.log(`Querying average revenue for user ${userId}`);
    } catch (error) {
        console.error('Error getting user average revenue:', error);
        res.status(500).json({ error: 'Database query failure' });
    }
  });

  // Retrieves a daily time series of the group's average revenue,
  // optionally filtered by a provided date range
  app.get('/averageDailyGroupRevenue/:id', async (req, res) => {
    try {
      // Get the optional user_id from the query string
      const userId = parseInt(req.params.id, 10);
      const { start, end } = req.query;
      let query;
      let values = [];
      
      // return group average daily revenue time series (default is all time, optional date range parameters)
      if (!start || !end) {
        query = `
          SELECT DATE_TRUNC('day', date) AS date,
              AVG(amount) AS averageSale
          FROM sales s JOIN user_groups u 
          ON s.user_id = u.user_id
          WHERE group_id = $1
          GROUP BY DATE_TRUNC('day', date)
          ORDER BY date
          ;
        `;
        values = [userId];
      }
      else {
        // else use the times given to produce an average within the stated bounds
        query = `
        SELECT DATE_TRUNC('day', date) AS date,
            AVG(amount) AS averageSale
        FROM sales s JOIN user_groups u 
        ON s.user_id = u.user_id
        WHERE group_id = $1 AND date BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC('day', date)
        ORDER BY date          
        ;
      `;
        values = [userId, start, end]; 
      }    
    
      const result = await pool.query(query, values);
      res.status(200).json(result.rows);
      console.log('Quering all sales');
    } catch (error) {
      console.error('Error getting user revenue:', error);
      res.status(500).json({ error: 'Database query failure' });
    }
  });

  // Retrieves a monthly time series of the group's average revenue,
  // optionally filtered by a provided date range 
  app.get('/averageMonthlyGroupRevenue/:id', async (req, res) => {
    try {
      // Get the optional user_id from the query string
      const userId = parseInt(req.params.id, 10);
      const { start, end } = req.query;
      let query;
      let values = [];

      // return users average daily revenue time series (default is all time, optional date range parameters)
      if (!start || !end) {
        query = `
          SELECT DATE_TRUNC('month', date) AS date,
              AVG(amount) AS averageSale
          FROM sales s JOIN user_groups u 
          ON s.user_id = u.user_id
          WHERE group_id = $1
          GROUP BY DATE_TRUNC('month', date)
          ORDER BY date
          ;
        `;
        values = [userId];
      }
      else {
        // else use the times given to produce an average within the stated bounds
        query = `
        SELECT DATE_TRUNC('month', date) AS date,
        AVG(amount) AS averageSale
        FROM sales s JOIN user_groups u 
        ON s.user_id = u.user_id
        WHERE group_id = $1 AND date BETWEEN $2 AND $3
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY date 
        ;
      `;
        values = [userId, start, end]; 
      }    
    
      const result = await pool.query(query, values);
      res.status(200).json(result.rows);
      console.log('Quering all sales');
    } catch (error) {
      console.error('Error getting user revenue:', error);
      res.status(500).json({ error: 'Database query failure' });
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

  // Webinterface setup
  // Swagger site:  http://localhost:3000/docs/
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.listen(PORT, HOST);
  console.log(`Server is running on http://${HOST}:${PORT}`);
}

start();
