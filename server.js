var express = require("express");
var socket = require("socket.io");
var app = express();

app.use(express.static("www"));

var server = app.listen(5000, function() {
  console.log("Running on port 5000");
});

var io = socket(server);

// Global variables to hold all usernames and rooms created
var usernames = {};
var rooms = ["All", "Friends", "Family", "Colleague"];

io.on("connection", function(socket) {

  console.log("a new user connected");

  socket.on("createUser", function(username) {
    socket.username = username;
    usernames[username] = username;
      socket.currentRoom = "All";
      socket.join("All");
    socket.emit("updateChat", "INFO", "You have joined <b>All</b> group");
    socket.broadcast
        .to("All")
      .emit("updateChat", "INFO", username + " joined <b>All</b> group");
    io.sockets.emit("updateUsers", usernames);
      socket.emit("updateRooms", rooms, "All");
  });


  socket.on("sendMessage", function(data) {
    io.sockets
      .to(socket.currentRoom)
      .emit("updateChat", socket.username, data);
  });

//file upload
socket.on('userImage', function (image) {
    io.sockets.emit('addimage', socket.username, image);
});

  socket.on("createRoom", function(room) {
    if (room != null) {
      rooms.push(room);
      io.sockets.emit("updateRooms", rooms, null);
    }
  });

  socket.on("updateRooms", function(room) {
    socket.broadcast
      .to(socket.currentRoom)
      .emit("updateChat", "INFO", "<span style='color:red'><b>"+socket.username + "</b> left group <b>"+socket.currentRoom+"</b></span>");
    socket.leave(socket.currentRoom);
    socket.currentRoom = room;
    socket.join(room);
    socket.emit("updateChat", "INFO", "You joined " + room + " group");
    socket.broadcast
      .to(room)
      .emit("updateChat", "INFO", socket.username + "</b> has joined <b>" + room + "</b> group");
  });

//typing indicator
  socket.on("typing", data => { 
    socket.broadcast.emit("notifyTyping", { user: data.user, message: data.message }); 
  }); 
//when soemone stops typing
  socket.on("stopTyping", () => { 
    socket.broadcast.emit("notifyStopTyping");
  });

//play broadcast message
  socket.on("rSound", data => {
    socket.broadcast.emit("notifySound", { sound: data.sound }); 
  }); 

//disconnect user
  socket.on("disconnect", function() {
    delete usernames[socket.username];
    io.sockets.emit("updateUsers", usernames);
    socket.broadcast.emit("updateChat", "INFO", "<span style='color:red'><b>System:</b><br/><b>"+socket.username + "</b> has disconnected</span>");
  });

});
