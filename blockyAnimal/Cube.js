
class Cube{
    constructor(){
        this.type = "Cube";
        //this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.size = 5.0
        //this.segments = 10;
        this.matrix = new Matrix4()
    }

    render() {
        //let xy = this.position;
        let rgba = this.color;
        //let size = this.size;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0]*1.3, rgba[1]*1.3, rgba[2]*1.3, rgba[3]);
        
        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements)

        // Front of cube
        drawTriangle3D( [0,0,0, 1,1,0, 1,0,0] );
        drawTriangle3D( [0,0,0, 0,1,0, 1,1,0] );

        // top of cube
        drawTriangle3D( [0,1,0, 0,1,1, 1,1,1] );
        drawTriangle3D( [0,1,0, 1,1,1, 1,1,0] );

        // darker shading for shadow
        gl.uniform4f(u_FragColor, rgba[0]*1.15, rgba[1]*1.15, rgba[2]*1.15, rgba[3]);

        // left of cube
        drawTriangle3D( [0,0,1, 0,1,1, 0,1,0] );
        drawTriangle3D( [0,0,1, 0,1,0, 0,0,0] );

        // right side of cube
        drawTriangle3D( [1,0,0, 1,1,0, 1,1,1] );
        drawTriangle3D( [1,0,0, 1,1,1, 1,0,1] );

        // darker shading for shadow
        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        // bottom of cube
        drawTriangle3D( [0,0,0, 1,0,1, 1,0,0] );
        drawTriangle3D( [0,0,0, 0,0,1, 1,0,1] );

        // back of cube
        drawTriangle3D( [0,0,1, 1,1,1, 0,1,1] );
        drawTriangle3D( [0,0,1, 1,1,1, 1,0,1] );
    }
}