
class Pyramid{
    constructor(){
        this.type = "Pyramid";
        //this.position = [0.0, 0.0, 0.0];
        this.color = [1.0, 1.0, 1.0, 1.0];
        //this.size = 5.0
        //this.segments = 10;
        this.matrix = new Matrix4()

        this.A = [ 1,  1,  1];
        this.B = [-1, -1,  1];
        this.C = [-1,  1, -1];
        this.D = [ 1, -1, -1];
    }

    render() {
        //let xy = this.position;
        let rgba = this.color;
        //let size = this.size;

        // Pass the color of a point to u_FragColor variable
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        
        // Pass the matrix to u_ModelMatrix attribute
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements)

        

        // side one
        drawTriangle3D( [...this.A, ...this.B, ...this.D] );

        // darker shading for shadow
        gl.uniform4f(u_FragColor, rgba[0]*.94, rgba[1]*.94, rgba[2]*.94, rgba[3]);

        // side two
        drawTriangle3D( [...this.B, ...this.C, ...this.D] );

        // darker shading for shadow
        gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

        // side three
        drawTriangle3D( [...this.C, ...this.A, ...this.D] );

        // bottom
        drawTriangle3D( [...this.A, ...this.B, ...this.C] );
    }
}