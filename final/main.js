import * as THREE from 'three';
import { PMREMGenerator } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';



// META SET UP
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

// Create scene
const scene = new THREE.Scene();

// Create camera with perspective projection
let fov = 80;
let aspect = window.innerWidth / window.innerHeight; // Dynamic aspect ratio
let near = 0.1;
let far = 100;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 1;
camera.position.y = -16;
camera.position.x = 0;
// camera.lookAt(0, 0, 15); gets overwritten by controls

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;  // Rotates slowly when idle
controls.autoRotateSpeed = 0.5; // Slow rotation speed

controls.target.set(0,-15.9,0);
controls.update();








// TEXTURES
const textureLoader = new THREE.TextureLoader();
const arcadeTexture = textureLoader.load('textures/arcade.jpg');
const skyboxTexture = textureLoader.load('textures/arcade_skybox.jpg');



// SKYBOX
const sphereGeometry = new THREE.SphereGeometry(50, 32, 32);
const skyboxMaterial = new THREE.MeshBasicMaterial({
    map: skyboxTexture,
    side: THREE.BackSide // So we see it from inside
});
const skyboxSphere = new THREE.Mesh(sphereGeometry, skyboxMaterial);
scene.add(skyboxSphere);





// ACTUAL OBJECTS

// BACKGROUND
//const bgGeometry = new THREE.PlaneGeometry(30, 20); // Adjust width & height to fit
//const bgMaterial = new THREE.MeshBasicMaterial({
//    map: arcadeTexture,
//    side: THREE.FrontSide
//});
//const backgroundPlane = new THREE.Mesh(bgGeometry, bgMaterial);
//backgroundPlane.position.set(0, 0, -30);    // Position it behind the scene
//scene.add(backgroundPlane);




//  CLAW MACHINE
// FRAME GEOMETRY SETUP
const frameThickness = 0.5; 
const frameHeight = 40;  
const frameWidth = 30;
const frameDepth = 30; 


//  bottom/base
const baseGeometry = new THREE.PlaneGeometry(frameWidth-frameThickness, frameDepth - frameThickness);
const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1,      // Full metal
    roughness: 0.2,    // Slightly rough for a brushed look
    envMap: skyboxTexture,     // Adds reflections
});
const base = new THREE.Mesh(baseGeometry, baseMaterial);
base.rotation.x = -Math.PI / 2;
base.position.y = -frameHeight / 2;
base.receiveShadow = true;
scene.add(base);




///  WALL PIECES
const frameGeometry = new THREE.BoxGeometry(frameThickness, frameHeight, frameDepth - frameThickness);
const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8001c,   // Light gray metallic color
    metalness: 1,      // Full metal look
    roughness: 0.4     // Slightly reflective
});

const rightFlank = new THREE.Mesh(frameGeometry, frameMaterial);
rightFlank.position.x = frameWidth / 2;
rightFlank.position.y = -frameHeight / 1.25;
scene.add(rightFlank);

const leftFlank = new THREE.Mesh(frameGeometry, frameMaterial);
leftFlank.position.x = -frameWidth /2;
leftFlank.position.y = -frameHeight / 1.25;
scene.add(leftFlank);

const frontFlank = new THREE.Mesh(frameGeometry, frameMaterial);
frontFlank.rotation.y = Math.PI / 2;
frontFlank.position.z = -frameWidth / 2;
frontFlank.position.y = -frameHeight / 1.375;
scene.add(frontFlank);


// Calculate Height Difference
const heightDifference = Math.abs(frontFlank.position.y - rightFlank.position.y);
// Adjust Side Glass Heights
const adjustedSideGlassHeight = frameHeight + heightDifference; // Increase side glass height


//  glass box
const frontWindowGeo = new THREE.BoxGeometry(frameThickness / 2, frameHeight, frameDepth - frameThickness);
const sideWindowGeo = new THREE.BoxGeometry(frameThickness / 2, adjustedSideGlassHeight, frameDepth - frameThickness);
const glassMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xdaeaf7, 
    transparent: true, 
    opacity: 0.15
});
//const glassMaterial = new THREE.MeshPhysicalMaterial({
//    color: 0x88ccff,   // Light blue tint for realism
//    metalness: 0,      // Glass is not metallic
//    roughness: 0,      // Smooth glass surface
//    transparent: true, // Allows light to pass through
//    opacity: 0.1,      // Adjust opacity for visibility
//    transmission: 0.9, // Simulates real glass light transmission
//    ior: 1.5,          // Index of Refraction (1.5 for glass)
//    thickness: 0.01    // Small thickness for better realism
//});

