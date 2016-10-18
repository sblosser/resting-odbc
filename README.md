# resting-odbc

Sometimes I run into situations where I need to access data in a legacy database on a remote system. Often these old databases are on Windows, file-based, and use 32-bit ODBC drivers. (Example: Visual FoxPro.) When developing web-facing applications, Linux is the OS of choice, and so accessing these databases becomes a pain.

To partially resolve this, I've created this simple shim to expose any ODBC source via a RESTful interface. It still needs a lot of work (most notably authentication) but this is just start.

In my use case where I need to use 32-bit ODBC dirvers, this must be used with NodeJS x86, and `npm install`ed with node-gyp ran from the same x86 base.

I don't expect many will need this utility, but suggestions and pull requests are always welcome.

### Configuring

The `config.json` file defines the datasources. In this example:

```json
{
  "dsn": [
    {
      "name": "myDb",
      "conn": "Driver={Microsoft Visual FoxPro Driver};SourceType=DBC;SourceDB=E:\\DB\\somedir\\mydatabase.dbc;Exclusive=No;NULL=NO;Collate=Machine;BACKGROUNDFETCH=NO;DELETED=YES;"
    }
  ]
}
```

`dsn` is an array, that contains objects, each with two key-values. `name` is the URL friendly name of the datasource, and `conn` is a connection string relevant to your datasource. [connectionstrings.com](https://www.connectionstrings.com/) is a great reference for formats.

For the above example, sending a GET to the following URL would get you the contents of `sometable` from `myDb`:

`http://myrestserver:6322/myDb/sometable`

#### License

This project is licensed under the AGPL-3. See LICENSE.txt for detail.

Copyright 2016 Stan Blosser, All Rights Reserved
