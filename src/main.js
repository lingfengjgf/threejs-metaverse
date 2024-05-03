import * as THREE from 'three';
import gsap from 'gsap';
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
renderer.shadowMap.enabled = true;
// 阴影贴图类型
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setSize(window.innerWidth,window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(40,10,40);

// 背景色
scene.background = new THREE.Color(0.2,0.2,0.2);

// 环境光
const ambientLight = new THREE.AmbientLight(0xffffff,0.8);
scene.add(ambientLight);

// 方向光
const directionLight = new THREE.DirectionalLight(0xffffff,0.6);
scene.add(directionLight);
directionLight.position.set(40, 40, 30);
directionLight.castShadow = true;

const SHADOW_DISTANCE = 50;
directionLight.shadow.camera.near = 0.1;
directionLight.shadow.camera.far = SHADOW_DISTANCE * 2;
directionLight.shadow.camera.left = -SHADOW_DISTANCE;
directionLight.shadow.camera.right = SHADOW_DISTANCE;
directionLight.shadow.camera.top = SHADOW_DISTANCE;
directionLight.shadow.camera.bottom = -SHADOW_DISTANCE;
directionLight.shadow.bias = -0.001;
directionLight.shadow.mapSize.width = 4096;
directionLight.shadow.mapSize.height = 4096;

// 方向光辅助体
// const dirHelper = new THREE.DirectionalLightHelper(directionLight, 5);
// scene.add(dirHelper);

// 相机辅助体
// const camHelper = new THREE.CameraHelper(directionLight.shadow.camera);
// scene.add(camHelper);

const controls = new OrbitControls(camera, renderer.domElement);

// const boxGeometry = new THREE.BoxGeometry(1,1,1);
// const boxMaterial = new THREE.MeshBasicMaterial({color:0x00ff00});
// const boxMesh = new THREE.Mesh(boxGeometry,boxMaterial);
// scene.add(boxMesh);

let car01;
let mixer;

const gltfLoader = new GLTFLoader();
gltfLoader.load('scene.glb',(gltf)=>{
  scene.add(gltf.scene);
  gltf.scene.traverse(child=>{
    if(child.type === 'Mesh'){
      child.castShadow = true;
      child.receiveShadow = true;
    }
  })

  car01 = scene.getObjectByName("小车1");

  mixer = new THREE.AnimationMixer(gltf.scene);
  const clips = gltf.animations;
  clips.forEach(clip => {
    const action = mixer.clipAction(clip);
    // action.loop = THREE.LoopOnce;
    // console.log('action:', action);
    action.play();
  })

  // GSAP核心
  // gsap.to(targets,vars)：开始的位置到结束的位置。
  // targets ：需要实现动画的对象，可以是object、array、选择器（如"#id"）。
  // vars：参数对象，包含想要改变的属性、回调函数等。
  // 常用属性：
  // 	duration: 1, // 秒
  // 	delay: 0.5, // 延迟
  // 	ease: "power2.inOut", // 缓动方式
  // 	paused: true, // 是否暂停
  // 	repeat: 2, // 重复次数，-1为一直重复
  // 	repeatDelay: 1, // 重复动画延迟
  // 	yoyo: true, // 如果为 true > A-B-B-A, 如果为 false > A-B-A-B
  // 常用回调：
  // 	onComplete：动画完成时调用。
  // 	onStart：动画开始时调用
  // 	onUpdate：每次动画更新时调用（在动画处于活动状态时每帧调用）。
  // 	onRepeat：每次动画重复时调用一次。
  // 	onReverseComplete：动画反转后再次到达其起点时调用。

  // 动画控制
  // tween.pause(); 暂停
  // tween.resume(); 恢复
  // tween.reverse(); 反向播放
  // tween.seek(0.5); 跳到0.5s
  // tween.progress(0.25); 跳到4分之1处
  // tween.timeScale(0.5); 速度减慢
  // tween.timeScale(2); 速度翻倍
  // tween.kill(); 删除动画

  gsap.to(car01.position, {
    y: 3,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  })

  gsap.to(car01.rotation, {
    y: Math.PI * 2,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  })

  const dynamicPosMesh01 = scene.getObjectByName('动态展台01');
  addDynamicType01(dynamicPosMesh01);
})

let sunMesh, earthMesh, moonMesh;
function addDynamicType01(mesh) {
  const material = new THREE.MeshStandardMaterial({color: 0xffffff});

  const sphereGeoSun = new THREE.SphereGeometry(1);
  sunMesh = new THREE.Mesh(sphereGeoSun, material);
  scene.add(sunMesh);

  const sphereGeoEarth = new THREE.SphereGeometry(0.5);
  earthMesh = new THREE.Mesh(sphereGeoEarth, material);
  scene.add(earthMesh);

  const sphereGeoMoon = new THREE.SphereGeometry(0.25);
  moonMesh = new THREE.Mesh(sphereGeoMoon, material);
  scene.add(moonMesh);

  sunMesh.add(earthMesh);
  earthMesh.add(moonMesh);

  earthMesh.position.set(1, 1.5, 0);
  moonMesh.position.set(0.5, 0.8, 0);

  sunMesh.position.set(mesh.position.x, mesh.position.y + 1.5, mesh.position.z);

  gsap.to(sunMesh.rotation, {
    y: Math.PI * 2,
    duration: 3,
    repeat: -1,
    ease: 'none'
  })
  gsap.to(earthMesh.rotation, {
    y: Math.PI * 2,
    duration: 3,
    repeat: -1,
    ease: 'none'
  })
  gsap.to(moonMesh.rotation, {
    y: Math.PI * 2,
    duration: 3,
    repeat: -1,
    ease: 'none'
  })

}

const textureLoader = new THREE.TextureLoader();
textureLoader.load('particle01.png', texture => {
  const vertices = [];
  for (let i = 0; i < 1000; i++) {
    const x = THREE.MathUtils.randFloatSpread(100);
    const y = THREE.MathUtils.randFloatSpread(100);
    const z = THREE.MathUtils.randFloatSpread(100);
    vertices.push(x, y, z);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.PointsMaterial({color: 0xffffff, map: texture, transparent: true});
  const points = new THREE.Points(geometry, material);

  gsap.to(points.position, {
    x: 8,
    y: 6,
    repeat: -1,
    duration: 40,
    yoyo: true,
    ease: 'none'
  })

  scene.add(points);
});

textureLoader.load('particle02.png', texture => {
  const vertices = [];
  for (let i = 0; i < 1000; i++) {
    const x = THREE.MathUtils.randFloatSpread(100);
    const y = THREE.MathUtils.randFloatSpread(100);
    const z = THREE.MathUtils.randFloatSpread(100);
    vertices.push(x, y, z);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  const material = new THREE.PointsMaterial({color: 0xffffff, map: texture, transparent: true});
  const points = new THREE.Points(geometry, material);

  gsap.to(points.position, {
    x: -10,
    y: -8,
    repeat: -1,
    duration: 30,
    yoyo: true,
    ease: 'none'
  })

  scene.add(points);
});



// window.addEventListener('keydown', e => {
//   if (e.key === 'f') {
//     console.log(scene.getObjectByName("小车1"));
//   }
// })
// 帧循环
function animate(){
  requestAnimationFrame(animate);

  renderer.render(scene,camera);

  controls.update();

  // if (car01) {
  //   car01.position.y += 0.01;
  // }

  // if (sunMesh && earthMesh && moonMesh) {
  //   sunMesh.rotateY(0.01);
  //   earthMesh.rotateY(0.01);
  //   moonMesh.rotateY(0.01);
  // }

  if (mixer) {
    mixer.update(0.02);
  }
}


animate();
