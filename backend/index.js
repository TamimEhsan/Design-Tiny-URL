
const { Pool } = require("pg");
const cors = require('cors');
const express = require('express');

const app = express();
app.use(express.json());
app.use(cors());
require("dotenv").config();
const PORT = process.env.PORT || 8000;


// connect to database and create a table to store the original and shortend urls
// create a table with two columns: original_url and shortend_url
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 100,
});


const init_ddl = async () => {
    const query = 'CREATE TABLE IF NOT EXISTS urls (original_url VARCHAR(255) , shortend_url VARCHAR(255) PRIMARY KEY)';
    await pool.query(query);
    console.log("Table created");
};

while (true) {
    console.log("Waiting for db");
    try {
        init_ddl();
        break;
    } catch (e) {
        console.log(e);
    }
}

app.get("/", (req, res) => {
    res.json({
        message: "API is working"
    });
});



app.get('/create', async (req, res) => {
    // get the original url from the request
    // create a shortend url
    // save the shortend url in the database
    // return the shortend url
    const shortend_url = await generateAndSaveRandomUrl(req.query.url);
    res.json({
        original_url: req.query.url,
        shortend_url: shortend_url,
        message: `Shortend url created ${req.query.url} shortened to localhost:${PORT}/${shortend_url}`
    });
});

app.get('/:shortend_url', async (req, res) => {
    // get the shortend url from the request
    // find the original url from the database
    // redirect to the original url
    // console.log(`Redirecting to short url`);
    const start = performance.now();
    const query = 'SELECT * FROM urls WHERE shortend_url = $1';
    const results = await pool.query(query, [req.params.shortend_url]);
    const end = performance.now();
   
    if (results.rows.length === 0) {
        return res.json({
            message: "Shortend url not found"
        });

    }
    const original_url = results.rows[0].original_url;
   
    return res.redirect(original_url);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// A function that will generate a random url and check if it is present in the database
// if it is present, generate another random url
// if not, return the random url
function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

const generateAndSaveRandomUrl = async (long_url) => {
    // generate random url
    // check if it is present in the database
    // if it is present, generate another random url
    // else save the random url in the database
    // return the random url

    while (true) {
        let random_url = makeid(7);
        const query = 'INSERT INTO urls(original_url,shortend_url) VALUES($1,$2) ON CONFLICT(shortend_url) DO NOTHING RETURNING *;';
        const params = [long_url, random_url];
        const results = await pool.query(query, params);
        if (results.rows.length > 0) {
            return random_url;
        }
        console.log("failed to generate unique string");
    }

}


