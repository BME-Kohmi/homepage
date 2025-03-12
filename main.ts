import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let scrollPercent;
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

document.body.onscroll = () => {
  //calculate the current scroll progress as a percentage
  scrollPercent =
    ((document.documentElement.scrollTop || document.body.scrollTop) /
      ((document.documentElement.scrollHeight || document.body.scrollHeight) -
        document.documentElement.clientHeight)) *
    100;
  document.getElementById("scrollProgress").innerText =
    "Scroll Progress : " + scrollPercent.toFixed(2);
};

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
function playAnimation(
  index,
  loop = false,
  onComplete = null,
  crossfadeDuration = 0.5
) {
  if (!mixer || animations.length <= index) return;

  const currentAction = mixer._actions[0]; // Get the current active action
  const nextAction = mixer.clipAction(animations[index]);

  if (currentAction) {
    currentAction.fadeOut(crossfadeDuration); // Fade out current action over the specified duration
  }

  nextAction.reset().fadeIn(crossfadeDuration).play(); // Fade in next action
  if (loop) {
    nextAction.loop = THREE.LoopRepeat; // Play forever
  } else {
    nextAction.loop = THREE.LoopOnce; // Play once
    nextAction.clampWhenFinished = true;
    nextAction.onFinish = onComplete;
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (cameraMoving) {
    if (progress < 1) {
      progress += 0.008; // Adjust speed by changing this value
      camera.position.lerpVectors(startPosition, endPosition, progress);
      camera.lookAt(0, 0, 0);
    } else {
      // fadeInHeader(); // Add text after the animation
      cameraMoving = false;
      // Play animation after camera movement is done, add a delay if necessary
      setTimeout(() => {
        playAnimation(5, false, () => {
          console.log("Animation finished!");
          playAnimation(2, true); // Play anim 3, then loop anim 2
        });
      }, 500); // Delay before starting the animation (500ms)
    }
  }

  function fadeInHeader() {
    const header = document.getElementById("header");
    header.style.opacity = "1"; // Trigger fade-in effect by changing opacity to 1
  }

  // Update animation mixer if exists
  if (mixer) mixer.update(0.016); // 0.016 ~ 1/60 for smooth 60 FPS animation
  renderer.render(scene, camera);
}
animate();
