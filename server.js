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
app.get('/', function(req, res) {
  res.redirect('/congregant/')
});

// Create socket connection
let io = require('socket.io').listen(server);
let congregants = io.of('/congregant');
let ministers = io.of('/minister');

// Get the array of rooms
let rooms = congregants.adapter.rooms;
let roomNum = 0;
// Keep track of minister for each room
let mins = {};
// Keep track of minister number
let m = 0;
// How many in a group? Default is 2
let NUM_PARTNERS = 2;
// How many rooms?
let NUM_ROOMS = 2;

// Room numbers
let rnums = [];
for (let n = 0; n < NUM_ROOMS; n++) {
  rnums.push(n);
}

// Initialize ministers
for (let m = 0; m < NUM_ROOMS; m++) {
  mins[m] = null;
}

// Listen for minister clients to connect
ministers.on('connection', function(socket) {
  console.log('A minister client connected: ' + socket.id);

  // Assign minister to room
  let assigned = false;
  for (let m = 0; m < NUM_ROOMS; m++) {
    if (!mins[m]) {
      socket.room = m;
      mins[m] = socket;
      assigned = true;
      break;
    }
  }

  if (assigned) console.log("Minister assigned to room: " + socket.room);
  else console.log("Failed to assign minister to room. ");

  // Send along the prompts
  socket.on('text', function(data) {
    let message = {
      id: socket.id,
      data: data
    };
    //This socket's room
    let r = socket.room;
    congregants.to(r).emit('text', message);
    //console.log('Prompt: ' + data);
  })

  socket.on('complete', function(data) {
    console.log('Complete prompt: ' + data);
    //This socket's room
    let r = socket.room;
    // Tell congregants that you're done.
    congregants.to(r).emit('complete', socket.id);
    // Which log to write message to
    const path = r + '.txt';
    // Message to write to log
    const entry = 'Prompt: ' + data;
    // Log it
    log(path, entry);
  });

  // Listen for this output client to disconnect
  socket.on('disconnect', function() {
    console.log("A minister client has disconnected " + socket.id);
    let r = socket.room;
    mins[r] = null;
  });
});
// Listen for congregant clients to connect
congregants.on('connection', function(socket) {
  console.log('A congregant client connected: ' + socket.id);

  // Join a room
  joinRoom(socket);

  // Listen for data messages
  socket.on('text', function(data) {
    // Data comes in as whatever was sent, including objects
    console.log("Received: 'message' " + data);

    // Which private room does this client belong to?
    let r = socket.room;

    // Wrap up data with socketId
    let message = {
      id: socket.id,
      data: data
    };

    // Share data to all members of room
    congregants.to(r).emit('text', message);
    // Share to minister for room
    if (mins[r]) ministers.to(mins[r].id).emit('text', message);
  });

  // Listen for complete response
  socket.on('complete', (data) => {
    // Which private room does this client belong to?
    let r = socket.room;
    // Share data to all members of room
    congregants.to(r).emit('complete', socket.id);
    // Share to minister for room
    if (mins[r]) ministers.to(mins[r].id).emit('complete', socket.id);
    // Which log to write message to
    const path = r + '.txt';
    // Message to write to log
    const entry = socket.id + ': ' + data;
    // Log it
    log(path, entry);
  });


  // Listen for this client to disconnect
  // Tell partners this client disconnected
  socket.on('disconnect', function() {
    console.log("Client has disconnected " + socket.id);

    // Which room was this client in?
    let r = socket.room;
    // Tell others in room client has left
    if (rooms[r]) socket.to(r).emit('leave room');

    // Tell minister you've left
    if (mins[r]) ministers.to(mins[r].id).emit('leave room', socket.id);
  });
});

// Join room
function joinRoom(socket) {
  // Sort backwards
  if (Math.random(1) > 0.5) rnums.reverse();

  // First, add client to incomplete rooms
  for (let r of rnums) {
    try {
      let room = rooms[r];
      if (room.length < NUM_PARTNERS) {
        addSocketToRoom(socket, r);
        return;
      }
    } catch {
      continue;
    }
  }
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
