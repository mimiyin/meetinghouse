// Create server
let port = process.env.PORT || 8000;
let express = require('express');
let app = express();
let server = require('http').createServer(app).listen(port, function() {
  console.log('Server listening at port: ', port);
});

// To write files
//const fs = require('fs');

// Tell server where to look for files
app.use(express.static('public'));

// Create socket connection
let io = require('socket.io').listen(server);
// Get the array of rooms
let rooms = io.adapter.rooms;
let roomNum = 0;
// How many in a group? Default is 2
let NUM_PARTNERS = 2;

// // Clients in the minister namespace
// let ministers = io.of('/minister');
// // Listen for output clients to connect
// ministers.on('connection', function(socket) {
//   console.log('A minister client connected: ' + socket.id);
//
//   // Send along the prompts
//   ministers.on('prompt', function(prompt) {
//     congregants.emit('prompt', prompt);
//     console.log('Prompt: ' + prompt);
//
//     // Write prompt to all rooms
//     for (let r in rooms) {
//       let room = rooms[r];
//       if (!room.isPrivate) continue;
//       // Write to a new file named with room
//       fs.writeFile(r + '.txt', prompt, (err) => {
//         // throws an error, you could also catch it here
//         if (err) throw err;
//       });
//     }
//   })
//
//   // Listen for this output client to disconnect
//   ministers.on('disconnect', function() {
//     console.log("A minister client has disconnected " + socket.id);
//   });
// });
//
// // Clients in the minister namespace
// let congregants = io.of('/congregant');
// Listen for clients to connect
io.sockets.on('connection', function(socket) {
  console.log('A congregant client connected: ' + socket.id);

  // Join a room
  joinRoom(socket);

  // Listen for data messages
  socket.on('text', function(data) {
    // Data comes in as whatever was sent, including objects
    //console.log("Received: 'message' " + data);

    // Which private room does this client belong to?
    let room = socket.room;

    // Share data to all members of room
    socket.to(room).emit('text', data);

    // Save socket message to text file with socketId
    let entry = socket.id + ': ' + data;

    // Write to a new file named with room
    // fs.writeFile(room + '.txt', entry, (err) => {
    //   // throws an error, you could also catch it here
    //   if (err) throw err;
    //
    //   // success case, the file was saved
    //   console.log(room + ': ' + entry);
    // });
  });


  // Listen for this client to disconnect
  // Tell partners this client disconnected
  socket.on('disconnect', function() {
    console.log("A congregant client has disconnected " + socket.id);

    // Which room was this client in?
    let room = socket.room;
    // Tell others in room client has left
    if (rooms[room]) {
      socket.to(room).emit('leave room');
    }
  });
});




// Join room
function joinRoom(socket) {
  console.log(rooms);
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

  //console.log(io);
  //socket.join('yo');


  //rooms[0].isPrivate = true;
  //socket.room = 0;
//console.log(rooms);
  // If there are no incomplete rooms, create new room and join it
  // addSocketToRoom(socket, roomNum);
  // roomNum++;
}

// Add client to room and record which room it was added to
function addSocketToRoom(socket, r) {
  socket.join(r);
  console.log('rooms: ' + rooms);
  rooms[r].isPrivate = true;
  socket.room = r;
}
