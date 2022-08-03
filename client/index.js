/* Importing modules */
const rl = require("readline-sync");
const settings = require("./settings.json");

/* Creating a socket connection to the server. */
const socket = require("socket.io-client").io;
const io = socket(settings.server);

console.clear();

/**
 * It asks the user for a message, and then sends that message to the server
 */
const start = () => {
  const msg = rl.question("", { min: 1, max: 100 });

  io.emit("message", msg);
};

io.once("connect", () => {
  /* Sending the login and password to the server. */
  io.emit(
    "auth",
    {
      login: rl.question("Type login: "),
      password: rl.question("Type password: ", { min: 3, hideEchoBack: true }),
    },

    (authResult) => {
      console.clear();
      if (authResult) {
        console.log("Welcome !\n\n\n");
        start();
      } else {
        console.clear();
        console.log("Invalid login or password");

        process.exit();
      }
    }
  );

  io.on("message", async (msg) => await console.log(msg));
  io.on("sent", () => start());
});
