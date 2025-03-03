import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const canvas = document.getElementById("canvas");
const canvasWidth = canvas.clientWidth;
const canvasHeight = canvas.clientHeight;
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvasWidth, canvasHeight);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

// Animation mixer
let mixer;
let animations = [];

// Camera start & target positions
let startPosition = new THREE.Vector3(0, 15, -30); // Start far behind
let endPosition = new THREE.Vector3(10, 0, 0); // Will update after loading
let progress = 0; // Animation progress
let cameraMoving = true;
let textAdded = false; // Track if text has been added

// Load GLB model
const loader = new GLTFLoader();
loader.load("Kohmi_animation.glb", (gltf) => {
  const model = gltf.scene;
  console.log(model);
  scene.add(model);
  model.position.set(0, 0, 0); // Adjust model position if needed

  camera.position.copy(startPosition);

  // Calculate model height
  const bbox = new THREE.Box3().setFromObject(model);
  const modelHeight = bbox.max.y - bbox.min.y;

  model.position.y = -bbox.min.y * 4.5; // Center model vertically

  endPosition.set(9.5, modelHeight * 0.2, 0); // Position in front, slightly above center

  // Store animations
  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    animations = gltf.animations;
  }
});

// Function to play animation
function playAnimation(index, loop = false, onComplete = null) {
  if (!mixer || animations.length <= index) return;

  mixer.stopAllAction(); // Stop any previous animations
  const action = mixer.clipAction(animations[index]);
  action.reset().play();

  if (loop) {
    action.loop = THREE.LoopRepeat; // Play forever
  } else {
    action.loop = THREE.LoopOnce; // Play once
    action.clampWhenFinished = true;
    action.onFinish = onComplete;
  }
}

// Function to add 3D text (back to 3D object)
function addText() {
  if (textAdded) return; // Prevent adding multiple times
  textAdded = true;

  // Load the font
  const fontLoader = new FontLoader();
  fontLoader.load("Oxanium_ExtraLight_Regular.json", (font) => {
    console.log(font);
    // Create the text geometry
    const textGeometry = new TextGeometry("KOHMI", {
      font: font,
      depth: 0.01,
      size: 0.9,
      height: 0.5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0,
      bevelSize: 0.1,
      bevelOffset: 0,
      bevelSegments: 5,
    });

    // Compute the bounding box of the text
    textGeometry.computeBoundingBox();
    const bbox = textGeometry.boundingBox;
    const textWidth = bbox.max.x - bbox.min.x; // Get width

    // Create a material for the text with emissive color
    const textMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff, // Add emissive color (green in this example)
      emissiveIntensity: 1, // Control the intensity of the emissive glow
      roughness: 0.5,
      metalness: 0.5,
    });

    // Create a mesh for the text
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Move text to the left by half its width to center it
    textMesh.position.set(0, 0, textWidth / 2); // Adjust Y to place it at the right height

    // Rotate the text if you need
    textMesh.rotation.y = Math.PI / 2;

    // Add the text mesh to the scene
    scene.add(textMesh);
  });
}

// Controls (optional)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (cameraMoving) {
    if (progress < 1) {
      progress += 0.005; // Adjust speed by changing this value
      camera.position.lerpVectors(startPosition, endPosition, progress);
      camera.lookAt(0, 0, 0);
    } else {
      addText(); // Add text after the animation
      cameraMoving = false;
      playAnimation(5, false, () => {
        console.log("Animation finished!");
        playAnimation(2, true); // Play anim 3, then loop anim 2
      });
    }
  }

  // Update animation mixer if exists
  if (mixer) mixer.update(0.016); // 0.016 ~ 1/60 for smooth 60 FPS animation

  controls.update();
  renderer.render(scene, camera);
}
animate();
