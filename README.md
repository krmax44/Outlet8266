# Outlet8266

Transmits RF signals received via HTTP. Created for the ESP8266.

  - Tutorial: [DIY Smart WiFi Outlets with Outlet8266, Controllable With Google Assistant, IFTTT, Tasker and More](https://krmax44.de/blog/cheap-diy-wifi-outlets/)
  - Web App: [outlet8266.krmax44.de](http://outlet8266.krmax44.de)
  
## API

### Decimal

```
GET /api/decimal
code: decimal rf code
pass: Outlet8266 password
protocol: optional rf protocol
pulselength: optional rf pulselength
```

returns either `OK` or `PASS` in case the password is incorrect

### Binary

```
GET /api/binary
code: binary rf code
pass: Outlet8266 password
protocol: optional rf protocol
pulselength: optional rf pulselength
```

returns either `OK` or `PASS` in case the password is incorrect

### Tristate

```
GET /api/tristate
code: tristate rf code
pass: Outlet8266 password
protocol: optional rf protocol
pulselength: optional rf pulselength
```

returns either `OK` or `PASS` in case the password is incorrect

### Log

```
GET /log
pass: Outlet8266 password
```

returns the log
