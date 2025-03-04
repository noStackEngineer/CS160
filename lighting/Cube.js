
class Cube{
    constructor(){
        this.type = "Cube";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.vertexUVBuffer = this.createVertexUVBuffer();
        this.textureNum = -2;
    }

    createVertexUVBuffer(){
        // Create a buffer object
        let buffer = gl.createBuffer();
        if (!buffer) {
          console.log('Failed to create the buffer object');
          return -1;
        }

        // Define vertices and UVs
        const verticesUVsNormals = [
            // Vertices and UVs for each face of the cube
            // Front face
            0, 0, 1,  0, 0,  0, 0, 1,
            1, 0, 1,  1, 0,  0, 0, 1,
            1, 1, 1,  1, 1,  0, 0, 1,
            0, 0, 1,  0, 0,  0, 0, 1,
            1, 1, 1,  1, 1,  0, 0, 1,
            0, 1, 1,  0, 1,  0, 0, 1,

            // Back face
            1, 0, 0,  0, 0,  0, 0, -1,
            0, 0, 0,  1, 0,  0, 0, -1,
            0, 1, 0,  1, 1,  0, 0, -1,
            1, 0, 0,  0, 0,  0, 0, -1,
            0, 1, 0,  1, 1,  0, 0, -1,
            1, 1, 0,  0, 1,  0, 0, -1,

            // Top face
            0, 1, 1,  0, 0,  0, 1, 0,
            1, 1, 1,  1, 0,  0, 1, 0,
            1, 1, 0,  1, 1,  0, 1, 0,
            0, 1, 1,  0, 0,  0, 1, 0,
            1, 1, 0,  1, 1,  0, 1, 0,
            0, 1, 0,  0, 1,  0, 1, 0,

            // Bottom face
            0, 0, 0,  0, 0,  0, -1, 0,
            1, 0, 0,  1, 0,  0, -1, 0,
            1, 0, 1,  1, 1,  0, -1, 0,
            0, 0, 0,  0, 0,  0, -1, 0,
            1, 0, 1,  1, 1,  0, -1, 0,
            0, 0, 1,  0, 1,  0, -1, 0,

            // Left face
            0, 0, 0,  0, 0,  -1, 0, 0,
            0, 0, 1,  1, 0,  -1, 0, 0,
            0, 1, 1,  1, 1,  -1, 0, 0,
            0, 0, 0,  0, 0,  -1, 0, 0,
            0, 1, 1,  1, 1,  -1, 0, 0,
            0, 1, 0,  0, 1,  -1, 0, 0,

            // Right face
            1, 0, 1,  0, 0,  1, 0, 0,
            1, 0, 0,  1, 0,  1, 0, 0,
            1, 1, 0,  1, 1,  1, 0, 0,
            1, 0, 1,  0, 0,  1, 0, 0,
            1, 1, 0,  1, 1,  1, 0, 0,
            1, 1, 1,  0, 1,  1, 0, 0,
        ];

        // Bind buffer and upload data
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesUVsNormals), gl.STATIC_DRAW);

        return buffer;
    }

    draw(){
        // Bind the buffer for vertex and UV coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexUVBuffer);

        // position
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(a_Position);

        // uv
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(a_UV);

        // normal
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 5 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(a_Normal);

        // Set the texture
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Set color and matrix uniforms
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        //// pass the normal matrix to glsl
        //this.normalMatrix.setInverseOf(this.matrix).transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

        // Draw the cube (6 faces, 2 triangles per face, 3 vertices per triangle)
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }

    render() {
        this.draw();
    }

    renderFast() {
        this.drawFast();
    }

    drawFast() {
        // Bind the buffer for vertex and UV coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexUVBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(a_UV);

        // Set the texture
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Set color and matrix uniforms
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw the cube (6 faces, 2 triangles per face, 3 vertices per triangle)
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }



    old_drawTriangle3DUV(vertices, uv) {

        let n = 3; // The number of vertices
    
        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        // Write date into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    
        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);   
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        //-------------------------------------------

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        // Write date into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);
    
        // Assign the buffer object to a_Position variable
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);   
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_UV);

        
        gl.drawArrays(gl.TRIANGLES, 0, n);
    }

    old_render() {

        // Pass the texture number
        gl.uniform1i(u_whichTexture, this.textureNum);

        // Pass the color of a point to u_FragColor variable
        let rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        
        // Pass the matrix to u_ModelMatrix attribute; handles position/orientation
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements)


        this.drawTriangle3DUV([0,0,1, 1,0,1, 1,1,1], [0,0, 1,0, 1,1]);
        this.drawTriangle3DUV([0,0,1, 1,1,1, 0,1,1], [0,0, 1,1, 0,1]);

        // Back face
        this.drawTriangle3DUV([1,0,0, 0,0,0, 0,1,0], [0,0, 1,0, 1,1]);
        this.drawTriangle3DUV([1,0,0, 0,1,0, 1,1,0], [0,0, 1,1, 0,1]);

        // Top face
        this.drawTriangle3DUV([0,1,1, 1,1,1, 1,1,0], [0,0, 1,0, 1,1]);
        this.drawTriangle3DUV([0,1,1, 1,1,0, 0,1,0], [0,0, 1,1, 0,1]);

        // Bottom face
        this.drawTriangle3DUV([0,0,0, 1,0,0, 1,0,1], [0,0, 1,0, 1,1]);
        this.drawTriangle3DUV([0,0,0, 1,0,1, 0,0,1], [0,0, 1,1, 0,1]);

        // Left face
        this.drawTriangle3DUV([0,0,0, 0,0,1, 0,1,1], [0,0, 1,0, 1,1]);
        this.drawTriangle3DUV([0,0,0, 0,1,1, 0,1,0], [0,0, 1,1, 0,1]);

        // Right face
        this.drawTriangle3DUV([1,0,1, 1,0,0, 1,1,0], [0,0, 1,0, 1,1]);
        this.drawTriangle3DUV([1,0,1, 1,1,0, 1,1,1], [0,0, 1,1, 0,1]);
    }
}
