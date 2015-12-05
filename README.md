

##Installation

[![Join the chat at https://gitter.im/fxbrain/https-server](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/fxbrain/https-server?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

- npm run build
- npm run test

##Create Certificates

1. mkdir secrets && cd $_
2. openssl genrsa -des3 -out server.enc.key 2048
3. openssl req -new -key server.enc.key -out server.csr
4. openssl rsa -in server.enc.key -out server.key
5. openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

> Stefan Schwarz \<fxbrain@gmail.com\>
