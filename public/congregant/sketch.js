// Open and connect input socket
let socket = io('/congregant');
// Keep track of which line
let users = {};

// Listen for confirmation of connection
socket.on('connect', function () {
  console.log("Connected");
  users[socket.id] = 0;
});

// Input field
let input;


function setup() {
  noCanvas();

  // Listen for changes to input field
  input = select('#input');
  input.input(inputChanged);

  // Listen for texts from partners
  socket.on('text', function(message) {
    let id = message.id;
    let data = message.data;
    // Store data
    if(!(id in users)) users[id] = 0;
    // If the element is already there, update the text
   let p;
    try {
      p = select('#' + createId(id)).html(data);
      p.removeClass('fade');
      setTimeout(()=>p.addClass('fade'), 100);
    }
    // Otherwise create a new one
    catch {
      p = createP(data).id(createId(id));
      p.addClass('fade');
    }
  });

  // Listen for completion and prepare a new line
  socket.on('complete', (id)=>{
    if(id in users) users[id]++;
  });

  // Remove disconnected users
  // Display "User left" message
  socket.on('leave room', function (id) {
    createP('(they left...)').addClass('fade');
  });
}

// Create element id name
function createId(id) {
  return id + '-' + users[id];
}

// Send user input as they type it.
function inputChanged() {
  let data = this.value();
  socket.emit('text', data);
}

// Listen for line breaks to clear input field
function keyPressed() {
  if(keyCode == ENTER) {
    socket.emit('complete', input.value());
    input.value('');
  }
}
