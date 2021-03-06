const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const exphbs = require('express-handlebars');
const axios = require('axios');
const winston = require('winston');

const eth = require('./eth');
const pubtkt = require('./pubtkt');
const restapi = require('./restapi');
const eventapi = require('./eventapi');

const app = express();
const server = http.Server(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));
app.use('/admin', express.static(__dirname + '/../build'));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(pubtkt());
app.use('/api', restapi);

// FIXME: Should not be debug in production
winston.level = 'debug';

app.get('/', (req, res, next) => {
  res.render('hours');
});

app.get('/payrolls/:address(0x[0-9a-f]{40})', (req, res, next) => {
  const address = req.params.address;
  axios.get(`http://localhost:${port}/api/payrolls/${encodeURIComponent(address)}`)
    .then(response => response.data)
    .then(payroll => res.render('payroll', { payroll, address }))
    .catch(err => next(err));
});

eth.prepare()
  .then(() => eventapi.attach(io))
  .then(() => {
    winston.info(`Listening to port ${port}`);
    server.listen(port);
  })
  .catch(err => {
    console.log(err);
  });
