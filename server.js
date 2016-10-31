'use strict';

const fs = require('fs');
const Hapi = require('hapi');
const squel = require('squel');
const pluralize = require('pluralize');

let resources = {};
const normalizedPath = require('path').join(__dirname, 'resources');
fs.readdirSync(normalizedPath).forEach(function(file) {
  const resourceName = file.split('.')[0];
  resources[resourceName] = require('./resources/' + file);
});

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

let db = [];
for (const dsn of config.dsn) {
  db[dsn.name] = require('odbc')();
  db[dsn.name].open(dsn.conn, function(err) {
    if (err) return console.log(err);
  });
}

const getHandler = function(resource, request, reply) {
  const dsn = request.params.dsn;
  const table = resource.tableName;
  let sql = squel.select().from(table);
  // let bindingarameters = [];

  if (request.params.id) {
    // we were sent an ID to get one record
    if (resource.id) {
      sql = sql.where(resource.id + ' = ?', request.params.id);
    } else {
      return reply(JSON.stringify({error: 'No ID field defined'}))
        .type('application/json')
        .code(500);
    }
  } else if (request.query === {}) {
    // no query parameters
  } else {
    for (let key in request.query) {
      sql = sql.where(key + ' = ?', request.query[key]);
    }
  }
  const sqlString = sql.toString();
  console.log('Sending SQL:', sqlString);
  db[dsn].query(sqlString, function(err, data) {
    console.log('Rows:', data.length);
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
      const encoded = resource.encode(pluralize, data);
      return reply(JSON.stringify(encoded))
        .type('application/json')
        .code(statusCode);
    }
  });
};

const getSingleHandler = function(request, reply) {
  const resourceName = request.params.resource;
  const resource = resources[resourceName];
  return getHandler(resource, request, reply);
};

const getMultiHandler = function(request, reply) {
  const resourceName = pluralize(request.params.resource, 1);
  const resource = resources[resourceName];
  return getHandler(resource, request, reply);
};

const server = new Hapi.Server();
server.connection({
  port: 6322,
  routes: {
    cors: true
  }
});

server.route({
  method: 'GET',
  path: '/{dsn}/{resource}/{id}',
  handler: getSingleHandler
});

server.route({
  method: 'GET',
  path: '/{dsn}/{resource}',
  handler: getMultiHandler
});

server.start(function(err) {
  if (err) {
    throw err;
  }
  console.log('Server running');
});
