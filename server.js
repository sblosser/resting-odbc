'use strict';

const fs = require('fs');
const Hapi = require('hapi');
let db = [];

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

for (const dsn of config.dsn) {
  db[dsn.name] = require('odbc')();
  db[dsn.name].open(dsn.conn, function(err) {
    if (err) return console.log(err);
  });
}

const server = new Hapi.Server();
server.connection({
  port: 6322
});

const getHandler = function(request, reply) {
  const dsn = request.params.dsn;
  const table = request.params.table;
  let sql = "SELECT * FROM " + table;
  let bindingParameters = [];

  if (request.query === {}) {
    // no query parameters
  } else {
    sql = sql + " WHERE";
    for (let key in request.query) {
      sql = sql + " " + key + " = ? AND"
      bindingParameters.push(request.query[key]);
    }
    sql = sql.substring(0, sql.length-3);
  }

  db[dsn].query(sql, bindingParameters, function(err, data) {
    let statusCode = 200;
    if (err) {
      statusCode = 500;
      console.error(err);
      return reply(JSON.stringify(err))
        .type('application/json')
        .code(statusCode);
    } else {
      if (data.length === 0) {
        statusCode = 404;
      }
      return reply(JSON.stringify(data))
        .type('application/json')
        .code(statusCode);
    }
  });
};

server.route({
  method: 'GET',
  path: '/{dsn}/{table}',
  handler: getHandler
});

server.start(function(err) {
  if (err) {
    throw err;
  }
  console.log('Server running');
})
