import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

console.log(THREE);

// 创建场景
const scene = new THREE.Scene();
// 创建相机
const camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.01,200);
// 创建渲染器
const renderer = new THREE.WebGLRenderer({antialias: true});
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
const ambientLight = new THREE.AmbientLight(0xffffff,0.2);
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

// const controls = new OrbitControls(camera, renderer.domElement);

// const boxGeometry = new THREE.BoxGeometry(1,1,1);
// const boxMaterial = new THREE.MeshBasicMaterial({color:0x00ff00});
// const boxMesh = new THREE.Mesh(boxGeometry,boxMaterial);
// scene.add(boxMesh);


const clock = new THREE.Clock();
let deltaTime;

let car01;
let mixer01;
let mixerPlayer;
let playerMesh;
const canRaycastMeshes = [];

new RGBELoader().load('sky.hdr', hdrTexture => {
  scene.background = hdrTexture;
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdrTexture;

  scene.backgroundBlurriness = 0.5;
  scene.backgroundIntensity = 0.5;

  renderer.outputEncoding = THREE.sRGBEncoding;
})

const gltfLoader = new GLTFLoader();


// window.addEventListener('keydown', e => {
//   if (e.key === 'f') {

//   }
// })
let actionIdle, actionWalk, actionRun;
gltfLoader.load('player01.glb', gltf => {
  playerMesh = gltf.scene;
  scene.add(playerMesh);

  mixerPlayer = new THREE.AnimationMixer(playerMesh);
  const clipIdle = THREE.AnimationUtils.subclip(gltf.animations[0], 'idle', 0, 61);
  const clipWalk = THREE.AnimationUtils.subclip(gltf.animations[0], 'walk', 70, 101);
  const clipRun = THREE.AnimationUtils.subclip(gltf.animations[0], 'run', 110, 126);

  actionIdle = mixerPlayer.clipAction(clipIdle);
  actionIdle.play();
  actionWalk = mixerPlayer.clipAction(clipWalk);
  // actionWalk.play();
  actionRun = mixerPlayer.clipAction(clipRun);
  // actionRun.play();

  // playerMesh.add(camera);
  // camera.position.set(0, 3, -6);
  // camera.lookAt(playerMesh.position.clone().add(new THREE.Vector3(0, 1.8, 0)));

  setThirdViewControl(playerMesh);
})

