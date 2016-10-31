'use strict';

module.exports = {
  id: 'myIdField',
  tableName: 'actualDbTabletName',
  name: 'nameOfThisResource',

  encode: function(pluralize, data) {
    let rows = [];
    data.forEach(function(row) {
      rows.push({
        id: row.myIDField,
        company: row.exampleCompanyName
      });
    });
    let encoded = {};
    if (rows.length === 1) {
      encoded[this.name] = rows[0];
    } else {
      encoded[pluralize(this.name, 5)] = rows;
    }
    return encoded;
  },

  decode: function(data) {
    // TODO: Make this do something
    return data;
  }
};