const rightGlass = new THREE.Mesh(sideWindowGeo, glassMaterial);
rightGlass.position.x = frameWidth / 2;
rightGlass.position.y = rightFlank.position.y + frameHeight + (heightDifference / 2);
scene.add(rightGlass);

const leftGlass = new THREE.Mesh(sideWindowGeo, glassMaterial);
leftGlass.position.x = -frameWidth / 2;
leftGlass.position.y = leftFlank.position.y + frameHeight + (heightDifference / 2);
scene.add(leftGlass);

const frontGlass = new THREE.Mesh(frontWindowGeo, glassMaterial);
frontGlass.rotation.y = Math.PI / 2;
frontGlass.position.z = -frameWidth / 2;
frontGlass.position.y = frontFlank.position.y + frameHeight;
scene.add(frontGlass);

// Plastic Chute
const chuteGeometry = new THREE.BoxGeometry(frameThickness, 7, 10.25);

const leftChute = new THREE.Mesh(chuteGeometry, glassMaterial);
leftChute.position.x = 4.9;
leftChute.position.y = -16.5;
leftChute.position.z = -9.6;
scene.add(leftChute);

const rightChute = new THREE.Mesh(chuteGeometry, glassMaterial);
rightChute.rotation.y = Math.PI / 2;
rightChute.position.x = 9.75;
rightChute.position.y = -16.5;
rightChute.position.z = -4.25;
scene.add(rightChute);

const holeSize = 10.25; // Adjust hole size as needed

const holeGeometry = new THREE.PlaneGeometry(holeSize, holeSize);
const holeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000, // Pure black
    side: THREE.DoubleSide // Render both top and bottom
});

const prizeDropHole = new THREE.Mesh(holeGeometry, holeMaterial);
prizeDropHole.rotation.x = -Math.PI / 2; // Flat on the floor
prizeDropHole.position.set(rightChute.position.x+.5, -19.99, leftChute.position.z); // Slightly above the floor to avoid z-fighting
scene.add(prizeDropHole);



// Back Mirror
const backMirrorGeometry = new THREE.PlaneGeometry(frameWidth - frameThickness, frameHeight*1.3);
const backMirror = new Reflector(backMirrorGeometry, {
    textureWidth: (window.innerWidth * window.devicePixelRatio) / 2,
    textureHeight: (window.innerHeight * window.devicePixelRatio) / 2,
    color: 0x999999, // Slight gray tint
    clipBias: 0.003 // Prevents flickering
});
backMirror.rotation.y = Math.PI; // Make it face forward
backMirror.position.set(0, frameHeight / 7, (frameDepth / 2) - frameThickness); // Slightly in front of the back wall
scene.add(backMirror);

// Top Mirror
//const ceilingMirrorGeometry = new THREE.PlaneGeometry(frameWidth, frameDepth);
//const ceilingMirror = new Reflector(ceilingMirrorGeometry, {
//    textureWidth: window.innerWidth * window.devicePixelRatio,
//    textureHeight: window.innerHeight * window.devicePixelRatio,
//    color: 0x999999, // Slight gray tint
//    clipBias: 0.003 // Prevents flickering
//});
//ceilingMirror.rotation.x = Math.PI / 2; // Face downward
//ceilingMirror.position.set(0, frameHeight, 0); // Move it to the ceiling height
//scene.add(ceilingMirror);







// Top Frame (front and back)
const frameTopFront = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, frameThickness, frameThickness), frameMaterial);
const frameTopBack = frameTopFront.clone();

frameTopFront.position.set(0, frontGlass.position.y + frameThickness + (frameHeight / 2), -frameDepth / 2); 
frameTopBack.position.set(0, frontGlass.position.y + frameThickness + (frameHeight / 2), frameDepth / 2);

// Top Frame (left and right)
const frameTopLeft = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, frameThickness, frameWidth), frameMaterial);
const frameTopRight = frameTopLeft.clone();

frameTopLeft.position.set(-frameWidth / 2, frontGlass.position.y + frameThickness + (frameHeight / 2), 0); 
frameTopRight.position.set(frameWidth / 2, frontGlass.position.y + frameThickness + (frameHeight / 2), 0); 


// Middle-Vertical Frames
const frameLeftFront = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, 45, frameThickness), frameMaterial);
const frameRightFront = frameLeftFront.clone();
const frameRightBack = frameLeftFront.clone();
const frameLeftBack = frameLeftFront.clone();

