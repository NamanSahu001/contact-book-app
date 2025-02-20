const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());



const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));