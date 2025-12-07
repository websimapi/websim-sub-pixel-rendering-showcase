import * as THREE from 'three';
import nipplejs from 'nipplejs';

export class InputManager {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // State
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.setupKeyboard();
        this.setupMouse();
        
        if (this.isMobile) {
            this.setupJoystick();
        }
    }

    setupKeyboard() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    setupMouse() {
        // Simple look controls
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        const sensitivity = 0.002;

        this.domElement.addEventListener('mousedown', () => { isDragging = true; });
        this.domElement.addEventListener('mouseup', () => { isDragging = false; });
        this.domElement.addEventListener('mouseleave', () => { isDragging = false; });

        this.domElement.addEventListener('mousemove', (e) => {
            if (this.isMobile) return; // Disable mouse look on mobile to avoid conflict with touch scroll/tap
            
            // Allow looking if pointer is locked OR if mouse is down (drag to look)
            if (document.pointerLockElement === this.domElement) {
                this.camera.rotation.y -= e.movementX * sensitivity;
                this.camera.rotation.x -= e.movementY * sensitivity;
                this.clampPitch();
            } else if (isDragging) {
                 const deltaMove = {
                    x: e.offsetX - previousMousePosition.x,
                    y: e.offsetY - previousMousePosition.y
                };
                
                this.camera.rotation.y -= deltaMove.x * sensitivity;
                this.camera.rotation.x -= deltaMove.y * sensitivity;
                this.clampPitch();
            }
            previousMousePosition = { x: e.offsetX, y: e.offsetY };
        });
        
        // Request pointer lock on click for immersive experience
        this.domElement.addEventListener('click', () => {
            if(!this.isMobile) {
                this.domElement.requestPointerLock();
            }
        });
    }
    
    clampPitch() {
         // Clamp vertical look
         const maxPolarAngle = Math.PI / 2 - 0.1;
         this.camera.rotation.x = Math.max(-maxPolarAngle, Math.min(maxPolarAngle, this.camera.rotation.x));
    }

    setupJoystick() {
        const zone = document.getElementById('joystick-zone');
        if (!zone) return;

        const manager = nipplejs.create({
            zone: zone,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'cyan'
        });

        manager.on('move', (evt, data) => {
            const forward = data.vector.y;
            const turn = data.vector.x;

            if (forward > 0) {
                this.moveForward = true;
                this.moveBackward = false;
            } else if (forward < 0) {
                this.moveForward = false;
                this.moveBackward = true;
            } else {
                this.moveForward = false;
                this.moveBackward = false;
            }

            // Strafe on joystick x
            if (turn < 0) {
                this.moveLeft = true;
                this.moveRight = false;
            } else if (turn > 0) {
                this.moveLeft = false;
                this.moveRight = true;
            } else {
                this.moveLeft = false;
                this.moveRight = false;
            }
            
            // Also rotate camera slightly with joystick for ease of use
            this.camera.rotation.y -= turn * 0.03; 
        });

        manager.on('end', () => {
            this.moveForward = false;
            this.moveBackward = false;
            this.moveLeft = false;
            this.moveRight = false;
        });
    }

    update(delta) {
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();
    }
}