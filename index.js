require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.get('/', (req, res) => res.json({ success: 'Hello World!'}));
app.listen(port, () => console.log(`App listening on port $(port)`));