// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `

    varying vec2 v_UV;
    attribute vec2 a_UV;

    uniform mat4 u_NormalMatrix;
    attribute vec3 a_Normal;
    varying vec3 v_Normal;
    varying vec4 v_VertPos;

    attribute vec4 a_Position;
    uniform mat4 u_ProjectionMatrix;    // Defines the field of view, aspect ratio, and near and far clipping planes
    uniform mat4 u_ModelMatrix;         // Transforms vertices from model space (local space of an object) into world space
    uniform mat4 u_GlobalRotateMatrix;  // Affects the entire scene or a group of objects collectively, such as a pivot that applies globally.
    uniform mat4 u_ViewMatrix;          // Transforms world space coordinates into view space (camera space).
                                        // This matrix is like the camera lens in WebGL; represents the position and orientation of the camera
                                        // looking at the scene.
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;    // Pass the attribute to the varying variable, which is how we pass it to the fragment shader
        v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));

        v_VertPos = u_ModelMatrix * a_Position;
    }`

// Fragment shader program
const FSHADER_SOURCE = `

    precision mediump float;        // designates the precision used
    uniform vec4 u_FragColor;       
    varying vec2 v_UV;              // to access the UV coordinates passed from vshader
    varying vec3 v_Normal;

    varying vec4 v_VertPos;

    uniform vec3 u_lightPos;
    uniform vec3 u_cameraPos;
    uniform bool u_lightOn;

    // Spotlight uniforms
    uniform bool u_spotlightOn;
    uniform vec3 u_lightDir;  // Spotlight direction
    uniform float u_spotCutoff;
    uniform vec3 u_spotlightPos; // Spotlight position
    uniform vec3 u_spotlightColor;

    uniform int u_whichTexture;

    uniform sampler2D u_Sampler0;


    void main() {

        if (u_whichTexture == -3) {
            gl_FragColor = vec4((v_Normal + 1.0)/2.0, 1.0);     // use Normals

        } else if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;             // use class-default color 

        } else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);    // use UV debug color (neon)

        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);     // use texture0

        } else {
            gl_FragColor = vec4(1, .2, .2, 1);      // error, just put red
        }

        
        // === ORIGINAL POINT LIGHT CALCULATIONS ===
        vec3 lightVector = normalize(u_lightPos - vec3(v_VertPos));
        float r = length(u_lightPos - vec3(v_VertPos));

        vec3 L = normalize(lightVector);
        vec3 N = normalize(v_Normal);
        float nDotL = max(dot(N, L), 0.0);

        // Reflection
        vec3 R = reflect(-L, N);
        vec3 E = normalize(u_cameraPos - vec3(v_VertPos));

        // Specular
        float specular = pow(max(dot(E, R), 0.0), 64.0) * 0.8;

        // Distance Attenuation for Point Light
        float attenuation = 1.0 / (1.0 + 0.1 * r + 0.02 * r * r); 

        // Point Light Contributions
        vec3 pointDiffuse = vec3(1.0, 1.0, 0.9) * vec3(gl_FragColor) * nDotL * 1.0 * attenuation;
        vec3 ambient = vec3(gl_FragColor) * 0.3;


        // === SPOTLIGHT CALCULATIONS ===
        vec3 spotLightVector = normalize(u_spotlightPos - vec3(v_VertPos));
        float spotDistance = length(u_spotlightPos - vec3(v_VertPos));

        vec3 spotL = normalize(spotLightVector);
        float spotTheta = dot(-spotL, normalize(u_lightDir)); // Angle between spotlight direction and fragment

        // Spotlight effect (soft edge)
        float spotEffect = smoothstep(u_spotCutoff - 0.05, u_spotCutoff, spotTheta);

        // Distance Attenuation for Spotlight
        float spotAttenuation = 1.0 / (1.0 + 0.1 * spotDistance + 0.02 * spotDistance * spotDistance);

        // Spotlight diffuse
        float spotNDotL = max(dot(N, spotL), 0.0);
        vec3 spotDiffuse = u_spotlightColor * vec3(gl_FragColor) * spotNDotL * 0.8 * spotAttenuation * spotEffect;

        // === FINAL LIGHTING OUTPUT ===
        if (u_lightOn && u_spotlightOn) {
            vec3 finalColor = ambient + pointDiffuse + spotDiffuse;
            if (u_whichTexture == 0) {
                gl_FragColor = vec4(finalColor + specular, 1.0);
            } else {
                gl_FragColor = vec4(finalColor, 1.0);
            }
        } else if (u_lightOn) {
            vec3 finalColor = ambient + pointDiffuse;
            if (u_whichTexture == 0) {
                gl_FragColor = vec4(finalColor + specular, 1.0);
            } else {
                gl_FragColor = vec4(finalColor, 1.0);
            }
        } else if (u_spotlightOn) {
            vec3 finalColor = ambient + spotDiffuse;
            if (u_whichTexture == 0) {
                gl_FragColor = vec4(finalColor + specular, 1.0);
            } else {
                gl_FragColor = vec4(finalColor, 1.0);
            }
        }
    }`

// Global Variables
let canvas;
let gl;

let a_UV;
let a_Normal;
let a_Position;
let u_FragColor;

let u_lightOn;
let u_lightPos;
let u_cameraPos;

let u_lightDir;
let u_spotlightOn;
let u_spotCutoff;
let u_spotlightPos;
let u_spotlightColor;
let g_spotlightColor = [1.0, 1.0, 1.0];

let u_NormalMatrix;

let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ProjectionMatrix
let u_ViewMatrix;

let u_Sampler0;
let u_whichTexture = -1;


let g_normalOn = false;
let g_lightPos = [0, 1, 1.5];
let g_lightOn = true;
let g_spotlightPos = [-1, 1, -2];
let g_spotlightOn = true;

let g_globalAngle = 0;
let g_camera = new Camera();

let g_baseAngle = 0;
let g_midAngle = 0;
let g_tipAngle = 0;
let g_animation = false;
let g_upper_whale_color = [.0745, .1372549, .415686, 1.0];
let g_lower_whale_color = [.8, .8, .8, 1.0];

let g_startTime = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0 - g_startTime;


function setupWebGL(){
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl");
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

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }

    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
      console.log('Failed to get the storage location of a_UV');
      return;
    }

    // Get the storage location of a_Normal
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
      console.log('Failed to get the storage location of a_Normal');
      return;
    }

    u_lightDir = gl.getUniformLocation(gl.program, 'u_lightDir');
    if (!u_lightDir) {
        console.log('Failed to get the storage location of u_lightDir');
        return;
    }

    u_spotCutoff = gl.getUniformLocation(gl.program, 'u_spotCutoff');
    if (!u_spotCutoff) {
        console.log('Failed to get the storage location of u_spotCutoff');
        return;
    }
    // Get the storage location of u_spotlightOn
    u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
    if (!u_spotlightOn) {
      console.log('Failed to get the storage location of u_spotlightOn');
      return;
    }



    u_spotlightPos = gl.getUniformLocation(gl.program, 'u_spotlightPos');
    
    u_lightDir = gl.getUniformLocation(gl.program, 'u_lightDir');

    u_spotCutoff = gl.getUniformLocation(gl.program, 'u_spotCutoff');

    u_spotlightColor = gl.getUniformLocation(gl.program, 'u_spotlightColor');


    gl.uniform3fv(u_lightDir, new Float32Array([0.0, -1.0, -0.5])); // Example: downward-pointing light
    gl.uniform1f(u_spotCutoff, Math.cos(Math.PI / 6)); // 30-degree cutoff
    

    // Get the storage location of u_whichTexture
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
      console.log('Failed to get the storage location of u_whichTexture');
      return;
    }

    // Get the storage location of u_Sampler
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
      console.log('Failed to get the storage location of u_Sampler0');
      return;
    }
//    // Get the storage location of u_Sampler
//    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
//    if (!u_Sampler1) {
//      console.log('Failed to get the storage location of u_Sampler1');
//      return;
//    }
//    // Get the storage location of u_Sampler
//    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
//    if (!u_Sampler2) {
//      console.log('Failed to get the storage location of u_Sampler2');
//      return;
//    }
//    // Get the storage location of u_Sampler
//    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
//    if (!u_Sampler3) {
//      console.log('Failed to get the storage location of u_Sampler3');
//      return;
//    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
      console.log('Failed to get the storage location of u_FragColor');
      return;
    }


    // Get the storage location of u_lightOn
    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
      console.log('Failed to get the storage location of u_lightOn');
      return;
    }

    // Get the storage location of u_lightPos
    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
      console.log('Failed to get the storage location of u_lightPos');
      return;
    }

    // Get the storage location of u_cameraPos
    u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
    if (!u_cameraPos) {
      console.log('Failed to get the storage location of u_cameraPos');
      return;
    }

    // Get the storage location of u_NormalMatrix
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if(!u_NormalMatrix) {
        console.log('Failed to get the storage location of u_NormalMatrix');
        return;
    }

//    // Get the storage location of u_LightColor
//    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
//    if (!u_LightColor) {
//      console.log('Failed to get the storage location of u_LightColor');
//      return;
//    }
//    gl.uniform3f(u_LightColor, 1.0, 1.0, 0.9); // Warm sunlight




//    // Get the storage location of u_ViewDir
//    u_ViewDir = gl.getUniformLocation(gl.program, 'u_ViewDir');
//    if (!u_ViewDir) {
//      console.log('Failed to get the storage location of u_ViewDir');
//      return;
//    }
//    gl.uniform3f(u_ViewDir, 0.0, 0.0, 1.0); // View direction (camera facing -Z)


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

    // Set the initial values of the transformation matrices to the identity matrix
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_NormalMatrix, false, identityM.elements);
}

function main() {

    // Set up canvas and gl variables (canvas and context)
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    addActionsForHtmlUI();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    addMouseControls();
    document.onkeydown = keydown;


    // Specify the color for clearing <canvas>
    gl.clearColor(.5, .5, .5, 1);

    initTextures([
        { src: 'textures/crying_obsidian.jpg', normal: false, grayscale: false }
    ]);


    requestAnimationFrame(tick);
}

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

let g_lightManualControl = false;

function updateAnimationAngles() {
    if (g_animation) {
        g_baseAngle = (10*Math.sin(g_seconds));
        g_midAngle = (10*Math.sin(g_seconds));
        g_tipAngle = (10*Math.sin(g_seconds));
    }

    if (!g_lightManualControl) { // Only move the light if the user is NOT dragging the slider
        g_lightPos[0] = 2.0 * Math.cos(g_seconds);
    }
}

function keydown(ev) {
    if ( ev.keyCode==40 || ev.keyCode==83 ) {    // back arrow
        g_camera.back();

    } else if ( ev.keyCode==39 || ev.keyCode==68 ) {    // right arrow
        g_camera.right();

    } else if ( ev.keyCode==38 || ev.keyCode==87 ) {    // up arrow
        g_camera.forward();

    } else if ( ev.keyCode==37 || ev.keyCode==65 ) {    // left arrow
        g_camera.left();

    } else if ( ev.keyCode==81 ) {    // q for rotating left
        g_camera.rotateLeft();
        
    } else if ( ev.keyCode==69 ) {    // e for rotating right
        g_camera.rotateRight();   
    }

    renderAllShapes();
    console.log(ev.keyCode);
}

// Draw every shape that is supposed to be on the canvas
function renderAllShapes(){
    
    // Check the initial time at function call
    let startTime = performance.now();

    // Pass the projection matrix
    let projMat = new Matrix4();
    projMat.setPerspective(80, canvas.width/canvas.height, .1, 100);    // (fov, aspect ratio, near plane, far plane)
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    // Pass the view matrix
    let viewMat = new Matrix4();
    viewMat.setLookAt(
        g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
        g_camera.at.x, g_camera.at.y, g_camera.at.z,
        g_camera.up.x, g_camera.up.y, g_camera.up.z
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // Pass the global rotation matrix
    let globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);


    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // passing the light position to GLSL
    gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    // passing the camera position to GLSL
    gl.uniform3f(u_cameraPos, g_camera.eye.x, g_camera.eye.y, g_camera.eye.z);
    // pass the light status
    gl.uniform1i(u_lightOn, g_lightOn);
    gl.uniform1i(u_spotlightOn, g_spotlightOn);

    gl.uniform3f(u_spotlightPos, g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2] );
    gl.uniform3fv(u_lightDir, new Float32Array([0.0, -1.0, -0.5])); // Spotlight pointing downward
    gl.uniform1f(u_spotCutoff, Math.cos(Math.PI / 6)); // 30-degree cutoff
    gl.uniform3fv(u_spotlightColor, g_spotlightColor);

    

    let light = new Cube();
    light.color = [2, 2, 0, 1];
    light.textureNum = -2;
    light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
    light.matrix.scale(-.1, -.1, -.1);
    light.matrix.translate(-.5, -.5, -.5);
    //light.normalMatrix.setInverseOf(light.matrix).transpose();
    light.render();

    let sky = new Cube();
    sky.color = [0.8, 0.8, 0.8, 1];
    if (g_normalOn) {sky.textureNum = -3;}
    else {sky.textureNum = -2}  // neon
    sky.matrix.scale(-5, -5, -5);
    sky.matrix.translate(-.5, -.5, -.5);
    //sky.normalMatrix.setInverseOf(sky.matrix).transpose();
    sky.render();

    let floor = new Cube();
    floor.color = [1, 0, 0, 1];
    floor.textureNum = -1;  // neon
    floor.matrix.translate(0, -2.49, 0);
    floor.matrix.scale(10, 0.1, 10);
    floor.matrix.translate(-.5, 0, -.5);
    //floor.normalMatrix.setInverseOf(floor.matrix).transpose();
    floor.render();

    let sphere = new Sphere(30, 30);  // More divisions = smoother sphere
    if (g_normalOn) sphere.textureNum = -3;
    else {sphere.textureNum = 0};   // minecraft texture
    sphere.color = [-7.0, 0, 1.0, 1.0];
    sphere.matrix.translate(-1, -1.5, -1.5);
    sphere.matrix.scale(.6, .6, .6);
    //sphere.normalMatrix.setInverseOf(sphere.matrix).transpose();
    sphere.render();

    let cubeRef = new Cube();
    cubeRef.color = [1, 1, 1, 1];
    cubeRef.textureNum = 0; 
    if (g_normalOn) {cubeRef.textureNum = -3;}
    cubeRef.matrix.translate(0, 0, -1,5);
    cubeRef.matrix.rotate(45, 1, 1, 1);
    cubeRef.matrix.scale(.75, .75, .75);
    cubeRef.normalMatrix.setInverseOf(cubeRef.matrix).transpose();
    cubeRef.render();


    createAnimal();

    // Check the time passed at completion, then print
    let duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "counter");

}

// borrowed from book
// Modified to load multiple textures
function initTextures(textureSources) {
    let loadedCount = 0;

    textureSources.forEach((texture, i) => {
        const image = new Image();
        image.onload = () => {
            sendTextureToGLSL(image, i, texture.normal, texture.grayscale);
            loadedCount++;
            if (loadedCount === textureSources.length) {
                console.log('All textures loaded successfully');
            }
        };
        image.onerror = () => console.log(`Failed to load image: ${texture.src}`);
        image.src = texture.src;
    });
}

// Modified to handle multiple texture units
function sendTextureToGLSL(image, textureUnit, isNormalMap = false, isGrayscale = false) {
    const texture = gl.createTexture();
    if (!texture) {
        console.error('Failed to create the texture object');
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    
    // Activate the correct texture unit
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Adjust texture format based on type
    let internalFormat = gl.RGB;
    let format = gl.RGB;
    let type = gl.UNSIGNED_BYTE;

    if (isGrayscale) {
        internalFormat = gl.LUMINANCE;
        format = gl.LUMINANCE;
    } else if (isNormalMap) {
        internalFormat = gl.RGB; // Normal maps use RGB
        format = gl.RGB;
    }

    // Upload the texture (correct call for HTMLImageElement)
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, image);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.generateMipmap(gl.TEXTURE_2D);

    // Pass the texture unit to the corresponding sampler
    const samplerLocation = gl.getUniformLocation(gl.program, `u_Sampler${textureUnit}`);
    gl.uniform1i(samplerLocation, textureUnit);

    console.log(`Texture ${textureUnit} loaded (normalMap: ${isNormalMap}, grayscale: ${isGrayscale})`);
    return texture;
}

function addMouseControls() {

    // DOESN'T REALLY BELONG HERE
    //canvas.addEventListener('click', function(event) {
    //    const rect = canvas.getBoundingClientRect();
    //    const x = event.clientX - rect.left;
    //    const y = event.clientY - rect.top;
    //    if (checkCubeClicked(x, y)) {
    //        removeBlock(cubeIndex);
    //    }
    //});
    

    let isDragging = false;
    let lastX, lastY;

    // Start dragging on mouse down
    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        lastX = event.clientX;
    });

    // Track mouse movement while dragging
    canvas.addEventListener('mousemove', (event) => {
        if (isDragging) {
            let deltaX = event.clientX - lastX;
            lastX = event.clientX;

            // Rotate the camera horizontally around its up vector
            let horizontalRotation = new Matrix4().setRotate(deltaX * 0.5, g_camera.up.x, g_camera.up.y, g_camera.up.z);
            let direction = Vector3.subtract(g_camera.at, g_camera.eye);
            let rotatedDirection = horizontalRotation.multiplyVector3(direction);
            g_camera.at = Vector3.add(g_camera.eye, rotatedDirection);

            renderAllShapes();
        }
    });

    // Stop dragging on mouse up or when leaving the canvas
    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });
}


function sendTextToHTML(text, htmlID) {
    let htmlElement = document.getElementById(htmlID);
    if (!htmlElement) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}

// Resize canvas to full window size with device pixel ratio
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function addActionsForHtmlUI() {
    document.getElementById('animateON').onclick = function() { g_animation = true; };
    document.getElementById('animateOFF').onclick = function() { g_animation = false; };
    document.getElementById('normalOn').onclick = function() {g_normalOn=true;}
    document.getElementById('normalOff').onclick = function() {g_normalOn=false;}
    document.getElementById('lightOn').onclick = function() {g_lightOn=true;}
    document.getElementById('lightOff').onclick = function() {g_lightOn=false;}

    document.getElementById('spotlightOn').onclick = function() {g_spotlightOn=true;}
    document.getElementById('spotlightOff').onclick = function() {g_spotlightOn=false;}

    document.getElementById('xSlider').addEventListener('mousemove', function(ev) {
        if (ev.buttons == 1) { // Check if mouse button is held
            g_lightPos[0] = this.value / 100;
            g_lightManualControl = true; // User is manually controlling the light
            renderAllShapes();
    
            // Reset the flag after 3 seconds (so animation resumes)
            clearTimeout(window.lightTimeout);
            window.lightTimeout = setTimeout(() => {
                g_lightManualControl = false;
            }, 3000);
        }
    });
    document.getElementById('ySlider').addEventListener('mousemove', function(ev) {if(ev.buttons==1) {g_lightPos[1] = this.value / 100; renderAllShapes();}});
    document.getElementById('zSlider').addEventListener('mousemove', function(ev) {if(ev.buttons==1) {g_lightPos[2] = this.value / 100; renderAllShapes();}});
    document.getElementById('angleSlider').addEventListener('input', function() { g_globalAngle = parseFloat(this.value); renderAllShapes(); });
    document.getElementById('spotlightColor').addEventListener('input', function() {
        // Convert Hex color to RGB (normalized to [0,1])
        let hex = this.value; // e.g., "#e66465"
        let rgb = hexToRGB(hex); // Convert to {r, g, b} values in [0,1]
    
        // Update WebGL spotlight color uniform
        g_spotlightColor[0] = rgb.r;
        g_spotlightColor[1] = rgb.g;
        g_spotlightColor[2] = rgb.b;
    
        // Re-render the scene with new color
        renderAllShapes();
    });
}
// Function to convert hex (#RRGGBB) to normalized RGB {r, g, b}
function hexToRGB(hex) {
    // Remove '#' if it exists
    hex = hex.replace(/^#/, '');

    // Convert hex values to RGB
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    // Normalize RGB values to range [0,1]
    return { r: r / 255, g: g / 255, b: b / 255 };
}

function createAnimal(){
    // CENTER MASS
    let upperMass = new Cube();
    upperMass.color = g_upper_whale_color;
    if (g_normalOn) {upperMass.textureNum = -3;}
    upperMass.matrix.translate(.75, -1, -.1);
    upperMass.matrix.scale(.7, .6, -.9);
    //upperMass.matrix.rotate(90, 1, 0, 0)
    upperMass.normalMatrix.setInverseOf(upperMass.matrix).transpose();
    upperMass.render()

    let lowerMassMat = new Matrix4(upperMass.matrix);
    let lowerMass = new Cube();
    lowerMass.color = g_lower_whale_color;
    if (g_normalOn) {lowerMass.textureNum = -3;}
    lowerMass.matrix = lowerMassMat;
    lowerMass.matrix.translate(.0001, -.3, .0001);
    lowerMass.matrix.scale(.999, .999, .999);
    lowerMass.normalMatrix.setInverseOf(lowerMass.matrix).transpose();
    lowerMass.render()

    // TOP
    let headMat = new Matrix4(upperMass.matrix);
    let head = new Cube();
    head.color = g_upper_whale_color;
    if (g_normalOn) {head.textureNum = -3;}
    head.matrix = headMat;
    head.matrix.translate(.1, .15, .1);
    head.matrix.scale(.825, 1, .825)
    head.normalMatrix.setInverseOf(head.matrix).transpose();
    head.render();

    // FACE
    let upperFaceMat = new Matrix4(upperMass.matrix);

    let upperFace = new Cube();
    upperFace.color = g_upper_whale_color;
    if (g_normalOn) {upperFace.textureNum = -3;}
    upperFace.matrix = upperFaceMat;
    upperFace.matrix.translate(.075, 0, -.12);
    upperFace.matrix.scale(.85, .88, .97);
    upperFace.normalMatrix.setInverseOf(upperFace.matrix).transpose();
    upperFace.render()

    let upperFace2 = new Cube();
    upperFace2.color = g_upper_whale_color;
    if (g_normalOn) {upperFace2.textureNum = -3;}
    upperFace2.matrix = upperFaceMat;
    upperFace2.matrix.translate(.1, 0, -.05);
    upperFace2.matrix.scale(.75, .8, .97);
    upperFace2.normalMatrix.setInverseOf(upperFace2.matrix).transpose();
    upperFace2.render()


    let lowerFaceMat = new Matrix4(lowerMass.matrix);

    let lowerFace = new Cube();
    lowerFace.color = g_lower_whale_color;
    if (g_normalOn) {lowerFace.textureNum = -3;}
    lowerFace.matrix = lowerFaceMat;
    lowerFace.matrix.translate(.0751, .075, -.1);
    lowerFace.matrix.scale(.85, .88, .97);
    lowerFace.normalMatrix.setInverseOf(lowerFace.matrix).transpose();
    lowerFace.render()

    let lowerFace2 = new Cube();
    lowerFace2.color = g_lower_whale_color;
    if (g_normalOn) {lowerFace2.textureNum = -3;}
    lowerFace2.matrix = lowerFaceMat;
    lowerFace2.matrix.translate(.1001, .075, -.07);
    lowerFace2.matrix.scale(.75, .88, 1);
    lowerFace2.normalMatrix.setInverseOf(lowerFace2.matrix).transpose();
    lowerFace2.render();


    // SIDES
    let rightSideMat = new Matrix4(upperMass.matrix);
    let rightSide = new Cube();
    rightSide.color = g_upper_whale_color;
    if (g_normalOn) {rightSide.textureNum = -3;}
    rightSide.matrix = rightSideMat;
    rightSide.matrix.translate(.225, 0, .13);
    rightSide.matrix.scale(.85, .88, .87);
    rightSide.normalMatrix.setInverseOf(rightSide.matrix).transpose();
    rightSide.render();


    let leftSideMat = new Matrix4(rightSide.matrix);
    let leftSide = new Cube();
    leftSide.color = g_upper_whale_color;
    if (g_normalOn) {leftSide.textureNum = -3;}
    leftSide.matrix = leftSideMat;
    leftSide.matrix.translate(-.37, 0, 0);
    leftSide.normalMatrix.setInverseOf(leftSide.matrix).transpose();
    leftSide.render();


    // EYES
    let rightEyeMat = new Matrix4(rightSide.matrix);
    let rightEyeBase = new Cube();
    rightEyeBase.color = g_upper_whale_color;
    if (g_normalOn) {rightEyeBase.textureNum = -3;}
    rightEyeBase.matrix = rightEyeMat;
    rightEyeBase.matrix.translate(0, 0, -.15);
    rightEyeBase.matrix.scale(1, .3, 1);
    rightEyeBase.normalMatrix.setInverseOf(rightEyeBase.matrix).transpose();
    rightEyeBase.render();

    let rightEyeUpperMat = new Matrix4(rightEyeBase.matrix);
    let rightEye = new Cube();
    rightEye.color = g_lower_whale_color;
    if (g_normalOn) {rightEye.textureNum = -3;}
    rightEye.matrix = rightEyeUpperMat;
    rightEye.matrix.translate(0, 1.03, .0001);
    rightEye.matrix.scale(.999, 1, 1);
    rightEye.normalMatrix.setInverseOf(rightEye.matrix).transpose();
    rightEye.render();


    let leftEyeMat = new Matrix4(leftSide.matrix);
    let leftEyeBase = new Cube();
    leftEyeBase.color = g_upper_whale_color;
    if (g_normalOn) {leftEyeBase.textureNum = -3;}
    leftEyeBase.matrix = leftEyeMat;
    leftEyeBase.matrix.translate(0, 0, -.15);
    leftEyeBase.matrix.scale(1, .3, 1);
    leftEyeBase.normalMatrix.setInverseOf(leftEyeBase.matrix).transpose();
    leftEyeBase.render();

    let leftEyeUpperMat = new Matrix4(leftEyeBase.matrix);
    let leftEye = new Cube();
    leftEye.color = g_lower_whale_color;
    if (g_normalOn) {leftEye.textureNum = -3;}
    leftEye.matrix = leftEyeUpperMat;
    leftEye.matrix.translate(.0001, 1.03, .0001);
    leftEye.matrix.scale(1, 1, 1);
    leftEye.normalMatrix.setInverseOf(leftEye.matrix).transpose();
    leftEye.render();

    // BACK
    let backMat = new Matrix4(upperMass.matrix);
    let back = new Cube();
    back.color = g_upper_whale_color;
    if (g_normalOn) {back.textureNum = -3;}
    back.matrix = backMat;
    back.matrix.translate(.08, .01, .35);
    back.matrix.scale(.825, .85, .75);
    back.normalMatrix.setInverseOf(back.matrix).transpose();
    back.render();

    let back2mat = new Matrix4(back.matrix);
    let back2 = new Cube();
    back2.color = g_upper_whale_color;
    if (g_normalOn) {back2.textureNum = -3;}
    back2.matrix = back2mat;
    back2.matrix.translate(.08, .01, .35);
    back2.matrix.scale(.825, .85, .75);
    back2.normalMatrix.setInverseOf(back2.matrix).transpose();
    back2.render();


    // TAIL
    let tailBaseMat = new Matrix4(back2.matrix);
    let tailBase = new Cube();
    tailBase.color = g_upper_whale_color;
    if (g_normalOn) {tailBase.textureNum = -3;}
    tailBase.matrix = tailBaseMat; 
    tailBase.matrix.rotate(-g_baseAngle, 1, 0, 0);
    tailBase.matrix.translate(.15, 0.1, .3);
    tailBase.matrix.scale(.75, .8, 1);
    tailBase.normalMatrix.setInverseOf(tailBase.matrix).transpose();
    tailBase.render();

    let underMat = new Matrix4(tailBase.matrix);
    let backUnderside = new Cube();
    backUnderside.color = g_lower_whale_color;
    if (g_normalOn) {backUnderside.textureNum = -3;}
    backUnderside.matrix = underMat;
    backUnderside.matrix.rotate(-30, 1, 0, 0);
    backUnderside.matrix.translate(.1499, -.65, -.3);
    backUnderside.matrix.scale(.7, .8, 1.4);
    backUnderside.normalMatrix.setInverseOf(backUnderside.matrix).transpose();
    backUnderside.render();

    let tailMidMat = new Matrix4(tailBase.matrix)
    let tailMid = new Cube();
    tailMid.color = g_upper_whale_color;
    if (g_normalOn) {tailMid.textureNum = -3;}
    tailMid.matrix = tailMidMat;
    tailMid.matrix.rotate(-g_midAngle, 1, 0, 0);
    tailMid.matrix.translate(.1, .2, .5);
    tailMid.matrix.scale(.75, .75, 1);
    tailMid.normalMatrix.setInverseOf(tailMid.matrix).transpose();
    tailMid.render();

    let tailEndMat = new Matrix4(tailMid.matrix);
    let tailEnd = new Cube();
    tailEnd.color = g_upper_whale_color;
    if (g_normalOn) {tailEnd.textureNum = -3;}
    tailEnd.matrix = tailEndMat;
    tailEnd.matrix.rotate(-g_tipAngle, 1, 0, 0);
    tailEnd.matrix.translate(.15, .15, .6);
    tailEnd.matrix.scale(.75, .75, .75);
    tailEnd.normalMatrix.setInverseOf(tailEnd.matrix).transpose();
    tailEnd.render();

//    let tailUnderMat = new Matrix4(tailEndMat.matrix);
//    let tailUnder = new Cube();
//    tailUnder.color = g_lower_whale_color;
//    tailUnder.matrix = tailUnderMat;
//    tailUnder.matrix.rotate(-g_tipAngle, 1, 0, 0)
//    tailUnder.matrix.translate(0, -.25, .75);
//    tailUnder.matrix.scale(.2, .2, .2);
//    tailUnder.render();

    let leftTailMat = new Matrix4(tailEnd.matrix);
    let leftTail = new Pyramid();
    leftTail.color = g_upper_whale_color;
    if (g_normalOn) {leftTail.textureNum = -3;}
    leftTail.matrix = leftTailMat;
    leftTail.matrix.translate(-.5, .65, .85);
    leftTail.matrix.scale(.9, .75, .65);
    leftTail.normalMatrix.setInverseOf(leftTail.matrix).transpose();
    leftTail.render();

    let rightTailMat = new Matrix4(tailEnd.matrix);
    let rightTail = new Pyramid();
    rightTail.color = g_upper_whale_color;
    if (g_normalOn) {rightTail.textureNum = -3;}
    rightTail.matrix = rightTailMat;
    rightTail.matrix.translate(1.3, .65, .85);
    rightTail.matrix.scale(-.9, .75, .65);
    rightTail.normalMatrix.setInverseOf(rightTail.matrix).transpose();
    rightTail.render();

    // FINS
//    let fin_mat = new Matrix4(upperMass.matrix);
//    let fin_one = new Pyramid();
//    fin_one.color = g_upper_whale_color;
//    fin_one.matrix = fin_mat;
//    fin_one.matrix.rotate(g_tipAngle, 0, 0, 1)
//    fin_one.matrix.rotate(-45, 0, 1, 0)
//    fin_one.matrix.translate(-.5, -.15, -.3)
//    fin_one.matrix.scale(-.4, .1, .15);
//    fin_one.render();
//
//    let fin_two = new Pyramid();
//    fin_two.color = g_upper_whale_color;
//    fin_two.matrix.rotate(-g_tipAngle*.5, 0, 0, 1)
//    fin_two.matrix.rotate(45, 0, 1, 0)
//    fin_two.matrix.translate(-.22, -.15, -.25)
//    fin_two.matrix.scale(.4, .1, .15);
//    fin_two.render()
}