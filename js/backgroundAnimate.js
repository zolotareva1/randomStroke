const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

function createHeartShape(scale = 1) {
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();

    heartShape.moveTo(x + 5 * scale, y + 5 * scale);
    heartShape.bezierCurveTo(x + 5 * scale, y + 5 * scale, x + 4 * scale, y, x, y);
    heartShape.bezierCurveTo(x - 6 * scale, y, x - 6 * scale, y + 7 * scale, x - 6 * scale, y + 7 * scale);
    heartShape.bezierCurveTo(x - 6 * scale, y + 11 * scale, x - 3 * scale, y + 15.4 * scale, x + 5 * scale, y + 19 * scale);
    heartShape.bezierCurveTo(x + 12 * scale, y + 15.4 * scale, x + 16 * scale, y + 11 * scale, x + 16 * scale, y + 7 * scale);
    heartShape.bezierCurveTo(x + 16 * scale, y + 7 * scale, x + 16 * scale, y, x + 10 * scale, y);
    heartShape.bezierCurveTo(x + 7 * scale, y, x + 5 * scale, y + 5 * scale, x + 5 * scale, y + 5 * scale);

    return heartShape;
}

const heartShape = createHeartShape(0.2);

const extrudeSettings = {
    depth: 0.1,
    bevelEnabled: true,
    bevelSegments: 12,
    steps: 2,
    bevelSize: 1,
    bevelThickness: 1
};

const material = new THREE.MeshPhongMaterial({ color: 0xff0000, specular: 0xb44242 });

let maxX, maxY, maxZ;
const velocityScale = 0.05;
const rotationScale = 0.01;

camera.position.z = 30;
camera.position.y = 3;

const hearts = [];
const numHearts = 13;

// Функция для расчета расстояния между двумя точками
function distance(obj1, obj2) {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const dz = obj1.position.z - obj2.position.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Функция для обновления границ
function updateBounds() {
    maxX = camera.aspect * 15; 
    maxY = 20;
    maxZ = 3;
}

updateBounds();

for (let i = 0; i < numHearts; i++) {
    // Создаем геометрию для каждого сердца
    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, material);

    // Задаем случайные начальные позиции
    mesh.position.x = (Math.random() * 2 - 1) * maxX;
    mesh.position.y = (Math.random() * 2 - 1) * maxY;
    mesh.position.z = (Math.random() * 2 - 1) * maxZ;

    // Задаем случайные скорости
    mesh.velocityX = (Math.random() * 2 - 1) * velocityScale;
    mesh.velocityY = (Math.random() * 2 - 1) * velocityScale;
    mesh.velocityZ = (Math.random() * 2 - 1) * velocityScale;

    // Задаем случайные скорости вращения
    mesh.rotationXSpeed = (Math.random() * 2 - 1) * rotationScale;
    mesh.rotationYSpeed = (Math.random() * 2 - 1) * rotationScale;

    scene.add(mesh);
    hearts.push(mesh);
}

// Создаем освещение
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 1).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Функция анимации
function animate() {
    requestAnimationFrame(animate);

    // Обновляем позицию и вращение каждого сердца
    for (let i = 0; i < numHearts; i++) {
        const mesh = hearts[i];

        // Обновляем вращение
        mesh.rotation.x += mesh.rotationXSpeed; // Вращаем по x
        mesh.rotation.y += mesh.rotationYSpeed; // Вращаем по y

        // Обновляем позицию
        mesh.position.x += mesh.velocityX;
        mesh.position.y += mesh.velocityY;
        mesh.position.z += mesh.velocityZ;

        if (mesh.position.x > maxX) {
            mesh.velocityX = Math.max(-velocityScale, mesh.velocityX - 0.001);
        }
        if (mesh.position.x < -maxX) {
            mesh.velocityX = Math.min(velocityScale, mesh.velocityX + 0.001);
        }
        if (mesh.position.y > maxY) {
            mesh.velocityY = Math.max(-velocityScale, mesh.velocityY - 0.001);
        }
        if (mesh.position.y < -maxY) {
            mesh.velocityY = Math.min(velocityScale, mesh.velocityY + 0.001);
        }
        if (mesh.position.z > maxZ) {
            mesh.velocityZ = Math.max(-velocityScale, mesh.velocityZ - 0.001);
        }
        if (mesh.position.z < -maxZ) {
            mesh.velocityZ = Math.min(velocityScale, mesh.velocityZ + 0.001);
        }

        for (let j = i + 1; j < numHearts; j++) {
            const otherMesh = hearts[j];
            const minDistance = 1; 

            if (distance(mesh, otherMesh) < minDistance) {
                const dx = mesh.position.x - otherMesh.position.x;
                const dy = mesh.position.y - otherMesh.position.y;
                const dz = mesh.position.z - otherMesh.position.z;

                const collisionNormal = new THREE.Vector3(dx, dy, dz).normalize();

                mesh.velocityX += collisionNormal.x * velocityScale * 0.5;
                mesh.velocityY += collisionNormal.y * velocityScale * 0.5;
                mesh.velocityZ += collisionNormal.z * velocityScale * 0.5;

                otherMesh.velocityX -= collisionNormal.x * velocityScale * 0.5;
                otherMesh.velocityY -= collisionNormal.y * velocityScale * 0.5;
                otherMesh.velocityZ -= collisionNormal.z * velocityScale * 0.5;
            }
        }
    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', function () {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateBounds();
});
