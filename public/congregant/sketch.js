// Open and connect input socket
let socket = io('/congregant');

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

  // Listen for texts from partners
  socket.on('text', function (data) {
    console.log(data);
    display('you', data);
  });

  // Listen for prompts
  socket.on('prompt', function(data){
    display('minister', data);
  })

  // Remove disconnected users
  // Display "User left" message
  socket.on('leave room', function (id) {
    display('(they left...)');
  });
}

// Display text
function display(who, txt) {
  select('.' + who).remove();
  let p = createP();
  p.addClass('fade').addClass(who);
  p.html(txt);
}

// Send user input as they type it.
function inputChanged() {
  let data = this.value();
  socket.emit('text', data);
  display('me', data)
}

// Listen for line breaks to clear input field
function keyPressed() {
  if(keyCode == ENTER) {
    socket.emit('complete', input.value());
    input.value('');
  }
}
