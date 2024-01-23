var mysql = require("mysql");

var connection = mysql.createConnection({
    
    host: "localhost",
    database:"mysql_db",
    user:"root",
    password:"password"

})

module.exports = connection;