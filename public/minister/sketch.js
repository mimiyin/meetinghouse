// Open and connect input socket
let socket = io();
// Keep track of which line
let users = {};

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
  users[socket.id] = 0;
});

// Input field
let input;

// Container for transcript
let transcript;


function setup() {
  noCanvas();

  // Listen for changes to input field
  input = select('#input');
  input.input(inputChanged);

  // Container for transcript
  transcript = select('#transcript');

  // Listen for texts from partners
  socket.on('text', function(message) {
    let id = message.id;
    let data = message.data;
    // Store data
    if(!(id in users)) users[id] = 0;
    // If the element is already there, update the text
    try {
      select('#' + createId(id)).html(data);
    }
    // Otherwise create a new one
    catch {
      transcript.child(createP(data).id(createId(id)));
    }
  });

  // Listen for completion and prepare a new line
  socket.on('complete', (id)=>{
    if(id in users) users[id]++;
  });
}

// Create element id name
function createId(id) {
  return id + '-' + users[id];
}

// Send user input as they type it.
function inputChanged() {
  socket.emit('text', this.value());
}
// Listen for line breaks to clear input field
function keyPressed() {
  if (keyCode == ENTER || keyCode == RETURN) {
    socket.emit('complete', input.value());
    input.value('');
  }
}
