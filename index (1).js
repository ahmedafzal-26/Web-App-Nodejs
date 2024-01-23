var express = require("express"); // Import Express package
var app = express(); // Create Express app
var connection = require('./database'); // Import database 

app.use(express.static(__dirname)); // Serve static files

app.use(express.urlencoded({extended:true})); // Parse URL-encoded data

app.get('/', function(req, res) // Serve index.html file

{
res.sendFile(__dirname + '/form.html'); //   Serve index.html file
});

 function checkPort(req, res, next) // Check if port is available
 { 
    const port = process.env.PORT || 4000; //   Set port
    const server = app.listen(port, () => {
         //   Listen on port
      console.log(`Listening on port ${port}`); //   Log port
      server.close(); //   Close server
      next(); //   Move to next middleware

    });

    server.on('error', (err) => //   Handle errors in server

    {
      if (err.code === 'EADDRINUSE') //   Check if port is already in use
      { 
        res.status(500).send('Port is already in use. Please specify a different port.'); //   Send error message
      }
    });
  }

  function checkDatabaseSchema(req, res, next) // Check if database schema matches
  {
    const connection = require('./database'); // Database connection
    const schemaQuery = 'DESCRIBE mysql_table'; // Query to check database schema
  
    connection.query(schemaQuery, (err, result) => // Check database schema
    {
      if (err) {
        res.status(500).send('Error checking database schema.'); //   Send error message
      } else {
        // Check if the result contains the expected fields in your schema
        const expectedFields = ['first_name', 'last_name', 'email', 'phone_number', 'eircode']; // Expected fields in my schema
        const existingFields = result.map(row => row.Field); // Get existing fields from result
  
        const missingFields = expectedFields.filter(field => !existingFields.includes(field)); // Get missing fields from expected fields
        if (missingFields.length > 0) // Check if there are missing fields
        {
          res.status(500).send('Database schema does not match the expected schema.'); //   Send error message
        } else //   If there are no missing fields
        {
          console.log('Database schema is valid.');//   Log success
          next();//   Move to next middleware
          connection.end(console.log('Database connection closed. Data inserted successfully.')); 
          //   Close database connection for security but can stay open for debugging
        }
      }
    });
  }

app.use(checkPort, checkDatabaseSchema);  //   Use checkPort and checkDatabaseSchema middleware in order

app.post('/submit', function(req, res) { // Handle form submission and insert data into database

    const { firstName, lastName, email, phoneNumber, eircode } = req.body;// Get form data from request body 
  
    // Validation checks for each field 
    if (

      firstName && lastName && email && phoneNumber && eircode && // All fields must be filled out

      firstName.length <= 20 && lastName.length <= 20 && // First and last name must be between 1 and 20 characters 

      /^[A-Za-z0-9]+$/.test(firstName) && /^[A-Za-z0-9]+$/.test(lastName) && // First and last name must only contain letters and numbers 

      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && // Email must be a valid email address 

      /^\d{10}$/.test(phoneNumber) && // Phone number must be a 10-digit number 

      /^\d[A-Za-z0-9]{5}$/.test(eircode) // Eircode must be a 6-digit alphanumeric string 

    ) {

      // If all fields pass validation, proceed to insert into the database
      const sql = "INSERT INTO mysql_table (first_name, last_name, email, phone_number, eircode) VALUES(?, ?, ?, ?, ?)"; // SQL query

      connection.query(sql, [firstName, lastName, email, phoneNumber, eircode], function(err, results) {// Execute query

        if (err) {// If an error occurs
          console.error("Error inserting data: ", err); // Log the error
          return res.status(500).send("Error: Couldn't insert data into the database"); // Send an error response
        }// Otherwise, send a success response

        res.redirect("/home.html"); // Redirect to the form page
        

      });

    } else {    
      // If any field fails validation, send an error response
      return res.status(400).send("Please check the entered data and try again:\n" +
      "- First name must be between 1 and 20 characters\n" +
      "- Last name must be between 1 and 20 characters\n" +
      "- Email must be a valid email address\n" +
      "- Phone number must be a 10-digit number\n" +
      "- Eircode must be a 6-digit alphanumeric string");
    }
  });

