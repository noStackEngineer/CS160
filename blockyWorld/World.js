// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
const VSHADER_SOURCE = `

    varying vec2 v_UV;
    attribute vec2 a_UV;

    attribute vec4 a_Position;
    uniform mat4 u_ProjectionMatrix;    // Defines the field of view, aspect ratio, and near and far clipping planes
    uniform mat4 u_ModelMatrix;         // Transforms vertices from model space (local space of an object) into world space
    uniform mat4 u_GlobalRotateMatrix;  // Affects the entire scene or a group of objects collectively, such as a pivot that applies globally.
    uniform mat4 u_ViewMatrix;          // Transforms world space coordinates into view space (camera space).
                                        // This matrix is like the camera lens in WebGL; represents the position and orientation of the camera
                                        // looking at the scene.
    void main() {
        v_UV = a_UV;    // Pass the attribute to the varying variable, which is how we pass it to the fragment shader

        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    }`

// Fragment shader program
const FSHADER_SOURCE = `

    precision mediump float;        // designates the precision used
    uniform vec4 u_FragColor;       
    varying vec2 v_UV;              // to access the UV coordinates passed from vshader

    uniform int u_whichTexture;

    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform sampler2D u_Sampler4;
    uniform sampler2D u_Sampler5;
    uniform sampler2D u_Sampler6;
    uniform sampler2D u_Sampler7;

    // Simple lighting setup
    uniform vec3 u_LightDir; // Directional light
    uniform vec3 u_LightColor;
    uniform vec3 u_ViewDir;


    void main() {

        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;             // use color

        } else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0);    // use UV debug color

        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);     // use texture0

        } else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);     // use texture1

        } else if (u_whichTexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV);     // use texture2

        } else if (u_whichTexture == 3) {
            // Sample textures
            vec4 baseColor = texture2D(u_Sampler3, v_UV);
            // vec3 ambient = baseColor.rgb * .2; // 40% of the texture color as ambient light

            vec3 normalMap = texture2D(u_Sampler4, v_UV).rgb * 2.0 - 1.0;
            vec3 arm = texture2D(u_Sampler5, v_UV).rgb;

            float ao = arm.r;
            float roughness = arm.g;
            float metallic = arm.b;


            // Lighting calculations
            vec3 N = normalize(normalMap);                     // Normal
            vec3 L = normalize(u_LightDir);                    // Light direction
            vec3 V = normalize(u_ViewDir);                     // View direction
            vec3 R = reflect(-L, N);                           // Reflection direction

            // Compute diffuse lighting only
            float diff = max(dot(N, L), 0.0);
            //vec3 color = baseColor.rgb * diff; // + ambient;

            //gl_FragColor = vec4(color, baseColor.a);

            // Specular lighting (Blinn-Phong)
            float spec = pow(max(dot(R, V), 0.0), 32.0 * (1.0 - roughness));
            //float spec = pow(max(dot(R, V), 0.0), 8.0 + 8.0 * roughness); // Adjust exponent based on roughness
            //spec = clamp(spec, 0.0, 1.0); // Clamp to avoid overly bright highlights


            // Combine lighting components
            vec3 ambient = baseColor.rgb * ao * 0.5;  // Ambient light with AO
            vec3 diffuse = baseColor.rgb * diff;
            vec3 specular = u_LightColor * spec * (1.0 - metallic);
            // Final color calculation
            vec3 finalColor = ambient + diffuse + specular;

            gl_FragColor = vec4(finalColor, baseColor.a);

            // Combine lighting components
            //vec3 finalColor = ambient + color * diff + u_LightColor * spec;
            //gl_FragColor = vec4(finalColor, baseColor.a);


            // gl_FragColor = vec4(normalMap * 0.5 + 0.5, 1.0);
            // Debug roughness map
            //gl_FragColor = vec4(vec3(roughness), 1.0);
            // gl_FragColor = texture2D(u_Sampler3, v_UV);     // use texture3

        } else if (u_whichTexture == 4) {
            vec4 skyColor = texture2D(u_Sampler6, vec2(v_UV.x, v_UV.y));
            gl_FragColor = skyColor;

        } else if (u_whichTexture == 5) {
            gl_FragColor = texture2D(u_Sampler7, v_UV);

        } else {
            gl_FragColor = vec4(1, .2, .2, 1);      // error, just put red
        }

    }`

