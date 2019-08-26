// Open and connect input socket
let socket = io('/minister');

// Listen for confirmation of connection
socket.on('connect', function () {
  console.log("Connected");
});

// Input field
let input;


function setup() {
  noCanvas();

  // Listen for changes to input field
  input = select('#input');
  input.input(inputChanged);

}

// Send user input as they type it.
function inputChanged() {
  socket.emit('prompt', this.value());
}
// Listen for line breaks to clear input field
function keyPressed() {
  if(keyCode == ENTER || keyCode == RETURN) {
    socket.emit('complete', input.value());
    input.value('');
  }
}
