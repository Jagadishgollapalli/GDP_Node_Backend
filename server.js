const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');

const upload = multer({ dest: 'uploads/' });

const bodyParser = require('body-parser');
require('dotenv').config({
    override: true,
    path: path.join(__dirname, 'dev.env')
})
const app = express();
const expressPORT =  8000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.post('/upload', upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const file = req.file;
    const tempFilePath = file.path;

    try {
        const results = [];

        fs.createReadStream(tempFilePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // Run Python script
                const pythonProcess = spawn('python', [path.join(__dirname, 'python_script.py'), tempFilePath]);

                let cleanedData = '';
                let errorData = '';

                pythonProcess.stdout.on('data', (data) => {
                    cleanedData += data.toString();
                    console.log(data);
                });

                pythonProcess.stderr.on('data', (data) => {
                    errorData += data.toString();
                });

                pythonProcess.on('close', async (code) => {
                    if (code === 0) {
                        try {
                            // Handle cleaned data
                            console.log('Cleaned data:', cleanedData);
                            res.status(200).send({ message: 'Data cleaned successfully.' });
                        } catch (error) {
                            console.error('Error handling cleaned data:', error);
                            res.status(500).send('Error handling cleaned data.');
                        }
                    } else {
                        console.error('Error running Python script:', errorData);
                        res.status(500).send({ message: 'Error running Python script.' });
                    }
                });
            });
    } catch (error) {
        console.error('Error processing uploaded file:', error);
        res.status(500).send('Error processing uploaded file.');
    }
});


app.get("/login", function (req, res) {
    // Your login route implementation
});

app.listen(8000, (req, res) => {
    console.log(`server listening on ${expressPORT}`);
});
