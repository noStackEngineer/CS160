
class Rectangle {
    constructor(){
        this.type = "Rectangle";
        this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.size = 15.0;
    }

    render() {
        let xy = this.position;
        let rgba = this.color;
        let color2 = [1.0, 0.0, 1.0, 1.0];
        let size = this.size;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // Pass the size of a point to u_Size variable
        gl.uniform1f(u_Size, size);

        // Draw the first triangle
        let d = this.size / 200.0; // delta
        drawTriangle([xy[0], xy[1], xy[0] + d, xy[1], xy[0], xy[1] + d]);

        // Change color for the second triangle (optional)
        gl.uniform4f(u_FragColor, color2[0], color2[1], color2[2], color2[3]);

        // Draw the second triangle
        drawTriangle([xy[0] + d, xy[1] + d, xy[0] + d, xy[1], xy[0], xy[1] + d]);
    }
}


function drawTriangle(vertices) {

    let n = 3; // The number of vertices

    // Create a buffer object
    let vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);   
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
    
    gl.drawArrays(gl.TRIANGLES, 0, n);
}