// Global Variables
let canvas;
let gl;

let a_UV;
let a_Position;
let u_FragColor;

let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ProjectionMatrix
let u_ViewMatrix;

let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_Sampler5;
let u_Sampler6;
let u_Sampler7;

let u_LightDir; // Directional light
let u_LightColor;
let u_ViewDir;

let u_whichTexture;

//const textureSources = [
//    'textures/Cracked_Stone_Bricks.jpg',
//    'textures/Mossy_Cobblestone.jpg',
//    'textures/Mossy_Stone_Bricks.jpg',
//    'textures/sand_rocks_diff_1k.jpg',
//    'textures/sand_rocks_nor_1k.png',
//    'textures/sand_rocks_rough_1k.jpg',
//];


let g_globalAngle = 0;
let g_camera = new Camera();

// let g_map = [
//     [0, 3, 3, 3, 3, 3, 3, 3, 3, 0],
//     [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
//     [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
//     [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
//     [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
//     [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
//     [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
//     [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
//     [3, 0, 0, 0, 0, 0, 0, 0, 0, 3],
//     [0, 3, 3, 3, 3, 3, 3, 3, 3, 0],
// ];
// 
let g_cubes = [];
// // Initialize walls
// function initializeMap() {
//     for (let x = 0; x < g_map.length; x++) {
//         for (let y = 0; y < g_map[x].length; y++) {
//             let height = g_map[x][y];
//             for (let h = 0; h < height; h++) {
//                 let wallPiece = new Cube();
//                 wallPiece.textureNum = Math.floor(Math.random() * 3);
//                 wallPiece.matrix.translate(x - 5, h - 0.75, y - 5);
//                 g_cubes.push(wallPiece);
//             }
//         }
//     }
// }

function renderCubes() {
    for (let cube of g_cubes) {
        cube.render();
    }
}

const width = 32;
const depth = 32;
const pillarProbability = 0.05; // 5% chance of a pillar in non-edge cells
const maxPillarHeight = 4; // Pillars can be up to 4 blocks high

const reservedX = 30; // Reserved spot X coordinate
const reservedY = 30; // Reserved spot Y coordinate

let g_map = new Array(width);
for (let x = 0; x < width; x++) {
    g_map[x] = new Array(depth);
    for (let y = 0; y < depth; y++) {
        // Initialize the height to zero
        g_map[x][y] = [];

        // Assign random heights to edge cells and potential pillars
        let isEdge = x === 0 || x === width - 1 || y === 0 || y === depth - 1;
        let randomHeight = isEdge ? Math.floor(Math.random() * 4) + 1 : 0;

        if (!isEdge && Math.random() < pillarProbability) {
            randomHeight = Math.floor(Math.random() * maxPillarHeight) + 1;
        }

        // Populate the cell with 1s up to randomHeight
        g_map[x][y] = new Array(randomHeight).fill(1);

        // Check for the reserved spot and set a specific condition
        if (x === reservedX && y === reservedY) {
            g_map[x][y] = [1]; // Always one cube at the reserved spot
        }
    }
}

function initializeMap() {
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < depth; y++) {
            let columnHeight = g_map[x][y].length; // Fetch the height of the column at (x, y)
            for (let z = 0; z < columnHeight; z++) {
                if (g_map[x][y][z] === 1) { // Only create a cube if there is a 1 in the map
                    let cube = new Cube();
                    cube.textureNum = (x === reservedX && y === reservedY) ? 5 : 3;
                    cube.matrix.translate(x - width / 2, z - .75, y - depth / 2); // Adjust position based on z height
                    g_cubes.push(cube);
                }
            }
        }
    }
}

