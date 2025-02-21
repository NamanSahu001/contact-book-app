const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/contacts', contactRoutes);

const PORT = 3001; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));