frameLeftFront.position.set(-frameWidth / 2, frameHeight / 4, -frameDepth / 2); 
frameRightFront.position.set(frameWidth / 2, frameHeight / 4, -frameDepth / 2);
frameLeftBack.position.set(-frameWidth / 2, frameHeight / 4, frameDepth / 2);
frameRightBack.position.set(frameWidth / 2, frameHeight / 4, frameDepth / 2); 

// ADD FRAME PIECES TO THE SCENE
scene.add(
    frameTopFront, frameTopRight, frameTopBack, frameTopLeft,
    frameLeftFront, frameRightFront, frameLeftBack, frameRightBack
);


// top/ceiling
const ceiling = new THREE.Mesh(baseGeometry, baseMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = frontGlass.position.y + frameThickness + (frameHeight / 2);
//ceiling.receiveShadow = true;
scene.add(ceiling);


// Prizes 
const textures = [
    textureLoader.load('textures/crying_obsidian.jpg'),
    textureLoader.load('textures/marble_0015_color_4k.jpg'),
    textureLoader.load('textures/grass_side_128.jpg')
];


const placedPrizes = []; // Stores placed positions
const minDistance = 2; // Minimum distance between prizes

function isOverlapping(newPos) {
    for (let pos of placedPrizes) {
        const distance = Math.sqrt(
            (newPos.x - pos.x) ** 2 + (newPos.y - pos.y) ** 2 + (newPos.z - pos.z) ** 2
        );
        if (distance < minDistance) {
            return true; // Too close to another prize
        }
    }
    return false;
}

function createPrize() {
    const geometries = [
        new THREE.BoxGeometry(2, 2, 2),  
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.CylinderGeometry(1, 1, 1, 16)
    ];
    
    const randomGeometry = geometries[Math.floor(Math.random() * geometries.length)];
    const randomTexture = textures[Math.floor(Math.random() * textures.length)];

    const prizeMaterial = new THREE.MeshStandardMaterial({
        map: randomTexture,
        metalness: 0,
        roughness: 0.8
    });

    const prize = new THREE.Mesh(randomGeometry, prizeMaterial);

    let position;
    let attempts = 0;
    do {
        position = new THREE.Vector3(
            (Math.random() - 0.5) * 12 - 4,  
            -18,  
            (Math.random() - 0.5) * 12 +4  
        );
        attempts++;
    } while (isOverlapping(position) && attempts < 10); // Retry max 10 times

    // Store valid position and apply it
    placedPrizes.push(position);
    prize.position.copy(position);
    
    //prize.rotation.set(
    //    Math.random() * Math.PI,
    //    Math.random() * Math.PI,
    //    Math.random() * Math.PI
    //);

    scene.add(prize);
}

// Spawn multiple prizes
for (let i = 0; i < 10; i++) {
    createPrize();
}

scene.fog = new THREE.Fog(0x222233, 30, 80); // (color, start distance, end distance)


// LIGHTING
// 1. Ambient Light
const ambientLight = new THREE.AmbientLight(0x444444, .1);
scene.add(ambientLight);

// 2. Directional Light 
//const directionalLight = new THREE.DirectionalLight(0xffffff);
//directionalLight.intensity = 500;
//directionalLight.position.set(0, frontGlass.position.y + frameThickness + (frameHeight / 2), 0);
//directionalLight.castShadow = true;
//directionalLight.shadow.mapSize.width = 1024;
//directionalLight.shadow.mapSize.height = 1024;
//scene.add(directionalLight);

// 3. Point Light
const bulb1 = new THREE.PointLight(0xbf02a3, 5, frameHeight*2, .1); // Warm yellow light
bulb1.position.set(-5, frameHeight / 2, 0); // Left side

const bulb2 = new THREE.PointLight(0xbf02a3, 5, frameHeight*2, .1);
bulb2.position.set(5, frameHeight / 2, 0); // Right side
bulb1.castShadow = true;
bulb1.shadow.mapSize.width = 1024;
bulb1.shadow.mapSize.height = 1024;
bulb1.shadow.camera.near = 0.1;
bulb1.shadow.camera.far = 50;
bulb2.castShadow = true;
bulb2.shadow.mapSize.width = 1024;
bulb2.shadow.mapSize.height = 1024;
bulb2.shadow.camera.near = 0.1;
bulb2.shadow.camera.far = 50;
scene.add(bulb1, bulb2);

//const pointLight = new THREE.PointLight(0x00ffff, 1, 20);
//pointLight.intensity = 5;
//pointLight.position.set(0, 10, 0);
//scene.add(pointLight);

// 4. Spot Light 
const spotLight = new THREE.SpotLight(0x2605e3, 10); // White spotlight
spotLight.position.set(0, frameHeight / 2, 1); // Center top
spotLight.angle = Math.PI / 6; // Spread of light
spotLight.penumbra = 0.3; // Soft edges
spotLight.castShadow = true;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
spotLight.shadow.camera.near = 0.5;
spotLight.shadow.camera.far = 50;
spotLight.shadow.camera.fov = 30;
scene.add(spotLight);

//const spotLight = new THREE.SpotLight(0xffffff, 1);
//spotLight.intensity = 5;
//spotLight.position.set(10, 5, 5);
//spotLight.angle = Math.PI / 6;
//spotLight.penumbra = 0.2;
//spotLight.castShadow = true;
//scene.add(spotLight);


// 4️⃣ Light Helpers (Debugging)
//const pointLightHelper1 = new THREE.PointLightHelper(bulb1);
//const pointLightHelper2 = new THREE.PointLightHelper(bulb2);
//const spotLightHelper = new THREE.SpotLightHelper(spotLight);
//scene.add(pointLightHelper1, pointLightHelper2, spotLightHelper);

//const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
//scene.add(dirLightHelper);
//
//const spotLightHelper = new THREE.SpotLightHelper(spotLight, 0xf7df00);
//scene.add(spotLightHelper);
//
//const pointLightHelper = new THREE.PointLightHelper(pointLight);
//scene.add(pointLightHelper);



//claw_machine_rigged
//robot_arm_rigged

const loader = new GLTFLoader();
loader.load('textures/robot_arm_rigged.glb', function (gltf) {
    const clawModel = gltf.scene;

    // Set position, scale, and rotation
    clawModel.position.set(-1, 27, 4); // Adjust height in the claw machine
    clawModel.scale.set(1, 1, 1); // Scale if needed
    clawModel.rotation.x = -Math.PI / 1.35; 
    //clawModel.rotation.y = Math.PI / 2; 
    clawModel.rotation.z = Math.PI / 2.80; 

    scene.add(clawModel);
});


const normalMap = textureLoader.load('textures/Alien_character/L_alien_body_normals.png');   // If available
const diffuseMap = textureLoader.load('textures/Alien_character/L_alien_body_green.png');   // If available

let alienModel;
const fbxLoader = new FBXLoader();
fbxLoader.load('textures/Alien_character/Alien_character.fbx', function (fbx) {
    
    fbx.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                map: diffuseMap,  // Main texture
                normalMap: normalMap,  // Adds surface details (optional)
                metalness: 0.1,   // Adjust to your liking
                roughness: 0.9,   // Adjust for realism
            });

            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    fbx.scale.set(0.2, 0.2, 0.2); // FBX models often import at huge scales
    fbx.position.set(-30, -30, -28);
    fbx.rotation.x = .4;
    fbx.rotation.y = 1;

    alienModel = fbx;
    scene.add(fbx);
});





