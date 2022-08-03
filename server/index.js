const express = require("express");
const emiter = new (require("events").EventEmitter)();
const app = express();
const moment = require("moment");
const ip = require("ip").address();
const chalk = require("chalk");
const settings = require("./settings.json")
const request = require("request-promise")

let badwords = []
// load badwords database
if (settings.chat_filter) {
    (async () => {
        console.log("Loading badwords");
        if(settings.encycloDB) badwords = (Object.values(await request("https://raw.githubusercontent.com/turalus/encycloDB/master/Dirty%20Words/DirtyWords.json", {method: "GET"}).json())[0]).map(w => w.word);
        settings.addionalBadwords.forEach(word => badwords.push(word));
    })();
}

const { Server } = require("socket.io");
const server = require("http").createServer(app);

require("dotenv").config();
const port = process.env.PORT || 5000;

const users = [
    {
    login: "kj",
    password: "123",
  },
  {
      login: "kj2",
      password: "123",
  },
];

const send = (msg) =>
emiter.emit(
    "message",
    `[${moment().format("HH:mm")} ${msg.user}]: ${msg.content}`
    );

const io = new Server(server);

console.log("starting io server");
io.on("connection", (socket) => {
  socket.once("auth", (auth, callback) => {
    const user = users.filter((u) => u.login == auth.login)[0];
    if (!user || user.password != auth.password) {
        callback(false);
        return socket.disconnect();
    }
    callback(true);
    socket.login = auth.login;
    socket.auth = true;

    send({
      content: chalk.bold(`${user.login} join the chat`),
      user: "system",
    });

    console.log(
      chalk.blueBright(
        `${chalk.underline(
          chalk.bold(user.login)
        )} logged in from ${chalk.underline(socket.handshake.address)}`
      )
    );
});

  socket.on("message", async msg => {
    if (!socket.auth) return;
    
    /* It's checking if the chat filter is enabled and if the message contains a bad word. If it does, it
    sends a message to the user saying "Don't use badwords!" and then it returns. */
    if(settings.chat_filter && badwords.some(w => msg.includes(w))) {
        socket.emit("message", chalk.red("\nDon't use badwords !\n"))
        socket.emit("sent")
        return 
    }

    send({
      content: msg,
      user: socket.login,
    });
    socket.emit("sent");
  });

  emiter.on("message", (msg) => socket.emit("message", msg));
});

/* Listening to the port and ip address. */
server.listen(port, ip, () => {
  console.log("> Server is up and running on port : " + port);
  console.clear();
  console.log(`server is on ${chalk.underline(`http://${ip}:${port}`)}\n\n`);
});