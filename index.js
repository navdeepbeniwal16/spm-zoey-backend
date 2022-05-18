const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const TokenGenerator = require('uuid-token-generator');
const tokenGenerator = new TokenGenerator();

const app = express()
const dbConnection = mysql.createConnection({
    host : 'MacBook-Pro.local',
    port : 3306,
    user : 'zoey-test-user',
    password : '12345',
    database : 'spm_zoey_database'
});

dbConnection.connect((err) => {
    if(err) throw err;
    console.log('Successfully connected to MySql Server');
});

app.use(bodyParser.json());

// route to create a new user in the db
app.post('/users', async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = {
            firstname : req.body.firstname,
            lastname : req.body.lastname,
            email : req.body.email,
            password : hashedPassword,
            gender : req.body.gender,
            birthdate : req.body.birthdate,
            location : req.body.location
        };

        let dbQuery = `INSERT INTO users SET ?`;
        dbConnection.query(dbQuery, user, (err, dbResponse) => {
            if(err) {
                const errResponse = {
                    status : err.message ? 400 : 500,
                    errorMessage : err.message || 'Unknown Error',
                };
                res.json(errResponse).status(errResponse.status);
            }
            console.log('User created successfully...');
            console.log(dbResponse);
            res.status(201).send();
        })
    } catch {
        console.log('Exception occured while hashing the password');
        res.status(500).send();
    }
});

app.use('/users/login', (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    if(!isValidValue(email) || !isValidValue(password)) {
        res.status(400).json({
            status : 400,
            message : 'Either email or password is missing'
        }).send();
    }

    try {
        let dbQueryEmail = `SELECT * FROM users WHERE email = "${email}"`;
       
        dbConnection.query(dbQueryEmail, async (err, dbResponseEmail) => {
            if(err) {
                const errResponse = {
                    status : err.message ? 400 : 500,
                    message : err.message || 'Unknown Database Error',
                };
                res.json(errResponse).status(errResponse.status);
            }

            const userRecords = Object.values(JSON.parse(JSON.stringify(dbResponseEmail)));
            console.log(`User records found : ${userRecords.length}`);
            
            const userRecord = userRecords[0];
            if(userRecord === undefined || userRecord === null) { // no user record found
                const errResponse = {
                    status : 400,
                    message : 'Email doesn\'t exists'
                }
                res.json(errResponse).status(errResponse.status);
                
            } else {
                const passwordMatched = await bcrypt.compare(password, userRecord.password);
                if(passwordMatched) {
                    const token = tokenGenerator.generate(); // TODO: Also needs to store this into database
                    const successResponse = {
                        status : 200,
                        message : 'Logged In',
                        sessionToken : token
                    }
                    res.status(successResponse.status).json(successResponse).send();
                } else {
                    const errResponse = {
                        status : 400,
                        message : 'Password is incorrect'
                    }
                    res.status(errResponse.status).json(errResponse);
                }
            }
        });

    } catch(error) {
        console.log('Exception occured while querying user record');
        console.log(error.errorMessage);
        res.status(500).send();
    }
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})

const isValidValue = value => {
    if(value === undefined) return false; 
    if(value === null) return false;
    if(value === '') return false;

    return true
}