//  (30,30)
//cube.textureNum = (x === reservedX && y === reservedY) ? 5 : 3;
//cube.matrix.translate(x - width / 2, z - .75, y - depth / 2);


// function createTiledFloor(sizeX = 10, sizeY = 10) {
//     let floorCubes = [];
//     for (let x = 0; x < sizeX; x++) {
//         for (let y = 0; y < sizeY; y++) {
//             let floorPiece = new Cube();
//             floorPiece.textureNum = 3; // Floor texture
//             floorPiece.matrix.translate(x - sizeX / 2, -0.75, y - sizeY / 2);
//             floorPiece.matrix.scale(1, 0.01, 1); // Make it flat
//             floorCubes.push(floorPiece);
//         }
//     }
//     return floorCubes;
// }
// 
// let g_floorCubes = [];
// 
// function initializeFloor() {
//     g_floorCubes = createTiledFloor(40, 40); 
// }
// 
// function renderFloor() {
//     for (let cube of g_floorCubes) {
//         cube.render();
//     }
// }



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
    // Get the storage location of u_Sampler
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
      console.log('Failed to get the storage location of u_Sampler1');
      return;
    }
    // Get the storage location of u_Sampler
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
      console.log('Failed to get the storage location of u_Sampler2');
      return;
    }
    // Get the storage location of u_Sampler
    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    if (!u_Sampler3) {
      console.log('Failed to get the storage location of u_Sampler3');
      return;
    }
    // Get the storage location of u_Sampler
    u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
    if (!u_Sampler4) {
      console.log('Failed to get the storage location of u_Sampler4');
      return;
    }
    // Get the storage location of u_Sampler
    u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
    if (!u_Sampler5) {
      console.log('Failed to get the storage location of u_Sampler5');
      return;
    }
    // Get the storage location of u_Sampler
    u_Sampler6 = gl.getUniformLocation(gl.program, 'u_Sampler6');
    if (!u_Sampler6) {
      console.log('Failed to get the storage location of u_Sampler6');
      return;
    }
    // Get the storage location of u_Sampler
    u_Sampler7 = gl.getUniformLocation(gl.program, 'u_Sampler7');
    if (!u_Sampler7) {
      console.log('Failed to get the storage location of u_Sampler7');
      return;
    }

    // Get the storage location of u_LightDir
    u_LightDir = gl.getUniformLocation(gl.program, 'u_LightDir');
    if (!u_LightDir) {
      console.log('Failed to get the storage location of u_LightDir');
      return;
    }
    gl.uniform3f(u_LightDir, 0.5, 1.0, 0.3); // Sun direction

    // Get the storage location of u_LightColor
    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    if (!u_LightColor) {
      console.log('Failed to get the storage location of u_LightColor');
      return;
    }
    gl.uniform3f(u_LightColor, 1.0, 1.0, 0.9); // Warm sunlight

    // Get the storage location of u_ViewDir
    u_ViewDir = gl.getUniformLocation(gl.program, 'u_ViewDir');
    if (!u_ViewDir) {
      console.log('Failed to get the storage location of u_ViewDir');
      return;
    }
    gl.uniform3f(u_ViewDir, 0.0, 0.0, 1.0); // View direction (camera facing -Z)


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

    // Set the initial values of the transformation matrices to the identity matrix
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, identityM.elements);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, identityM.elements);
}


function main() {

    // Set up canvas and gl variables (canvas and context)
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    addMouseControls();
    document.onkeydown = keydown;


    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 0);

    //if (resizeCanvasToDisplaySize(canvas)) {
    //    updateProjectionMatrix();
    //}

