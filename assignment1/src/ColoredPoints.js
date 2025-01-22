// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform float u_Size;
    void main() {
        gl_Position = a_Position;
        //gl_PointSize = 20;
        gl_PointSize = u_Size;
    }`

// Fragment shader program
const FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
    }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;


function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
}

function connectVariablesToGLSL(){
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
      console.log('Failed to get the storage location of u_FragColor');
      return;
    }

    // // Get the storage location of u_size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
      console.log('Failed to get the storage location of u_Size');
      return;
    }
}


// Globals related to HTML UI
let g_selectedColor=[1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10;
let g_selectedCirRes = 10;

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const RECTANGLE = 3;
let g_selectedShape = POINT;


let [x, y] = [-0.2, 0]; // Starting position
let step = 0.10; // Distance between segments

// Predefined path for the snake (directions: "RIGHT", "UP", "LEFT", "DOWN")
const snakeDirections = [
    "RIGHT", "RIGHT", "RIGHT", "RIGHT", "RIGHT", 
    "RIGHT", "RIGHT", "RIGHT", "DOWN", "DOWN",
    "DOWN", "DOWN", "DOWN", "DOWN", "DOWN",
    "LEFT", "LEFT", "UP", "UP", "UP", 
    "UP", "UP", "LEFT", "LEFT", "LEFT",
    "DOWN", "DOWN", "DOWN", "DOWN", "LEFT",
    "LEFT", "LEFT", "LEFT", "LEFT", "LEFT",
    "UP", "UP", "LEFT", "LEFT", "LEFT",
    "UP", "UP", "UP", "UP", "UP",
    "UP", "UP", "UP", "UP", "UP",
    "RIGHT", "RIGHT", "RIGHT", "RIGHT", "RIGHT", 
    "RIGHT", "RIGHT", "RIGHT", "RIGHT", "RIGHT", 
]; 

// Define movement offsets for each direction
const directions = {
    UP: [0, step],
    DOWN: [0, -step],
    LEFT: [-step, 0],
    RIGHT: [step, 0]
};

function draw_snake() {

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw the snake
    for (let direction of snakeDirections) {
        let point = new Rectangle();
        point.position = [x, y];
        point.color = [0.0, 1.0, 0.0, 1.0]; // Green color for the snake
        point.size = 20.0;
        g_shapesList.push(point);

        // Move to the next position based on the current direction
        x += directions[direction][0];
        y += directions[direction][1];
    }

    let point = new Circle();

    point.position = [0.7, 0.65];
    point.color = [1.0, 1.0, 0.0, 1.0];
    point.size = 10;
    g_shapesList.push(point)

    let eye = new Circle();

    eye.position = [0.15, 0.67];
    eye.color = [0.0, 0.0, 0.0, 1.0];
    eye.size = 5;
    g_shapesList.push(eye)

    renderAllShapes();
}


function addActionsForHtmlUI() {
    
    // Button events
    document.getElementById('painting').onclick = function() { draw_snake(); };

    document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
    document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };

    document.getElementById('pointButton').onclick = function() { g_selectedShape=POINT };
    document.getElementById('triangleButton').onclick = function() { g_selectedShape=TRIANGLE };
    document.getElementById('circleButton').onclick = function() { g_selectedShape=CIRCLE };
    document.getElementById('recButton').onclick = function() { g_selectedShape=RECTANGLE };

    document.getElementById('clearButton').onclick = function() { g_shapesList = []; renderAllShapes(); };

    // Slider events
    document.getElementById('redSlider').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlider').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlider').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });

    document.getElementById('sizeSlider').addEventListener('mouseup', function() { g_selectedSize = this.value; });
    document.getElementById('segmentSlider').addEventListener('mouseup', function() { g_selectedCirRes = this.value; });
}

function main() {

    // Set up canvas and gl variables (canvas and context)
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    // Set up actions for HTML UI elements such as buttons
    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) { if(ev.buttons ==1) { click(ev) } };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}


let g_shapesList = [];

// let g_points = [];  // The array for the position of a mouse press
// let g_colors = [];  // The array to store the color of a point
// let g_sizes = [];

function click(ev) {

    // Extract the event click and return it in WebGL coordinates
    let [x, y] = convertCoordinatesEventToGL(ev);

    let point;
    if (g_selectedShape == POINT) {
        point = new Point();
    } else if (g_selectedShape == TRIANGLE) {
        point = new Triangle();
    } else if (g_selectedShape == RECTANGLE) {
        point = new Rectangle();
    } else {
        point = new Circle();
        point.segments = g_selectedCirRes;
    }
    point.position = [x, y];
    if (g_selectedShape!=RECTANGLE) {
        point.color = g_selectedColor.slice();
        point.size = g_selectedSize;
        g_shapesList.push(point)
    } else {
        point.size = g_selectedSize;
        g_shapesList.push(point)
    }
    

    // Store the coordinates to g_points array
    // g_points.push([x, y]); // where did we click?

    // g_colors.push(g_selectedColor.slice());

    // g_sizes.push(g_selectedSize);

    // Store the coordinates to g_points array
    //  i.e. what color to display depending on click location
//    if (x >= 0.0 && y >= 0.0) {      // First quadrant
//        g_colors.push([1.0, 0.0, 0.0, 1.0]);  // Red
//    } else if (x < 0.0 && y < 0.0) { // Third quadrant
//        g_colors.push([0.0, 1.0, 0.0, 1.0]);  // Green
//    } else {                         // Others
//        g_colors.push([1.0, 1.0, 1.0, 1.0]);  // White
//    }

    // Draw every shape that is supposed to be on the canvas
    renderAllShapes();
}

// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev){

    // Converting coordinate systems
    let x = ev.clientX; // x coordinate of a mouse pointer
    let y = ev.clientY; // y coordinate of a mouse pointer
    let rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x,y]);
}

// Draw every shape that is supposed to be on the canvas
function renderAllShapes(){
    
    // Check the initial time at function call
    let startTime = performance.now();

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    let len = g_shapesList.length;

    for (let i = 0; i < len; i++) {
        g_shapesList[i].render();
    }

    // Check the time passed at completion, then print
    let duration = performance.now() - startTime;
    sendTextToHTML("entity counter: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "counter");
}

function sendTextToHTML(text, htmlID) {
    let htmlElement = document.getElementById(htmlID);
    if (!htmlElement) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}
