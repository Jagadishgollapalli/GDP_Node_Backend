const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config({
    override: true,
    path: path.join(__dirname, 'dev.env')
})
const app = express();
const expressPORT =  8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'html');

const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { rows } = await pool.query('SELECT * FROM userdetails WHERE email = $1 AND password = $2', [email, password]);
        
        if (rows.length > 0) {
            // Authentication successful
            rows.forEach(user => {
                const userRole = user.role;
                const userName = user.name;
                // Redirect to different routes based on user role
                let redirectUrl;
                if (userRole === 'superAdmin') {
                    redirectUrl = '/superAdmin';
                } else if (userRole === 'faculty') {
                    redirectUrl = '/faculty';
                } else if (userRole === 'CSadmin') {
                    redirectUrl = '/Csadmin';
                }else if (userRole === 'ISadmin') {
                    redirectUrl = '/Isadmin';
                }else {
                    // Handle other roles or scenarios
                    res.status(401).json({ error: 'Unauthorized role' });
                    return;
                }
                res.json({ Name:userName, role:userRole, url: redirectUrl });
            })
        } else {
            // Authentication failed
            res.status(401).send('Unauthorized');
        }
    } catch (e) {
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/login", function (req, res) {
    res.send('Welcome to postgres');
})

app.listen(8000, (req, res) => {
    console.log(`server listening on ${expressPORT}`);
});