const express = require('express');
const mysql = require('mysql');

const app = express()
const dbConnection = mysql.createConnection({
    host : 'MacBook-Pro.local',
    port : 3306,
    user : 'zoey-test-user',
    password : '12345'
});

dbConnection.connect((err) => {
    if(err) throw err;
    console.log('Successfully connected to MySql Server');
});




const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})