app.get("/form", function (req,res) // Serve form.html
{
    res.sendFile(__dirname + '/form.html'); // Serve form.html from the current directory
});

app.listen(3000, function() // Listen on port 3000 for requests
{
    console.log("App Listening on port 3000"); // Log success message

    connection.connect(function(err) // Connect to database 
    {

        if(err) throw err; // If an error occurs
        //------------------
        console.log('Database connected') // If connection is successful

        validateAndInsert(csvData); // Validate and insert data into database table from csvData variable

    })
});



//---------------------------------------------------------------------------------------------------------------------------------------



const csvData = `"John, Doe, johndoe@example.com, 0893216548, 1YR5DD"
     "Jane, Smith, janesmith@example.com, 0892856548, 8MH7WE"
     "Michael, Johnson, michaeljohnson@example.com, 0898523694, 7RP0RR"
     "Tommy, Bean, tommybean@example.com, 0894859612, 8YR5DD"`; // Example CSV data string to validate and insert into database table
async function validateAndInsert(data) // Validate and insert data into database table
{
    const records = data.split('\n'); // Split data into records by line
    
    for (let index = 0; index < records.length; index++) // Loop through records 
    {
      const record = records[index]; // Get current record 
      const fields = record.trim().slice(1, -1).split(',').map(field => field.trim()); // Split record into fields 
    
      if (fields.length !== 5) // Check if record has 5 fields 
      {
        console.error(`Invalid data format at index ${index + 1}`); // Log error message 
        continue; // Skip to the next record 
      }
    
      const [firstName, lastName, email, phoneNumber, eircode] = fields; // Get first name, last name, email, phone number, and eircode from fields 
    
      if (!validateFirstName(firstName) || !validateLastName(lastName) || !validateEmail(email) || 
      !validatePhoneNumber(phoneNumber) || !validateEircode(eircode)) // Validate fields 
      {
        console.error(`Validation failed at index ${index + 1}`); // Log error message 
        continue; // Skip to the next record
      }
    
      // Insert data into database table if validation is successful and data is unique (NOT EXISTS)
      const sql = `
        INSERT INTO mysql_table (first_name, last_name, email, phone_number, eircode)
        SELECT * FROM (SELECT ?, ?, ?, ?, ?) AS tmp WHERE NOT EXISTS 
        (
          SELECT 1
          FROM mysql_table
          WHERE
            mysql_table.first_name = ?
            AND mysql_table.last_name = ?
            AND mysql_table.email = ?
            AND mysql_table.phone_number = ?
            AND mysql_table.eircode = ?
        )
      `;
  
      try {
        // Insert data into database table using prepared statement 
        const result = await connection.query(sql, [firstName, lastName, email, phoneNumber, eircode, firstName, lastName, email, phoneNumber, eircode]);
        console.log(`Record inserted successfully at index ${index + 1}`); // Log success message and index
      } catch (err) // Catch errors when inserting data 
      {
        console.error(`Error inserting data at index ${index + 1}:`, err); //   Log error message and index
      }
    }
  }

// Validation functions
function validateFirstName(firstName) // Validate first name field 
{
  return /^[A-Za-z\s]+$/.test(firstName); // Check if first name contains only letters and spaces
}

function validateLastName(lastName) // Validate last name field 
{
  return /^[A-Za-z\s]+$/.test(lastName); // Check if last name contains only letters and spaces 
}

function validateEmail(email) // Validate email field 
{
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);// Check if email is in valid format 
}

function validatePhoneNumber(phoneNumber) // Validate phone number field 
{
  return /^\d{10}$/.test(phoneNumber); // Check if phone number is in valid format
}

function validateEircode(eircode) // Validate eircode field 
{
  return /^\d[A-Za-z0-9]{5}$/.test(eircode); // Check if eircode is in valid format 
}





  





  


