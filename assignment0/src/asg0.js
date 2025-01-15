// import { Vector3 } from './lib/cuon-matrix-cse160.js';

function drawVector(vector, color, context){
    // copy vector so we can scale without altering
    const drawnVector = new Vector3();
    drawnVector.set(vector);

    // scale each component by 20
    for(let i = 0; i < drawnVector.elements.length; i++){
        drawnVector.elements[i] *= 20;
    }

    // set color and width of line
    context.strokeStyle = color;
    context.lineWidth = 2;

    // set bounds of line
    context.beginPath();
    context.moveTo(200, 200); // center of 400x400 canvas
    context.lineTo(200 + drawnVector.elements[0], 200 - drawnVector.elements[1]);
    context.stroke(); // draw it on the canvas
}

function handleDrawEvent(canvas, context){
    // Clear the  canvas
    blankCanvas(canvas, context);
    console.log('Canvas cleared');

    // Get input elements
    const xInput_v1 = document.getElementById('x-v1');
    const yInput_v1 = document.getElementById('y-v1');
    const xInput_v2 = document.getElementById('x-v2');
    const yInput_v2 = document.getElementById('y-v2');

    // Convert inputs to numbers
    const v1_x = parseFloat(xInput_v1.value);
    const v1_y = parseFloat(yInput_v1.value);
    const v2_x = parseFloat(xInput_v2.value);
    const v2_y = parseFloat(yInput_v2.value);

    // Validate the inputs
    if (isNaN(v1_x) || isNaN(v1_y) || isNaN(v2_x) || isNaN(v2_y)) {
        alert('Please enter valid numbers.');
        return;
    }

    const v1 = new Vector3( [v1_x, v1_y, 0] );
    const v2 = new Vector3( [v2_x, v2_y, 0] );
    drawVector(v1, "red", context);
    drawVector(v2, "blue", context);

    return [v1, v2];
}


function blankCanvas(canvas, context){
    context.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color
    context.fillRect(0, 0, canvas.width, canvas.height); // Fill canvas with color
}

function angleBetween(v1, v2){
    const dot = Vector3.dot(v1, v2);
    const magnitudes = (v1.magnitude() * v2.magnitude());

    const cosTheta = dot / magnitudes;

    //cosTheta = Math.min(1, Math.max(-1, cosTheta));
    const radians = Math.acos(cosTheta);
    const angle = radians * ( 180 / Math.PI);
    return angle;
}

function areaTriangle(v1, v2){
    let crossProd = new Vector3();
    crossProd = Vector3.cross(v1, v2);
    const parallelogram = crossProd.magnitude();
    const triangleArea = parallelogram * 0.5;
    return triangleArea;
}

function handleDrawOperationEvent(canvas, context, operation){
    // draw two component vectors
    const vectors = handleDrawEvent(canvas, context);

    // Get input elements
    const scalarInput = document.getElementById('scalar');

    // Convert inputs to numbers
    const scalar = parseFloat(scalarInput.value);

    // perform operations
    switch (operation) {
        case 'Add':
            const sum = new Vector3();
            sum.set(vectors[0]);
            sum.add(vectors[1]);
            drawVector(sum, "green", context);
            break;
        case 'Subtract':
            const diff = new Vector3();
            diff.set(vectors[0]);
            diff.sub(vectors[1]);
            drawVector(diff, "green", context);
            break;
        case 'Multiply':
            const prod_one = new Vector3();
            const prod_two = new Vector3();
            prod_one.set(vectors[0]);
            prod_two.set(vectors[1])
            prod_one.mul(scalar);
            prod_two.mul(scalar);
            drawVector(prod_one, "green", context);
            drawVector(prod_two, "green", context);
            break;
        case 'Divide':
            const div_one = new Vector3();
            const div_two = new Vector3();
            div_one.set(vectors[0]);
            div_two.set(vectors[1])
            div_one.div(scalar);
            div_two.div(scalar);
            drawVector(div_one, "green", context);
            drawVector(div_two, "green", context);
            break;
        case 'Magnitude':
            console.log("Magnitude v1: ", vectors[0].magnitude());
            console.log("Magnitude v2: ", vectors[1].magnitude());
            break;
        case 'Normalize':
            const norm_one = new Vector3();
            const norm_two = new Vector3();
            norm_one.set(vectors[0]);
            norm_two.set(vectors[1])
            norm_one.normalize();
            norm_two.normalize();
            drawVector(norm_one, "green", context);
            drawVector(norm_two, "green", context);
            break;
        case 'Angle':
            const angle = angleBetween(vectors[0], vectors[1]);
            console.log("Angle: ", angle);
            break;
        case 'Area':
            const area = areaTriangle(vectors[0], vectors[1]);
            console.log("Area of the triangle: ", area);
            break;
        default:
            break;
    }

}



function main() {
    // Retrieve <canvas> element
    const canvas = document.getElementById('main-canvas');
    // Get the rendering context for 2D
    const context = canvas.getContext('2d');

    // create the blank canvas
    blankCanvas(canvas, context);

    // button logic
    const drawButton = document.getElementById('draw-button');
    drawButton.addEventListener('click', function() {
        const _ = handleDrawEvent(canvas, context);
    });

    const operationButton = document.getElementById('operation-button');
    const operationSelection = document.getElementById('Operation');
    operationButton.addEventListener('click', function() {
        const selectedOperation = operationSelection.value;
        handleDrawOperationEvent(canvas, context, selectedOperation);
    });

}