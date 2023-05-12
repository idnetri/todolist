require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();
const { migration, db } = require('./db');

const port = process.env.PORT || 3030;
const host = process.env.HOST || 'localhost';

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// routes
app.get('/hello', (req, res) => {
    res.json({ message: 'Hello world' });
});

// get all activities
app.get('/activity-groups', async (req, res) => {
    // query for getting all data from activities table
    const [rows] = await db.query(`SELECT * FROM activities`);
    res.json({ status: 'Success', data: rows });
});

// create activity groups
app.post('/activity-groups', async (req, res) => {
    const { title, email } = req.body;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // query for creating new contact
    const sql = 'INSERT INTO activities (title, email, createdAt,updatedAt) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(sql, [title, email, now, now]);

    res.json({
        status: 'Success',
        message: 'Activities created',
        data: {
            id: result.insertId,
            title,
            email,
            now,
        },
    });
});

// get activity group by id
app.get('/activity-groups/:id', async (req, res) => {
    const { id } = req.params;

    // query for getting activity group by id
    const [rows] = await db.query(`SELECT * FROM activities WHERE activity_id = ?`, [id]);

    if (rows.length === 0) {
        return res.status(404).json({ status: 'Not Found', message: `Activity with ID ${id} Not Found` });
    }

    return res.json({ status: 'Success', message: 'Success', data: rows[0] });
});

app.patch('/activity-groups/:activity_id', async (req, res, next) => {
    try {
      const activityId = req.params.activity_id;
      const { title, email } = req.body;
  
      // Get activity by id
      const [result] = await db.query('SELECT * FROM activities WHERE activity_id = ?', [activityId]);
  
      // Check if activity exists
      if (!result.length) {
        return res.status(404).json({
          status: 'Not Found',
          message: `Activity with ID ${activityId} Not Found`,
        });
      }
  
      // Update activity data
      const dataToUpdate = {
        title: title || result[0].title,
        email: email !== undefined ? email : result[0].email,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };
  
      // Update activity in database
      await db.query('UPDATE activities SET ? WHERE activity_id = ?', [dataToUpdate, activityId]);
  
      return res.json({
        status: 'Success',
        message: `Activity with ID ${activityId} updated`,
        data: {
          ...dataToUpdate,
          id: activityId,
        },
      });
    } catch (err) {
      next(err);
    }
  });

// delete activity group
app.delete('/activity-groups/:id', async (req, res) => {
    const id = req.params.id;

    // check if activity group exists
    const [rows] = await db.query('SELECT * FROM activities WHERE activity_id = ?', [id]);
    if (rows.length === 0) {
        return res.status(404).json({ status: 'Not Found', message: `Activity with ID ${id} Not Found` });
    }

    // delete activity group
    await db.query('DELETE FROM activities WHERE activity_id = ?', [id]);

    res.json({ status: 'Success', message: 'Success', data: {} });
});




//TODO
app.get('/todo-items', async (req, res) => {
    const { activity_group_id } = req.query;
  
    let query = 'SELECT * FROM todos';
    if (activity_group_id) {
      query += ` WHERE activity_group_id = ${activity_group_id}`;
    }
  
    try {
      const [rows] = await db.query(query);
      if (!rows.length) {
        return res.status(404).json({ message: 'No data found' });
      }
  
      return res.json({ message:'Success', status: 'Success', data: rows });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.post('/todo-items', async (req, res) => {
    const { title, activity_group_id, is_active } = req.body;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
    const sql = 'INSERT INTO todos (activity_group_id, title, is_active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.query(sql, [activity_group_id, title, is_active, now, now]);
  
    res.json({
      status: 'Success',
      message: 'Todo item created',
      data: {
        todo_id: result.insertId,
        activity_group_id,
        title,
        is_active,
        createdAt: now,
        updatedAt: now,
      },
    });
  });
  


// 404 endpoint middleware
app.all('*', (req, res) => {
    res.status(404).json({ message: `${req.originalUrl} not found!` });
});

// error handler
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message || 'An error occurred.',
    });
});




const run = async () => {
    await migration(); // 👈 running migration before server
    app.listen(port); // running server
    console.log(`Server run on http://${host}:${port}/`);
};

run();