//    initTextures(textureSources);
    initTextures([
        { src: 'textures/Cracked_Stone_Bricks.jpg', normal: false, grayscale: false },
        { src: 'textures/Mossy_Cobblestone.jpg', normal: false, grayscale: false },
        { src: 'textures/Mossy_Stone_Bricks.jpg', normal: false, grayscale: false },
        { src: 'textures/metal_diff_1k.png', normal: false, grayscale: false },
        { src: 'textures/metal_nor_1k.png', normal: true, grayscale: false },
        { src: 'textures/metal_arm_1k.png', normal: false, grayscale: false },
        { src: 'textures/space_box.png', normal: false, grayscale: false },
        { src: 'textures/crying_obsidian.jpg', normal: false, grayscale: false },        
    ]);

    initializeMap();
//    initializeFloor();

    // Initial message
    addMessage("You: ....wtf");

    setTimeout(() => {
        addMessage("You: nah this is crazy, where am I");
        setTimeout(() => {
            addMessage("Ominous Voice: Watch your mouth.");
            setTimeout(() => {
                addMessage("Ominous Voice: You are in my simulation.");
                setTimeout(() => {
                    addMessage("Ominous Voice: I need you to find my precious rock.");
                    setTimeout(() => {
                        addMessage("You: What are you talking about? Who are you?");
                        setTimeout(() => {
                            addMessage("You: Hellooooo...");
                            setTimeout(() => {
                                messageContainer.style.display = 'none'; // Hide the container
                                messageContainer.innerHTML = ''; // Clear previous messages

                                // Display the new permanent message
                                permanentMessage.textContent = "Goal: Find that precious rock.";
                                permanentMessage.style.display = 'block'; // Make the permanent message visible

                            }, 8000);
                        }, 10000);
                    }, 6000);
                }, 8000);
            }, 7000); //  after 10 seconds
        }, 6000); // Change message after 10 seconds
    }, 3000); // Change message after 2 seconds

    requestAnimationFrame(tick);
}

const messageContainer = document.getElementById('message-container');
const permanentMessage = document.getElementById('permanent-message');

function addMessage(text) {
    const message = document.createElement('div');
    message.textContent = text;
    message.className = 'message';
    messageContainer.appendChild(message);
    messageContainer.scrollTop = messageContainer.scrollHeight; // Auto-scroll to the newest message
}


