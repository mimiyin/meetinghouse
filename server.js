// Create server
let port = process.env.PORT || 8000;
let express = require('express');
let app = express();
let server = require('http').createServer(app).listen(port, function() {
  console.log('Server listening at port: ', port);
});

// To write files
const fs = require('fs');

// Tell server where to look for files
app.use(express.static('public'));
app.get('/', function (req, res) {
  res.redirect('/congregant/')
});

// Create socket connection
let io = require('socket.io').listen(server);

// Get the array of rooms
let rooms = io.sockets.adapter.rooms;
let roomNum = 0;
// How many in a group? Default is 2
let NUM_PARTNERS = 3;
// How many rooms?
let NUM_ROOMS = 2;

// Listen for clients to connect
io.sockets.on('connection', function(socket) {
  console.log('A client connected: ' + socket.id);

  // Join a room
  joinRoom(socket);

  // Listen for data messages
  socket.on('text', function(data) {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'message' " + data);

    // Which private room does this client belong to?
    let r = socket.room;

    // Wrap up data with socketId
    let message = { id : socket.id, data : data };

    // Share data to all members of room
    io.to(r).emit('text', message);

    // Which log to write message to
    const path = r + '.txt';
    // Message to write to log
    const entry = socket.id + ': ' + data;
    // Log it
    log(path, entry);

  });

  // Listen for complete response
  socket.on('complete', ()=>{
    // Which private room does this client belong to?
    let r = socket.room;
    // Share data to all members of room
    io.to(r).emit('complete', socket.id);
  });


  // Listen for this client to disconnect
  // Tell partners this client disconnected
  socket.on('disconnect', function() {
    console.log("Client has disconnected " + socket.id);

    // Which room was this client in?
    let r  = socket.room;
    // Tell others in room client has left
    if (rooms[r]) {
      socket.to(r).emit('leave room');
    }
  });
});

// Join room
function joinRoom(socket) {

  // First, add client to incomplete rooms
  for (let r in rooms) {
    let room = rooms[r];
    if (room.isPrivate) {
      if (room.length < NUM_PARTNERS) {
        addSocketToRoom(socket, r);
        return;
      }
    }
  }

  // If there are no incomplete rooms, create new room and join it
  addSocketToRoom(socket, roomNum);
  roomNum++;
  roomNum%=NUM_ROOMS;
}

// Add client to room and record which room it was added to
function addSocketToRoom(socket, r) {
  socket.join(r);
  rooms[r].isPrivate = true;
  socket.room = r;
  console.log(rooms);
}

// Write to log file
function log(path, message) {
  // Break line
  message += "\n";
  // Check to see if the log file already exists
  fs.access(path, fs.F_OK, (err) => {
    if (err) {
      console.log("Creating new log file at: " + path);
      // Write to a new log file named with room #
      fs.writeFile(path, message, (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;
      });
      return
    }
    // Add to existing log file
    fs.appendFile(path, message, function(err) {
      if (err) throw err;
      console.log("Added " + message + " to " + path + ".");
    });
  });
}
