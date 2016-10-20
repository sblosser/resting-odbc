'use strict';

const fs = require('fs');
const Hapi = require('hapi');

let formats = {};
const normalizedPath = require("path").join(__dirname, "formats");
fs.readdirSync(normalizedPath).forEach(function(file) {
  const formatName = file.split('.')[0];
  formats[formatName] = require("./formats/" + file);
})

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let db = [];
for (const dsn of config.dsn) {
  db[dsn.name] = require('odbc')();
  db[dsn.name].open(dsn.conn, function(err) {
    if (err) return console.log(err);
  });
}

const customEncode = function(data, table) {
  let encoded = {};
  if (formats[table]) {
    console.log('Using custom encoder: ' + table);
    encoded[table] = formats[table].encode(data);
    return encoded;
  } else {
    console.log('Usting standard encoder');
    encoded[table] = data;
    return encoded;
  }
}

const customDecode = function(data, table) {
  if (formats[table]) {
    return formats[table].decode(data);
  } else {
    return JSON.parse(data);
  }
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

  if (request.params.id) {
    // we were sent an ID to get one record
    if (formats[table].id) {
      sql = sql + " WHERE " + formats[table].id + " = ?";
      bindingParameters.push(request.params.id);
    } else {
      return reply(JSON.stringify({error: "No ID field defined"}))
        .type('application/json')
        .code(500);
    }
  } else if (request.query === {}) {
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
      const encoded = customEncode(data, table);
      return reply(JSON.stringify(encoded))
        .type('application/json')
        .code(statusCode);
    }
  });
};

server.route({
  method: 'GET',
  path: '/{dsn}/{table}/{id}',
  handler: getHandler
})

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