const rgbeLoader = new RGBELoader();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

rgbeLoader.load('textures/env_4k.hdr', function (hdrTexture) {
    const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
    
    // Apply environment map to the entire scene
    scene.environment = envMap;

    // Update materials to use the envMap
    baseMaterial.envMap = envMap;
    baseMaterial.needsUpdate = true;

    frameMaterial.envMap = envMap;
    frameMaterial.needsUpdate = true;

    glassMaterial.envMap = envMap;
    glassMaterial.needsUpdate = true;

    // Clean up memory
    hdrTexture.dispose();
    pmremGenerator.dispose();
});


// Ensure canvas fits screen
let resizeTimeout;
//window.addEventListener("resize", () => {
//    clearTimeout(resizeTimeout);
//    resizeTimeout = setTimeout(resizeCanvas, 100);
//});

resizeCanvas();

scene.traverse((child) => {
    if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
    }
});
// Start animation loop
requestAnimationFrame(render);


function render(time) {
    //time *= .001;   // converts time to seconds

    //
    //cubes.forEach((cube, ndx) => {
    //    const speed = 1 + ndx * .1;
    //    const rot = time * speed;
    //    cube.rotation.x = rot;
    //    cube.rotation.y = rot;
    //});

    if (alienModel) {
        alienModel.position.y += Math.sin(Date.now() * 0.001) * 0.01; // Smooth floating motion
//        alienModel.rotation.y += 0.01; // Slow rotation
    }

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

function resizeCanvas() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

