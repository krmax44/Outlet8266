#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WebServer.h>
#include <RCSwitch.h>
#include <TaskScheduler.h>

// configuration
const char* ssid     = ""; // your wifi ssid (name)
const char* password = ""; // your wifi password
const char* outlet32pass = ""; // your outlet32 password
const String duckdns_token = ""; // your duckdns token
const String duckdns_domain = ""; // your duckdns domain
int protocol = 1; // default protocol, if not definied in the request

String logtext = "";
IPAddress ip;

RCSwitch mySwitch = RCSwitch();

ESP8266WebServer server(80);

void duckdns();

Task taskDuckdns(300000, TASK_FOREVER, &duckdns);
Scheduler runner;

void setup(void) {
  // serial at 9600
  Serial.begin(9600);

  mySwitch.enableTransmit(0); // GPIO 0 (= DP3 on NodeMCU v3)
  //mySwitch.setRepeatTransmit(30); // if needed

  WiFi.begin(ssid, password);

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    logn(".");
  }

  logln("Connected to ");
  logn(ssid);
  logln("IP address: ");
  ip = WiFi.localIP();
  logn(String(ip[0]) + "." + String(ip[1]) + "." + String(ip[2]) + "." + String(ip[3]));

  server.on("/", []() {
    // root path redirects to the web app
    server.sendHeader("Location", "http://outlet8266.krmax44.de");
    server.send(301, "text/plain", "");
  });

  server.on("/api/binary", []() {
    sendCode("binary");
  });

  server.on("/api/tristate", []() {
    sendCode("tristate");
  });

  server.on("/api/decimal", []() {
    sendCode("decimal");
  });

  server.on("/log", []() {
    // output log
    if (server.arg("pass") == outlet32pass) {
      server.send(200, "text/plain", logtext);
    }
    else {
      logln("Password incorrect!");
      server.send(403, "text/plain", "PASS");
    }
  });

  server.onNotFound([]() {
    // 404 redirects to the web app
    server.sendHeader("Location", "http://outlet8266.krmax44.de");
    server.send(301, "text/plain", "");
  });

  server.begin();
  logln("HTTP server started");

  runner.init();
  runner.addTask(taskDuckdns);
  taskDuckdns.enable();
}

void loop(void) {
  server.handleClient();
  runner.execute();
}

void sendCode(String type) {
  // setting up API
  if (server.arg("pass") == outlet32pass) {
    logln("Password correct, receiving code...");

    if (server.arg("code") != "") {
      if (server.arg("protocol") != "") {
        mySwitch.setProtocol(server.arg("protocol").toInt());
        logln("Set the protocol to " + server.arg("protocol"));
      }
      else {
        mySwitch.setProtocol(protocol);
        logln("Set the protocol to the default");
      }
      
      if (server.arg("pulselength") != "") {
        mySwitch.setPulseLength(server.arg("pulselength").toInt());
        logln("Set the pulselength to " + server.arg("pulselength"));
      }

      if (type == "decimal") {
        mySwitch.send(server.arg("code").toInt(), 24);
      }
      else if (type == "tristate") {
        mySwitch.sendTriState(string2char(server.arg("code")));
      }
      else {
        mySwitch.send(string2char(server.arg("code")));
      }

      logln("Sent code: " + server.arg("code")); // string2char(server.arg("code"));
    }

    server.send(200, "text/plain", "OK");
  }
  else {
    logln("Password incorrect!");
    server.send(403, "text/plain", "PASS");
  }
}

void duckdns() {
  if (duckdns_token != "" && duckdns_domain != "") {
    logln("Starting to update DuckDNS...");
    if ((WiFi.status() == WL_CONNECTED)) {
      WiFiClient client;

      if (!client.connect("duckdns.org", 80)) {
        logln("Error while updating DuckDNS...");
        return;
      }

      String url = "/update?domains=" + duckdns_domain + "&token=" + duckdns_token;

      client.print(String("GET ") + url + " HTTP/1.1\r\n" +
               "Host: duckdns.org\r\n" + 
               "Connection: close\r\n\r\n");
      unsigned long timeout = millis();
      while (client.available() == 0) {
        if (millis() - timeout > 5000) {
          logln("Error while updating DuckDNS...");
          client.stop();
          return;
        }
      }

      while(client.available()){
        String line = client.readStringUntil('\r');
        logn(line);
      }
      
      logln("Updated DuckDNS.");
    }
  }
}

void logn(String text) {
  logtext = logtext + text;
  Serial.print(text);
}

void logln(String text) {
  logtext = logtext + "\n" + text;
  Serial.println(text);
}

char* string2char(String command) {
  if (command.length() != 0) {
    char *p = const_cast<char*>(command.c_str());
    return p;
  }
}
