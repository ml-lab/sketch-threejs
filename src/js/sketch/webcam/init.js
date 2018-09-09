const THREE = require('three/build/three.js');
const faceapi = require('face-api.js/dist/face-api.js');
const debounce = require('js-util/debounce');

const WebCamera = require('./WebCamera').default;
const Plane = require('./Plane').default;
const Points = require('./Points').default;

export default async function() {
  // ==========
  // Define common variables
  //
  const resolution = new THREE.Vector2();
  const canvas = document.getElementById('canvas-webgl');
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas,
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  const clock = new THREE.Clock({
    autoStart: false
  });

  // ==========
  // Define unique variables
  //

  const webCamera = new WebCamera();
  const plane = new Plane();
  const points = new Points();

  // ==========
  // Define functions
  //
  const render = async () => {
    const time = clock.getDelta();
    plane.render(time);
    renderer.render(scene, camera);
    const detections = await faceapi.tinyYolov2(webCamera.video, {
      scoreThreshold: 0.8
    });
    const landmarks = await faceapi.detectLandmarks(webCamera.video);
  };
  const renderLoop = () => {
    render();
    requestAnimationFrame(renderLoop);
  };
  const resizeCamera = () => {
    camera.aspect = resolution.x / resolution.y;
    camera.updateProjectionMatrix();
  };
  const resizeWindow = async () => {
    resolution.set(document.body.clientWidth, window.innerHeight);
    canvas.width = resolution.x;
    canvas.height = resolution.y;
    resizeCamera();
    renderer.setSize(resolution.x, resolution.y);
    await webCamera.init({
      audio: false,
      video: {
        facingMode: `environment`, // environment or user
      }
    });
  };
  const on = () => {
    window.addEventListener('resize', debounce(() => {
      resizeWindow().then(() => {
        plane.resize(webCamera);
      });
    }, 500));
  };

  // ==========
  // Initialize
  //
  await faceapi.loadTinyYolov2Model('/sketch-threejs/js/vendor/face-api.js/weights');
  await faceapi.loadFaceLandmarkModel('/sketch-threejs/js/vendor/face-api.js/weights');

  renderer.setClearColor(0xeeeeee, 1.0);
  camera.far = 1000;
  camera.setFocalLength(50);
  camera.position.set(0, 0, 100);
  camera.lookAt(new THREE.Vector3());
  clock.start();

  on();
  await resizeWindow();

  plane.createObj(webCamera);
  points.createObj();

  scene.add(plane.obj);
  scene.add(points.obj);

  renderLoop();
}