
import express from 'express';
const app = express();
import apiRouter from './router/api.js';
const port = process.env.PORT || 4000;
import bodyParser from "body-parser";



app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); ;
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});

app.use('/api', apiRouter);