let yanhuatongGltf;
gltfLoader.load('yanhuatong01.glb', gltf => {
  scene.add(gltf.scene);
  yanhuatongGltf = gltf;
  gltf.scene.traverse(child => {
    canRaycastMeshes.push(child);
  })
})
gltfLoader.load('scene.glb',(gltf)=>{
  scene.add(gltf.scene);
  gltf.scene.traverse(child=>{
    if(child.type === 'Mesh'){
      child.castShadow = true;
      child.receiveShadow = true;
      canRaycastMeshes.push(child);
    }

    // if (child.name.indexOf('金蛋') > -1) {
    //   canRaycastMeshes.push(child);
    // }
  })

  car01 = scene.getObjectByName("小车1");
  car01.traverse(child => {
    child.userData['car01Group'] = car01;
    canRaycastMeshes.push(child);
  })
  // console.log('car01:',car01);

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
  const material = new THREE.MeshStandardMaterial({color: 0x999999, metalness: 0.2, roughness: 0.1});

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

// 射线拾取
let pointScreen = new THREE.Vector2();
let pointThreejs = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function checkRaycaster() {
  pointThreejs.x = (pointScreen.x / window.innerWidth) * 2 - 1;
  pointThreejs.y = (pointScreen.y / window.innerHeight) * -2 + 1;
  // console.log(pointThreejs.x, pointThreejs.y);

  raycaster.setFromCamera(pointThreejs, camera);
  const intersects = raycaster.intersectObjects(canRaycastMeshes);
  console.log(intersects);

  if (intersects.length && intersects[0].object.name === "yanhuatong") {
    const yanhuatong = scene.getObjectByName('yanhuatongGroup');
    yanhuatong.rotateY(30);

    mixer01 = new THREE.AnimationMixer(yanhuatongGltf.scene);
    const clips = yanhuatongGltf.animations;
    clips.forEach(clip => {
      const action = mixer01.clipAction(clip);
      action.loop = THREE.LoopOnce;
      action.clampWhenFinished = true;
      // console.log('action:', action);
      action.play();
    })
  }

  if (intersects.length && intersects[0].object.userData['car01Group']) {
    const car01Ins = intersects[0].object.userData['car01Group'];
    car01Ins.scale.x += 0.1;
    car01Ins.scale.y += 0.1;
    car01Ins.scale.z += 0.1;
  }

  if (intersects.length && intersects[0].object.name.indexOf('金蛋') > -1) {
    console.log(intersects[0].object.name);
    const egg = intersects[0].object;
    const newEggMaterial = egg.material.clone();
    egg.material = newEggMaterial;
    egg.material.color = new THREE.Color(0, 255, 0);
  }
}

// 角色不动时第三人称控制相机
let visualTargetMesh;
function setThirdViewControl(playerMesh) {
  // 创建虚拟物体
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const boxMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
  visualTargetMesh = new THREE.Mesh(boxGeo, boxMat);
  scene.add(visualTargetMesh);
  // playerMesh.add(visualTargetMesh);
  visualTargetMesh.add(camera);
  camera.position.set(0, 3, -6);
  camera.lookAt(visualTargetMesh.position.clone().add(new THREE.Vector3(0, 1.8, 0)));
  visualTargetMesh.visible = false;
}


// 动画切换
function crossPlay(curAction, newAction) {
  curAction.fadeOut(0.3);
  newAction.reset();
  newAction.setEffectiveWeight(1);
  newAction.play();
  newAction.fadeIn(0.3);
}

let isWalk = false;
let isRun = false;
let preWalkTime;
let rorateSpeed = 0;
let playerFrontVec = new THREE.Vector3(0, 0, 0);
const playerFrontOffset = new THREE.Vector3(0, 0.9, 0);
let playerUpVec = new THREE.Vector3(0, 1, 0);
let playerDownVec = new THREE.Vector3(0, -1, 0);
window.addEventListener('keydown', keycode => {
  if (keycode.key === 'w') {
    if (playerMesh) {
      // playerMesh.rotation.copy(visualTargetMesh.rotation);
      const playerDirection =  new THREE.Vector3();
      playerMesh.getWorldDirection(playerDirection);
      playerDirection.y = 0;
  
      const visualDirection =  new THREE.Vector3();
      visualTargetMesh.getWorldDirection(visualDirection);
      visualDirection.y = 0;
  
      const radian = playerDirection.angleTo(visualDirection);
  
      // playerMesh.rotateY(radian);
  
      visualTargetMesh.position.copy(playerMesh.position);
  
      // 判断旋转方向
      rorateSpeed = deltaTime * 10;
      playerDirection.cross(visualDirection);
      if (playerDirection.y > 0) {
        if (radian > rorateSpeed) {
          playerMesh.rotateY(rorateSpeed);
        } else {
          playerMesh.rotateY(radian);
        }
      }
      if (playerDirection.y < 0) {
        if (radian > rorateSpeed) {
          playerMesh.rotateY(-rorateSpeed);
        } else {
          playerMesh.rotateY(-radian);
        }
      }

      if (!isWalk) {
        // actionWalk.play();
        crossPlay(actionIdle, actionWalk);
        isWalk = true;
      }

      if (!preWalkTime) {
        preWalkTime = clock.getElapsedTime();
      }

      if (!isRun && clock.getElapsedTime() - preWalkTime > 2) {
        // actionWalk.stop();
        // actionRun.play();
        crossPlay(actionWalk, actionRun);
        isRun = true;
      }
      if (isWalk) {
        playerMesh.translateZ(0.1);
      }
      if (isRun) {
        playerMesh.translateZ(0.2);
      }

      // 角色碰撞检测
      // 向前
      playerMesh.getWorldDirection(playerFrontVec);
      const raycasterFront = new THREE.Raycaster(playerMesh.position.clone().add(playerFrontOffset), playerFrontVec);
      const collisionFront = raycasterFront.intersectObjects(canRaycastMeshes);
      // console.log(collisionFront);
      if (collisionFront && collisionFront.length && collisionFront[0].distance < 1.5) {
        return ;
      }
  
      // 向上
      const raycasterUp = new THREE.Raycaster(playerMesh.position, playerUpVec);
      const collisionUp = raycasterUp.intersectObjects(canRaycastMeshes);
      // console.log(collisionUp);
      let maxY = -1;
      collisionUp.forEach(item => {
        if (item.distance < 0.6 && item.point.y > maxY) {
          maxY = item.point.y;
        }
      })
      if (maxY != -1) {
        playerMesh.position.setY(maxY);
        return ;
      }
      // 向下
      const raycasterDown = new THREE.Raycaster(playerMesh.position, playerDownVec);
      const collisionDown = raycasterDown.intersectObjects(canRaycastMeshes);
      // console.log(collisionDown);
      if (collisionDown && collisionDown.length && collisionDown[0].distance < 0.6) {
        playerMesh.position.setY(collisionDown[0].point.y);
      }
    }


  }
})

let isKeyWDown = false;
window.addEventListener('mousedown', e => {
  if (e.button === 0) {
    // 鼠标左键按下
    isKeyWDown = true;
  }
})
window.addEventListener('mouseup', e => {
  if (e.button === 0) {
    // 鼠标左键按下
    isKeyWDown = false;
  }
})

window.addEventListener('keyup', keycode => {
  if (keycode.key === 'w') {
    if (playerMesh) {
      if (isRun) {
        crossPlay(actionRun, actionIdle);
        isRun = false;
      } else if (isWalk) {
        crossPlay(actionWalk, actionIdle);
      }
      isWalk = false;
      preWalkTime = 0;
    }
  }
})

let scrollSpeed = 0;
window.addEventListener('wheel', e => {
  scrollSpeed = deltaTime * 20;
  if (e.deltaY > 0) {
    camera.translateZ(-scrollSpeed);
  }
  if (e.deltaY < 0) {
    camera.translateZ(scrollSpeed);
  }
})

let preScreenX;
let mouseOffsetScreenX;
let preScreenY;
let mouseOffsetScreenY;
let yAxis = new THREE.Vector3(0, 1, 0);
let caneraYVec = new THREE.Vector3();
window.addEventListener('mousemove', e => {
  pointScreen.x = e.clientX;
  pointScreen.y = e.clientY;

  if (isKeyWDown) {
    if (preScreenX) {
      mouseOffsetScreenX = e.clientX - preScreenX;
      if (mouseOffsetScreenX > 0) {
        // playerMesh.rotateY(-0.01);
        // visualTargetMesh.rotateY(-0.1);
        visualTargetMesh.rotateOnWorldAxis(yAxis, -0.1);
      } 
      if (mouseOffsetScreenX < 0){
        // playerMesh.rotateY(0.01);
        // visualTargetMesh.rotateY(0.1);
        visualTargetMesh.rotateOnWorldAxis(yAxis, 0.1);
      }
    }
    preScreenX = e.clientX;
  
    if (preScreenY) {
      camera.getWorldPosition(caneraYVec);
      mouseOffsetScreenY = e.clientY - preScreenY;
      if (mouseOffsetScreenY > 0) {
        // playerMesh.rotateY(-0.01);
        if (caneraYVec.y < 5) {
          visualTargetMesh.rotateX(0.01);
        }
      } 
      if (mouseOffsetScreenY < 0){
        // playerMesh.rotateY(0.01);
        if (caneraYVec.y > 0.8) {
          visualTargetMesh.rotateX(-0.01);
        }
      }
    }
    preScreenY = e.clientY;
  }
})

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
})

window.addEventListener('click', e => {
  checkRaycaster();
})

// 帧循环
function animate(){
  requestAnimationFrame(animate);

  renderer.render(scene,camera);
  
  // controls.update();

  // if (car01) {
  //   car01.position.y += 0.01;
  // }

  // if (sunMesh && earthMesh && moonMesh) {
  //   sunMesh.rotateY(0.01);
  //   earthMesh.rotateY(0.01);
  //   moonMesh.rotateY(0.01);
  // }

  deltaTime = clock.getDelta();
  // console.log('deltaTime:', deltaTime);
  if (mixer01) {
    mixer01.update(deltaTime);
  }

  if (mixerPlayer) {
    mixerPlayer.update(deltaTime);
  }
}


animate();
