// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
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
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ProjectionMatrix
let u_ViewMatrix;

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

    gl.enable(gl.DEPTH_TEST);
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

    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if(!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Get the storage location of u_GlobalRotateMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if(!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if(!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if(!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    // Set the initial values of the matrix to the identity matrix
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}


// Globals related to HTML UI
let g_globalAngle = 0;
let g_fov = 50;
let g_cameraZ = 5;
let g_globalZoom = 0;
let g_baseAngle = 0;
let g_midAngle = 0;
let g_tipAngle = 0;
let g_animation = false;
let g_shiftAnimation = false;


let g_upper_whale_color = [.0745, .1372549, .415686, 1.0];
let g_lower_whale_color = [.8, .8, .8, 1.0];


function addActionsForHtmlUI() {
    // Button events
    document.getElementById('animateON').onclick = function() { g_animation = true; };
    document.getElementById('animateOFF').onclick = function() { g_animation = false; };

    // Slider events
    document.getElementById('angleSlider').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); });
    document.getElementById('fovSlider').addEventListener('mousemove', function() { g_fov = this.value; renderAllShapes(); });
    document.getElementById('zoomSlider').addEventListener('mousemove', function() { 
        g_cameraZ = 10 - this.value * 0.1;  // Map slider values to camera zoom
        renderAllShapes(); 
    });
    document.getElementById('baseSlider').addEventListener('mousemove', function() { g_baseAngle = this.value; renderAllShapes(); });
    document.getElementById('midSlider').addEventListener('mousemove', function() { g_midAngle = this.value; renderAllShapes(); });
    document.getElementById('tipSlider').addEventListener('mousemove', function() { g_tipAngle = this.value; renderAllShapes(); });
}

function main() {

    // Set up canvas and gl variables (canvas and context)
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    // Set up actions for HTML UI elements such as buttons
    addActionsForHtmlUI();

    addMouseControls();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.102353, 0.553137, .9, 1.0);

    requestAnimationFrame(tick);
}


let g_startTime = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
    // save current time
    g_seconds = performance.now()/1000.0 - g_startTime;

    // update angles
    updateAnimationAngles();

    // draw everything
    renderAllShapes();

    // tell the browser to update again when it has time
    requestAnimationFrame(tick);
}


function updateAnimationAngles() {
    if (g_animation) {
        g_baseAngle = (10*Math.sin(g_seconds));
        g_midAngle = (10*Math.sin(g_seconds));
        g_tipAngle = (10*Math.sin(g_seconds));
    }
}

function addMouseControls() {
    let isDragging = false;
    let lastX;

    canvas.addEventListener('mousedown', (event) => {
        if (event.shiftKey) {
            g_shiftAnimation = !g_shiftAnimation; // Toggle animation
            if (g_shiftAnimation && !animationFrameId) {
                animateRotation(); // Start animation
            }
        } else {
            isDragging = true;
            lastX = event.clientX;
        }
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDragging) {
            let deltaX = event.clientX - lastX;
            g_globalAngle += deltaX * 0.5; // Adjust sensitivity
            lastX = event.clientX;
            renderAllShapes();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}

let animationFrameId = null; // Track animation frame

function animateRotation() {
    if (!g_shiftAnimation) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId); // Stop animation if flag is off
            animationFrameId = null;
        }
        return;
    }

    g_globalAngle += 2; // Adjust rotation speed
    renderAllShapes();

    animationFrameId = requestAnimationFrame(animateRotation); // Save animation frame ID
}


