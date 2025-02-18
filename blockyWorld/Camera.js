
class Camera {
    constructor() {
        this.eye = new Vector3([0, 0, 3]);
        this.at = new Vector3([0, 0, -100]);
        this.up = new Vector3([0, 1, 0]);
    }

    forward() {
        let direction = Vector3.subtract(this.at, this.eye);
        direction.normalize().mul(.3);
        this.eye = Vector3.add(this.eye, direction);
        this.at = Vector3.add(this.at, direction);
    }
    
    back() {
        let direction = Vector3.subtract(this.at, this.eye);
        direction.normalize().mul(.3);
        this.eye = Vector3.subtract(this.eye, direction);
        this.at = Vector3.subtract(this.at, direction);
    }
    
    left() {
        let direction = Vector3.subtract(this.at, this.eye).normalize();
        let left = Vector3.cross(direction, this.up).normalize().mul(.3);
        this.eye = Vector3.subtract(this.eye, left);
        this.at = Vector3.subtract(this.at, left);
    }
    
    right() {
        let direction = Vector3.subtract(this.at, this.eye).normalize();
        let right = Vector3.cross(direction, this.up).normalize().mul(.3);
        this.eye = Vector3.add(this.eye, right);
        this.at = Vector3.add(this.at, right);
    }

    rotateLeft() {
        let direction = Vector3.subtract(this.at, this.eye);
        let rotationMatrix = new Matrix4().setRotate(5, this.up.x, this.up.y, this.up.z);
        let rotatedDirection = rotationMatrix.multiplyVector3(direction);
        this.at = Vector3.add(this.eye, rotatedDirection);
    }
    
    rotateRight() {
        let direction = Vector3.subtract(this.at, this.eye);
        let rotationMatrix = new Matrix4().setRotate(-5, this.up.x, this.up.y, this.up.z);
        let rotatedDirection = rotationMatrix.multiplyVector3(direction);
        this.at = Vector3.add(this.eye, rotatedDirection);
    }
    
}
