// Open and connect input socket
let socket = io('/minister');
// Keep track of congregants
let lines = [];

// Listen for confirmation of connection
socket.on('connect', function() {
  console.log("Connected");
});

// Input field
let input;


function setup() {
  noCanvas();

  // Create an html element for this socket
  createP('#' + socket.id);

  // Listen for changes to input field
  input = select('#input');
  input.input(inputChanged);

  // Listen for texts from partners
  socket.on('text', function(message) {
    let id = message.id;
    let data = message.data;
    // Store data
    if(id in congregants) select('#' + id).html(data);
    else createP('#' + id).html(data);
  });

}

// Send user input as they type it.
function inputChanged() {
  socket.emit('prompt', this.value());
  select('#' + socket.id).html(data);
}
// Listen for line breaks to clear input field
function keyPressed() {
  if (keyCode == ENTER || keyCode == RETURN) {
    socket.emit('complete', input.value());
    input.value('');
  }
}
