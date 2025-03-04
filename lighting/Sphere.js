
class Sphere{
    constructor(latitudeBands = 20, longitudeBands = 20) {
        this.type = "Sphere";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.textureNum = 0;
        this.latitudeBands = latitudeBands;
        this.longitudeBands = longitudeBands;

        this.vertexUVBuffer = this.createVertexUVBuffer();
    }

    createVertexUVBuffer() {
        let buffer = gl.createBuffer();
        if (!buffer) {
            console.log("Failed to create the buffer object");
            return -1;
        }

        let verticesUVsNormals = [];
        
        for (let lat = 0; lat <= this.latitudeBands; lat++) {
            let theta = (lat * Math.PI) / this.latitudeBands;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= this.longitudeBands; lon++) {
                let phi = (lon * 2 * Math.PI) / this.longitudeBands;
                let sinPhi = Math.sin(phi);
                let cosPhi = Math.cos(phi);

                // Compute vertex position
                let x = cosPhi * sinTheta;
                let y = cosTheta;
                let z = sinPhi * sinTheta;

                // Compute UV coordinates
                let u = lon / this.longitudeBands;
                let v = lat / this.latitudeBands;

                // Store position, UV, and normal (same as position for a sphere)
                verticesUVsNormals.push(x, y, z, u, v, x, y, z);
            }
        }

        let indices = [];
        for (let lat = 0; lat < this.latitudeBands; lat++) {
            for (let lon = 0; lon < this.longitudeBands; lon++) {
                let first = lat * (this.longitudeBands + 1) + lon;
                let second = first + this.longitudeBands + 1;

                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        // Create buffer and pass data
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesUVsNormals), gl.STATIC_DRAW);

        // Create an index buffer for optimized rendering
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.indexCount = indices.length;
        return buffer;
    }

    draw() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexUVBuffer);

        // Position
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(a_Position);

        // UV
        gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(a_UV);

        // Normal
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 5 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(a_Normal);

        // Set uniforms
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniformMatrix4fv(u_NormalMatrix, false, this.normalMatrix.elements);

        // Bind index buffer and draw elements
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
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
