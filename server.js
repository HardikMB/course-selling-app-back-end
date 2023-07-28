const express = require('express')
const PORT = 3000

const app = express();

const router = express.Router();

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET');
  next();
});

router.get('/health', (req, res) => {
  res.status(200).send('Ok');
});

app.use('/api/v1', router);

app.listen(PORT,()=>{
    console.log("Backend server started for course selling website:")
})