// Draw every shape that is supposed to be on the canvas
function renderAllShapes(){
    
    // Check the initial time at function call
    let startTime = performance.now();

    let globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Set up the camera (View Matrix)
    let viewMat = new Matrix4().setLookAt(
        0, 0, g_cameraZ,  // Camera position (x, y, z)
        0, 0, 0,          // Look-at target (always at the center)
        0, 1, 0           // Up direction (Y-axis)
    );
    viewMat.scale(-1, 1, 1); // This inverts the X-axis, fixing the mirror effect
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // Set up perspective projection
    let aspectRatio = canvas.width / canvas.height; // Maintain correct aspect ratio
    let projectionMat = new Matrix4().setPerspective(g_fov, aspectRatio, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    // point of ref ---> nemo
    let ref = new Cube();
    ref.color = [1, .3725, .1216, 1];
    ref.matrix.translate(-.75, -.6, 0);
    ref.matrix.scale(.2, .2, .2);
    ref.render();

    let ring1 = new Cube();
    ring1.color = [0, 0, 0, 1];
    ring1.matrix.translate(-.7502, -.602, .05);
    ring1.matrix.scale(.21, .21, .01);
    ring1.render();

    let ringMat = new Matrix4(ring1.matrix);
    
    let ring2 = new Cube();
    ring2.color = [0, 0, 0, 1];
    ring2.matrix = ringMat;
    ring2.matrix.translate(0, 0, 5);
    ring2.matrix.scale(1, 1, 1);
    ring2.render();

    let ring3 = new Cube();
    ring3.color = [1, 1, 1, 1];
    ring3.matrix = ringMat;
    ring3.matrix.translate(0, 0, -.01);
    ring3.matrix.scale(1, 1, -4);
    ring3.render();

    //let ring4 = new Cube();
    //ring2.color = [1, 1, 1, 1];
    //ring3.matrix = ringMat;
    //ring3.matrix.translate(0, 0, 1);
    //ring3.matrix.scale(1, 1, 5);
    //ring3.render();

    // CENTER MASS
    let upperMass = new Cube();
    upperMass.color = g_upper_whale_color;
    upperMass.matrix.translate(-.25, -.3, -.4);
    upperMass.matrix.scale(.7, .6, .9);
    upperMass.render()

    let lowerMassMat = new Matrix4(upperMass.matrix);
    let lowerMass = new Cube();
    lowerMass.color = g_lower_whale_color;
    lowerMass.matrix = lowerMassMat;
    lowerMass.matrix.translate(.0001, -.3, .0001);
    lowerMass.matrix.scale(.999, .999, .999);
    lowerMass.render()

    // TOP
    let headMat = new Matrix4(upperMass.matrix);
    let head = new Cube();
    head.color = g_upper_whale_color;
    head.matrix = headMat;
    head.matrix.translate(.1, .15, .1);
    head.matrix.scale(.825, 1, .825)
    head.render();

    // FACE
    let upperFaceMat = new Matrix4(upperMass.matrix);

    let upperFace = new Cube();
    upperFace.color = g_upper_whale_color;
    upperFace.matrix = upperFaceMat;
    upperFace.matrix.translate(.075, 0, -.12);
    upperFace.matrix.scale(.85, .88, .97);
    upperFace.render()

    let upperFace2 = new Cube();
    upperFace2.color = g_upper_whale_color;
    upperFace2.matrix = upperFaceMat;
    upperFace2.matrix.translate(.1, 0, -.05);
    upperFace2.matrix.scale(.75, .8, .97);
    upperFace2.render()


    let lowerFaceMat = new Matrix4(lowerMass.matrix);

    let lowerFace = new Cube();
    lowerFace.color = g_lower_whale_color;
    lowerFace.matrix = lowerFaceMat;
    lowerFace.matrix.translate(.0751, .075, -.1);
    lowerFace.matrix.scale(.85, .88, .97);
    lowerFace.render()

    let lowerFace2 = new Cube();
    lowerFace2.color = g_lower_whale_color;
    lowerFace2.matrix = lowerFaceMat;
    lowerFace2.matrix.translate(.1001, .075, -.07);
    lowerFace2.matrix.scale(.75, .88, 1);
    lowerFace2.render();


    // SIDES
    let rightSideMat = new Matrix4(upperMass.matrix);
    let rightSide = new Cube();
    rightSide.color = g_upper_whale_color;
    rightSide.matrix = rightSideMat;
    rightSide.matrix.translate(.225, 0, .13);
    rightSide.matrix.scale(.85, .88, .87);
    rightSide.render();


    let leftSideMat = new Matrix4(rightSide.matrix);
    let leftSide = new Cube();
    leftSide.color = g_upper_whale_color;
    leftSide.matrix = leftSideMat;
    leftSide.matrix.translate(-.37, 0, 0);
    leftSide.render();


    // EYES
    let rightEyeMat = new Matrix4(rightSide.matrix);
    let rightEyeBase = new Cube();
    rightEyeBase.color = g_upper_whale_color;
    rightEyeBase.matrix = rightEyeMat;
    rightEyeBase.matrix.translate(0, 0, -.15);
    rightEyeBase.matrix.scale(1, .3, 1);
    rightEyeBase.render();

    let rightEyeUpperMat = new Matrix4(rightEyeBase.matrix);
    let rightEye = new Cube();
    rightEye.color = g_lower_whale_color;
    rightEye.matrix = rightEyeUpperMat;
    rightEye.matrix.translate(0, 1.03, .0001);
    rightEye.matrix.scale(.999, 1, 1);
    rightEye.render();


    let leftEyeMat = new Matrix4(leftSide.matrix);
    let leftEyeBase = new Cube();
    leftEyeBase.color = g_upper_whale_color;
    leftEyeBase.matrix = leftEyeMat;
    leftEyeBase.matrix.translate(0, 0, -.15);
    leftEyeBase.matrix.scale(1, .3, 1);
    leftEyeBase.render();

    let leftEyeUpperMat = new Matrix4(leftEyeBase.matrix);
    let leftEye = new Cube();
    leftEye.color = g_lower_whale_color;
    leftEye.matrix = leftEyeUpperMat;
    leftEye.matrix.translate(.0001, 1.03, .0001);
    leftEye.matrix.scale(1, 1, 1);
    leftEye.render();

    // BACK
    let backMat = new Matrix4(upperMass.matrix);
    let back = new Cube();
    back.color = g_upper_whale_color;
    back.matrix = backMat;
    back.matrix.translate(.08, .01, .35);
    back.matrix.scale(.825, .85, .75);
    back.render();

    let back2mat = new Matrix4(back.matrix);
    let back2 = new Cube();
    back2.color = g_upper_whale_color;
    back2.matrix = back2mat;
    back2.matrix.translate(.08, .01, .35);
    back2.matrix.scale(.825, .85, .75);
    back2.render();


    // TAIL
    let tailBaseMat = new Matrix4(back2.matrix);
    let tailBase = new Cube();
    tailBase.color = g_upper_whale_color;
    tailBase.matrix = tailBaseMat; 
    tailBase.matrix.rotate(-g_baseAngle, 1, 0, 0);
    tailBase.matrix.translate(.15, 0.1, .3);
    tailBase.matrix.scale(.75, .8, 1);
    tailBase.render();

    let underMat = new Matrix4(tailBase.matrix);
    let backUnderside = new Cube();
    backUnderside.color = g_lower_whale_color;
    backUnderside.matrix = underMat;
    backUnderside.matrix.rotate(-30, 1, 0, 0);
    backUnderside.matrix.translate(.1499, -.65, -.3);
    backUnderside.matrix.scale(.7, .8, 1.4);
    backUnderside.render();

    let tailMidMat = new Matrix4(tailBase.matrix)
    let tailMid = new Cube();
    tailMid.color = g_upper_whale_color;
    tailMid.matrix = tailMidMat;
    tailMid.matrix.rotate(-g_midAngle, 1, 0, 0);
    tailMid.matrix.translate(.1, .2, .5);
    tailMid.matrix.scale(.75, .75, 1);
    tailMid.render();

    let tailEndMat = new Matrix4(tailMid.matrix);
    let tailEnd = new Cube();
    tailEnd.color = g_upper_whale_color;
    tailEnd.matrix = tailEndMat;
    tailEnd.matrix.rotate(-g_tipAngle, 1, 0, 0);
    tailEnd.matrix.translate(.15, .15, .6);
    tailEnd.matrix.scale(.75, .75, .75);
    tailEnd.render();

    let tailUnderMat = new Matrix4(tailEndMat.matrix);
    let tailUnder = new Cube();
    tailUnder.color = g_lower_whale_color;
    tailUnder.matrix = tailUnderMat;
    tailUnder.matrix.rotate(-g_tipAngle, 1, 0, 0)
    tailUnder.matrix.translate(0, -.25, .75);
    tailUnder.matrix.scale(.2, .2, .2);
    tailUnder.render();

    let leftTailMat = new Matrix4(tailEnd.matrix);
    let leftTail = new Pyramid();
    leftTail.color = g_upper_whale_color;
    leftTail.matrix = leftTailMat;
    leftTail.matrix.translate(-.5, .65, .85);
    leftTail.matrix.scale(.9, .75, .65);
    leftTail.render();

    let rightTailMat = new Matrix4(tailEnd.matrix);
    let rightTail = new Pyramid();
    rightTail.color = g_upper_whale_color;
    rightTail.matrix = rightTailMat;
    rightTail.matrix.translate(1.3, .65, .85);
    rightTail.matrix.scale(-.9, .75, .65);
    rightTail.render();

    // FINS
    let fin_one = new Pyramid();
    fin_one.color = g_upper_whale_color;
    fin_one.matrix.rotate(g_tipAngle*.5, 0, 0, 1)
    fin_one.matrix.rotate(-45, 0, 1, 0)
    fin_one.matrix.translate(.5, -.15, -.3)
    fin_one.matrix.scale(-.4, .1, .15);
    fin_one.render();

    let fin_two = new Pyramid();
    fin_two.color = g_upper_whale_color;
    fin_two.matrix.rotate(-g_tipAngle*.5, 0, 0, 1)
    fin_two.matrix.rotate(45, 0, 1, 0)
    fin_two.matrix.translate(-.22, -.15, -.25)
    fin_two.matrix.scale(.4, .1, .15);
    fin_two.render()

    // Check the time passed at completion, then print
    let duration = performance.now() - startTime;
    sendTextToHTML("entity counter: " + "2" + " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "counter");
}

function sendTextToHTML(text, htmlID) {
    let htmlElement = document.getElementById(htmlID);
    if (!htmlElement) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}
