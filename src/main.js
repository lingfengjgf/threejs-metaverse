import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

console.log(THREE);

// 创建场景
const scene = new THREE.Scene();
// 创建相机
const camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.01,200);
// 创建渲染器
const renderer = new THREE.WebGLRenderer();
// 打开renderer阴影
// renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(20,20,10);

// 背景色
scene.background = new THREE.Color(0.2,0.2,0.2);

// 环境光
const ambientLight = new THREE.AmbientLight(0xffffff,0.6);
scene.add(ambientLight);

// 方向光
const directionLight = new THREE.DirectionalLight(0xffffff,0.4);
scene.add(directionLight);

const controls = new OrbitControls(camera, renderer.domElement);

// const boxGeometry = new THREE.BoxGeometry(1,1,1);
// const boxMaterial = new THREE.MeshBasicMaterial({color:0x00ff00});
// const boxMesh = new THREE.Mesh(boxGeometry,boxMaterial);
// scene.add(boxMesh);

const gltfLoader = new GLTFLoader();
gltfLoader.load('scene.glb',(gltf)=>{
  scene.add(gltf.scene);
})

// 帧循环
function animate(){
  requestAnimationFrame(animate);

  renderer.render(scene,camera);

  controls.update();

}

animate();
