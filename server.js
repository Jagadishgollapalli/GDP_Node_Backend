const express = require('express');
const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const fileUpload = require('express-fileupload');

const cors = require('cors');

const bodyParser = require('body-parser');
require('dotenv').config({
    override: true,
    path: path.join(__dirname, 'dev.env')
})
const app = express();
const expressPORT =  8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true // Include if you're using cookies or authentication headers
}));

app.use(fileUpload());

app.set('view engine', 'html');

const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
});

app.post('/upload', async (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).send('No files were uploaded.');
    }

    const file = req.files.file;
    const tempFilePath = 'temp.csv';

    try {
        await file.mv(tempFilePath);

        // Process the CSV file
        const results = [];
        fs.createReadStream(tempFilePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                const client = await pool.connect(); // Establish database connection
                try {
                    await client.query('BEGIN');

                    const insertQueries = results.map((row) => {
                        return client.query('INSERT INTO assessments (assessment_title, assessment_id, assessment_type, submission_score, learning_outcome_name, learning_outcome_id, attempt, outcome_score, course_name, course_id, course_sis_id, section_name, section_id, section_sis_id, assignment_url, learning_outcome_friendly_name, learning_outcome_points_possible, learning_outcome_mastery_score, learning_outcome_mastered, learning_outcome_rating, learning_outcome_rating_points, account_id, account_name, enrollment_state) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)',
                        Object.values(row));
                    });

                    await Promise.all(insertQueries);

                    await client.query('COMMIT');
                    res.status(200).send('File uploaded and data inserted successfully.');
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                } finally {
                    client.release(); // Release the client back to the pool
                    fs.unlinkSync(tempFilePath); // Remove temporary CSV file
                }
            });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Error uploading file.');
    }
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