function tick() {
    // save current time
    g_seconds = performance.now()/1000.0 - g_startTime;

    // update angles
    //updateAnimationAngles();

    // draw everything
    renderAllShapes();

    // tell the browser to update again when it has time
    requestAnimationFrame(tick);
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
    projMat.setPerspective(100, canvas.width/canvas.height, .1, 100);    // (fov, aspect ratio, near plane, far plane)
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    // Pass the view matrix
    let viewMat = new Matrix4();
    viewMat.setLookAt(
        g_camera.eye.x, g_camera.eye.y, g_camera.eye.z,
        g_camera.at.x, g_camera.at.y, g_camera.at.z,
        g_camera.up.x, g_camera.up.y, g_camera.up.z
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    //console.log(g_camera);
    // Pass the global rotation matrix
    let globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);


    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let sky = new Cube();
    sky.color = [0, 0, 0, 1];
    sky.textureNum = 4; // sky texture
    sky.matrix.translate(-64, -32, -64);
    sky.matrix.scale(128, 128, 128);
    sky.render();

    let floor = new Cube();
    floor.color = [0, 0, 0, 1];
    floor.textureNum = 3; // floor texture
    floor.matrix.translate(-15, -0.75, -15);
    floor.matrix.scale(31, 0.1, 32);
    floor.render();

    renderCubes();
//    renderFloor();


    // Check the time passed at completion, then print
    let duration = performance.now() - startTime;
    sendTextToHTML("entity counter: " + "0" + " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "counter");

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

//function checkCubeClicked(x, y) {
//    // Convert screen coordinates to NDC
//    const ndcX = (x / canvas.width) * 2 - 1;
//    const ndcY = -(y / canvas.height) * 2 + 1; // Invert y to match WebGL's coordinate system
//    // Create ray and perform intersection test with the cube's bounding volume
//    // Placeholder for actual intersection logic
//    return someIntersectionTestFunction(ndcX, ndcY, cubePosition, cubeSize);
//}

let blockStack = []; // Stores blocks with their positions and buffer index


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
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Update WebGL viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
}

//function resizeCanvasToDisplaySize(canvas) {
//    const width = window.innerWidth;
//    const height = window.innerHeight;
//
//    if (canvas.width !== width || canvas.height !== height) {
//        canvas.width = width;
//        canvas.height = height;
//
//        // Set the viewport to match
//        gl.viewport(0, 0, canvas.width, canvas.height);
//
//        return true; // Canvas was resized
//    }
//
//    return false; // No resizing was needed
//}

//function updateProjectionMatrix() {
//    const fov = 45 * Math.PI / 180;   // Convert 45 degrees to radians
//    const aspect = canvas.width / canvas.height;
//    const zNear = 0.1;
//    const zFar = 100.0;
//    const projMatrix = mat4.create();
//    mat4.perspective(projMatrix, fov, aspect, zNear, zFar);
//
//    // Assuming you have a uniform location stored for your projection matrix
//    gl.uniformMatrix4fv(projMatrixLocation, false, projMatrix);
//}
//
//
//// Add event listener to resize the canvas when the window is resized
//window.addEventListener('resize', () => {
//    if (resizeCanvasToDisplaySize(document.getElementById('webgl'))) {
//        updateProjectionMatrix();
//    }
//});

// Load the panoramic sky texture
// const skyTexture = new Image();
// skyTexture.src = 'textures/space_box.png';
// 
// skyTexture.onload = function () {
//     const texture = gl.createTexture();
//     gl.activeTexture(gl.TEXTURE3);
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, skyTexture);
// 
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
// 
//     const skySamplerLocation = gl.getUniformLocation(gl.program, 'u_SamplerSky');
//     gl.uniform1i(skySamplerLocation, 3);
// 
//     console.log('Skybox texture loaded');
// };
// 
// function createSkyDome(radius = 50, segments = 64) {
//     const vertices = [];
//     const uv = [];
// 
//     for (let lat = 0; lat <= 90; lat += 5) {
//         const theta = lat * Math.PI / 180;
//         const y = Math.sin(theta) * radius;
//         const r = Math.cos(theta) * radius;
// 
//         for (let lon = 0; lon <= 360; lon += 5) {
//             const phi = lon * Math.PI / 180;
//             const x = r * Math.sin(phi);
//             const z = r * Math.cos(phi);
// 
//             // Positions
//             vertices.push(x, y - 5, z); // Slightly offset below horizon
// 
//             // UV mapping: equirectangular projection
//             uv.push(lon / 360, 1.0 - lat / 90);
//         }
//     }
//     return { vertices, uv };
// }
// 
// const skyDome = createSkyDome();
// 
// 
// // Create and bind buffer for skybox
// const skyVertexBuffer = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, skyVertexBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyDome.vertices), gl.STATIC_DRAW);
// a_Position = gl.getAttribLocation(gl.program, 'a_Position');
// gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
// gl.enableVertexAttribArray(a_Position);
// 
// // Create and bind buffer for UV coordinates
// const skyUVBuffer = gl.createBuffer();
// gl.bindBuffer(gl.ARRAY_BUFFER, skyUVBuffer);
// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyDome.uv), gl.STATIC_DRAW);
// a_UV = gl.getAttribLocation(gl.program, 'a_UV');
// gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
// gl.enableVertexAttribArray(a_UV);
// 
// // Render the skybox before everything else
// gl.depthFunc(gl.LEQUAL);
// gl.drawArrays(gl.TRIANGLE_STRIP, 0, skyDome.vertices.length / 3);
// 

