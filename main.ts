import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.addEventListener("change", () => {
//   console.log("Camera position:", camera.position);
// });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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

// Camera frames
let cameraKeyframes = [];

function updateCameraByScroll(scrollPercent: number) {
  // Find which two keyframes we're between
  for (let i = 0; i < cameraKeyframes.length - 1; i++) {
    const kfA = cameraKeyframes[i];
    const kfB = cameraKeyframes[i + 1];
    if (scrollPercent >= kfA.scroll && scrollPercent <= kfB.scroll) {
      const t = (scrollPercent - kfA.scroll) / (kfB.scroll - kfA.scroll);

      // Interpolate position and target
      camera.position.lerpVectors(kfA.position, kfB.position, t);
      const target = new THREE.Vector3().lerpVectors(kfA.target, kfB.target, t);
      camera.lookAt(target);
      break;
    }
  }
}

let model = new THREE.Group<THREE.Object3DEventMap>();

// Load GLB model
const loader = new GLTFLoader();
loader.load("Kohmi_animation.glb", (gltf) => {
  model = gltf.scene;
  console.log(model);
  scene.add(model);
  model.position.set(0, 0, 0); // Adjust model position if needed

  camera.position.copy(startPosition);

  // Calculate model height
  const bbox = new THREE.Box3().setFromObject(model);
  const modelHeight = bbox.max.y - bbox.min.y;

  cameraKeyframes = [
    {
      // Start: full body
      position: new THREE.Vector3(12.5, modelHeight * 0.2, 0),
      target: new THREE.Vector3(0, 0, 0), // Look at model center
      scroll: 0,
    },
    {
      // Close to ear
      position: new THREE.Vector3(2.22, 1.48, 0.49),
      target: new THREE.Vector3(1.3, 1.5, 0.2), // Approximate ear position
      scroll: 25,
    },
    {
      // Transition to torso
      position: new THREE.Vector3(5.18, 0.93, 0.21),
      target: new THREE.Vector3(0, modelHeight * 0.3, 0),
      scroll: 37,
    },
    {
      // Next to torso
      position: new THREE.Vector3(2.85, 0, 1),
      target: new THREE.Vector3(0, 0, -0.2),
      scroll: 50,
    },
    {
      // Next to legs
      position: new THREE.Vector3(-2.5, -1, 2),
      target: new THREE.Vector3(0, -0.7, -0.2), // Look at legs
      scroll: 75,
    },
    {
      // Final shot (full body)
      position: new THREE.Vector3(12.5, modelHeight * 0.2, 0),
      target: new THREE.Vector3(0, 0, 0), // Look at model center
      scroll: 100,
    },
  ];

  model.position.y = -bbox.min.y * 4.5; // Center model vertically

  endPosition.set(12.5, modelHeight * 0.2, 0); // Position in front, slightly above center

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

function render() {
  renderer.render(scene, camera);
}

window.addEventListener("resize", onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

let scrollPercent = 0;

window.addEventListener("scroll", () => {
  scrollPercent =
    ((document.documentElement.scrollTop || document.body.scrollTop) /
      ((document.documentElement.scrollHeight || document.body.scrollHeight) -
        document.documentElement.clientHeight)) *
    100;
  document.getElementById("scrollProgress").innerText =
    "Scroll Progress : " + scrollPercent.toFixed(2);
});

let animationPlayed = false;

// Animation loop
function animate() {
  requestAnimationFrame(animate); // Loop

  if (progress < 1) {
    // Camera is still moving
    progress += 0.008; // Adjust speed by changing this value
    camera.position.lerpVectors(startPosition, endPosition, progress);
    camera.lookAt(0, 0, 0);
  } else {
    // Play animation after camera movement is done, add a delay if necessary
    if (!animationPlayed) {
      playAnimation(5, false, () => {
        console.log("Animation 0 completed");
      });
      animationPlayed = true;
    }
    fadeInHeader();
    updateCameraByScroll(scrollPercent);
  }

  function fadeInHeader() {
    const header = document.getElementById("header");
    header.style.opacity = "1"; // Trigger fade-in effect by changing opacity to 1
  }

  // Update animation mixer if exists
  if (mixer) mixer.update(0.016); // 0.016 ~ 1/60 for smooth 60 FPS animation
  render();
}
window.scrollTo({ top: 0, behavior: "smooth" });
animate();
