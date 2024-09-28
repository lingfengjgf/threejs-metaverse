import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

console.log(THREE);

// 创建场景
const scene = new THREE.Scene();
// 创建相机
const camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.01,200);
const cameraFly = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.01,200);
const cameraGame = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.01,200);
cameraFly.visible = false;
cameraGame.visible = false;
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
const directionLight = new THREE.DirectionalLight(0xffffff,1.2);
scene.add(directionLight);
directionLight.position.set(80, 40, 30);
directionLight.castShadow = true;

const SHADOW_DISTANCE = 80;
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
let mixer01, mixerDancer01, mixerDancer02, mixerDancer03;
let mixerPlayer;
let playerMesh;
let canRaycastMeshes = [];
let playerInSceneCanRaycast = [];

new RGBELoader().load('sky.hdr', hdrTexture => {
  scene.background = hdrTexture;
  hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdrTexture;

  scene.backgroundBlurriness = 0.5;
  scene.backgroundIntensity = 0.5;

  renderer.outputEncoding = THREE.sRGBEncoding;
})

const gltfLoader = new GLTFLoader();

let labelRenderer,nameLabel;
function setPlayerName() {
  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  document.body.appendChild(labelRenderer.domElement);

  const nameDiv = document.createElement('div');
  nameDiv.textContent = '凌峰';
  nameDiv.style.color = '#fff';
  nameDiv.style.padding = '4px 15px';
  nameDiv.style.background = 'rgba(0, 0, 120, 0.5)';
  nameDiv.style.borderRadius = '12px';

  nameLabel = new CSS2DObject(nameDiv);
  playerMesh.add(nameLabel);
  nameLabel.position.set(0, 2.7, 0);
}

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

  playerMesh.traverse(child => {
    child.receiveShadow = true;
    child.castShadow = true;
  })

  setThirdViewControl(playerMesh);

  setPlayerName();
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
  console.log(gltf.scene);
  gltf.scene.traverse(child=>{
    if(child.type === 'Mesh'){
      child.castShadow = true;
      child.receiveShadow = true;

      // 视椎体剔除
      child.frustumCulled = false;

      canRaycastMeshes.push(child);
    }

    if (child.name === '越野车01-车门-左') {
      child.traverse(item => {
        item.userData['ORVFatherDoorObj'] = child;
        item.userData['isOpen'] = false;
      })
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

  
  // 跳舞小人
  gltfLoader.load('dancer.glb', dancer01Gltf => {
    scene.add(dancer01Gltf.scene);
    dancer01Gltf.scene.position.copy(scene.getObjectByName('dancer01').position);
    dancer01Gltf.scene.rotation.copy(scene.getObjectByName('dancer01').rotation);
    mixerDancer01 = new THREE.AnimationMixer(dancer01Gltf.scene);
    const clipDancer01 = dancer01Gltf.animations[0];
    const actionDancer01 = mixerDancer01.clipAction(clipDancer01);
    actionDancer01.play();

    const dancer02 = clone(dancer01Gltf.scene);
    scene.add(dancer02);
    dancer02.position.copy(scene.getObjectByName('dancer02').position);
    dancer02.rotation.copy(scene.getObjectByName('dancer02').rotation);
    mixerDancer02 = new THREE.AnimationMixer(dancer02);
    const clipDancer02 = dancer01Gltf.animations[0];
    const actionDancer02 = mixerDancer02.clipAction(clipDancer02);
    actionDancer02.play();

    const dancer03 = clone(dancer01Gltf.scene);
    scene.add(dancer03);
    dancer03.position.copy(scene.getObjectByName('dancer03').position);
    dancer03.rotation.copy(scene.getObjectByName('dancer03').rotation);
    mixerDancer03 = new THREE.AnimationMixer(dancer03);
    const clipDancer03 = dancer01Gltf.animations[0];
    const actionDancer03 = mixerDancer03.clipAction(clipDancer03);
    actionDancer03.play();
  })


  const dynamicPosMesh01 = scene.getObjectByName('动态展台01');
  addDynamicType01(dynamicPosMesh01);

  addHotSpot();
  addHotTsb();
  // addGameTree();

  addRoadUVAnimation();
  // addGameStartMeshTriger();
})

function addGameStartMeshTriger() {
  const loader = new FontLoader();
  loader.load('FZLanTingHeiS-L-GB_Regular.json', function (font) {
    const geometry = new TextGeometry('游戏开始!', {
      font: font,
      size: 0.8,
      height: 0.05,
      curveSegments: 10,  // 最小为1， 越大字体越圆滑，越消耗性能
      bevelEnabled: false
    })

    const mat = new THREE.MeshStandardMaterial();
    const gameStartTextMesh = new THREE.Mesh(geometry, mat);
    scene.add(gameStartTextMesh);

    gameStartTextMesh.rotateY(0.8 - 3.14/2);
    gameStartTextMesh.translateZ(4);
    gameStartTextMesh.translateX(4);
    gameStartTextMesh.translateY(0.5);
  })
}

function addRoadUVAnimation() {
  const road = scene.getObjectByName('游戏路面');
  // road.material.map.generateMipmaps = false;
  console.log(renderer.capabilities.getMaxAnisotropy());
  road.material.map.anisotropy = 8;
  gsap.to(road.material.map.offset, {
    y: -2,
    duration: 2,
    repeat: -1,
    ease: 'none'
  })
}

window.changeColor = (i) => {
  const car = scene.getObjectByName('越野车01-车身');
  // car.material.color = new THREE.Color(0/255, 255/255, 249/255);
  const colors = [
    {r: 0/255, g: 255/255, b: 249/255, duration: 2},
    {r: 6/255, g: 97/255, b: 18/255, duration: 2},
    {r: 254/255, g: 154/255, b: 54/255, duration: 2},
    {r: 200/255, g: 35/255, b: 18/255, duration: 2},
    {r: 74/255, g: 136/255, b: 238/255, duration: 2},
    {r: 209/255, g: 163/255, b: 70/255, duration: 2},
  ]
  gsap.to(car.material.color, colors[i])

}

window.toggleTsb = () => {
  const display = document.getElementById('changeColorBox').style.display;
  document.getElementById('changeColorBox').style.display = display === 'block' ? 'none' : 'block';
}

// 调色板
function addHotTsb() {
  const mapTsb = new THREE.TextureLoader().load( "tsb.png" );
  const materialTsb  = new THREE.SpriteMaterial( { map: mapTsb } );
  const spritelTsb = new THREE.Sprite( materialTsb );
  spritelTsb.name = 'spritelTsb';
  const tsbHotSpot = scene.getObjectByName('越野车01-调色板');
  spritelTsb.position.copy(tsbHotSpot.position);
  scene.add( spritelTsb );

  canRaycastMeshes.push(spritelTsb);
}


// 点击热点
let spritelEnter, spritelExit;
function addHotSpot() {
  const mapEnter = new THREE.TextureLoader().load( "Enter.png" );
  const materialEnter  = new THREE.SpriteMaterial( { map: mapEnter, depthWrite: false } );
  spritelEnter = new THREE.Sprite( materialEnter );
  spritelEnter.name = 'spritelEnter';
  spritelEnter.scale.set(0.9, 0.9, 0.9);
  const enterHotSpot = scene.getObjectByName('越野车01-车外进入');
  spritelEnter.position.copy(enterHotSpot.position);
  scene.add( spritelEnter );

  gsap.to(spritelEnter.scale, {
    x: 1.2,
    y:1.2,
    z: 1.2,
    duration:3,
    repeat: -1
  })
  gsap.to(spritelEnter.material, {
    opacity: 0,
    duration:3,
    repeat: -1
  })

  const mapExit = new THREE.TextureLoader().load( "Exit.png" );
  const materialExit  = new THREE.SpriteMaterial( { map: mapExit } );
  spritelExit = new THREE.Sprite( materialExit );
  spritelExit.name = 'spritelExit';
  spritelExit.scale.set(0.15, 0.15, 0.15);
  const exitHotSpot = scene.getObjectByName('越野车01-车内退出');
  spritelExit.position.copy(exitHotSpot.position);
  spritelExit.visible = false;
  scene.add( spritelExit );

  canRaycastMeshes.push(spritelEnter);
}

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

let pickedEnergyUUid;
function addGameTree() {
  camera.visible = false;
  cameraGame.visible = true;

  crossPlay(actionIdle, actionRun);

  const midDecoration = scene.getObjectByName('中间装饰');
  midDecoration.visible = false;
  const playerStartPos = scene.getObjectByName('游戏-角色起始点');
  playerMesh.position.copy(playerStartPos.position);
  visualTargetMesh.position.copy(playerStartPos.position);
  playerMesh.rotation.y = 0.9;
  visualTargetMesh.rotation.y = 0.9;

  playerMesh.add(cameraGame);
  cameraGame.position.set(0, 3.5, -4);
  cameraGame.lookAt(new THREE.Vector3(0, 1.5, 1).add(playerMesh.position));

  const cameraGameWorldPos = new THREE.Vector3();
  cameraGame.getWorldPosition(cameraGameWorldPos);
  const cameraGameWorldQuat = new THREE.Quaternion();
  cameraGame.getWorldQuaternion(cameraGameWorldQuat);
  

  playerMesh.remove(cameraGame);

  cameraGame.position.copy(cameraGameWorldPos);
  cameraGame.quaternion.copy(cameraGameWorldQuat);



  const treeLeftBorn = scene.getObjectByName('游戏-树出生点01');
  const treeLeftEnd = scene.getObjectByName('游戏-树结束点01');

  const treeRightBorn = scene.getObjectByName('游戏-树出生点02');
  const treeRightEnd = scene.getObjectByName('游戏-树结束点02');

  gltfLoader.load('tree01.glb', (treeLeftGltf) => {
    const treeType01 = treeLeftGltf.scene;

    treeType01.traverse(child => {
      child.receiveShadow = true;
      child.castShadow = true;
    })

    let treeCount = 8;
    const curLeftPos = new THREE.Vector3();
    const curRightPos = new THREE.Vector3();
    let scaleRandom;

    // 左侧树
    for (let i = 0; i < treeCount; i++) {
      curLeftPos.lerpVectors(treeLeftBorn.position, treeLeftEnd.position, i / treeCount);
      const treeLeftClone = treeType01.clone();
      scaleRandom = Math.random() / 2 + 0.7;
      treeLeftClone.scale.set(scaleRandom, scaleRandom, scaleRandom);
      treeLeftClone.position.copy(curLeftPos);
      scene.add(treeLeftClone);

      gsap.to(treeLeftClone.position, {
        x: treeLeftEnd.position.x,
        y: treeLeftEnd.position.y,
        z: treeLeftEnd.position.z,
        duration: 8 - i,
        ease: 'none',
        onComplete: () => {
          treeLeftClone.position.copy(treeLeftBorn.position);

          gsap.to(treeLeftClone.position, {
            x: treeLeftEnd.position.x,
            y: treeLeftEnd.position.y,
            z: treeLeftEnd.position.z,
            duration: 8,
            ease: 'none',
            repeat: -1
          })
        }
      })
    }

    // 右侧树
    for (let i = 0; i < treeCount; i++) {
      curRightPos.lerpVectors(treeRightBorn.position, treeRightEnd.position, i / treeCount);
      const treeRightClone = treeType01.clone();
      scaleRandom = Math.random() / 2 + 0.7;
      treeRightClone.scale.set(scaleRandom, scaleRandom, scaleRandom);
      treeRightClone.position.copy(curRightPos);
      scene.add(treeRightClone);

      gsap.to(treeRightClone.position, {
        x: treeRightEnd.position.x,
        y: treeRightEnd.position.y,
        z: treeRightEnd.position.z,
        duration: 8 - i,
        ease: 'none',
        onComplete: () => {
          treeRightClone.position.copy(treeRightBorn.position);

          gsap.to(treeRightClone.position, {
            x: treeRightEnd.position.x,
            y: treeRightEnd.position.y,
            z: treeRightEnd.position.z,
            duration: 8,
            ease: 'none',
            repeat: -1
          })
        }
      })
    }


    const energyBallCount = 4;
    const energyBallTexture = textureLoader.load('energyBall.png');
    const energyBallGeo = new THREE.PlaneGeometry(1, 1);
    const energyBallMat = new THREE.MeshBasicMaterial({map: energyBallTexture, transparent: true, side: THREE.DoubleSide});
    
    const energyBallLeftBorn = scene.getObjectByName('游戏-能量球出生点01');
    const energyBallLeftEnd = scene.getObjectByName('游戏-能量球结束点01');
    for (let i = 0; i < energyBallCount; i++) {
      if (Math.random() < 0.1) { continue; }

      const energyBallClone = new THREE.Mesh(energyBallGeo, energyBallMat);
      energyBallClone.rotateY(1);
      energyBallClone.visible = false;
      scene.add(energyBallClone);
      energyBallClone.position.copy(energyBallLeftBorn.position);

      if ( i == 1) {
        energyBallClone.material = energyBallClone.material.clone();
        energyBallClone.material.color = new THREE.Color(0, 1, 0);
        energyBallClone.userData['speed'] = 0.2;
      }
      if ( i == 3) {
        energyBallClone.material = energyBallClone.material.clone();
        energyBallClone.material.color = new THREE.Color(1, 0, 0);
        energyBallClone.userData['speed'] = -0.4;
      }
  
      gsap.to(energyBallClone.position, {
        x: energyBallLeftEnd.position.x,
        y: energyBallLeftEnd.position.y,
        z: energyBallLeftEnd.position.z,
        duration: 4,
        delay: i,
        ease: 'none',
        repeat: -1,
        onStart: () => {
          energyBallClone.visible = true;
        },
        onUpdate: () => {
          checkEnergyCollision(energyBallClone, visualTargetMesh);
        },
        onRepeat: () => {
          energyBallClone.visible = true;
        }
      })
      gsap.to(energyBallClone.rotation, {
        z: Math.PI * 2,
        duration: Math.random() * 2 + 2,
        ease: 'none',
        repeat: -1
      })
    }
  
    const energyBallRightBorn = scene.getObjectByName('游戏-能量球出生点02');
    const energyBallRightEnd = scene.getObjectByName('游戏-能量球结束点02');
    for (let i = 0; i < energyBallCount; i++) {
      if (Math.random() < 0.1) { continue; }

      const energyBallClone = new THREE.Mesh(energyBallGeo, energyBallMat);
      energyBallClone.rotateY(1);
      energyBallClone.visible = false;
      scene.add(energyBallClone);
      energyBallClone.position.copy(energyBallRightBorn.position);

      if ( i == 0) {
        energyBallClone.material = energyBallClone.material.clone();
        energyBallClone.material.color = new THREE.Color(0, 1, 0);
        energyBallClone.userData['speed'] = 0.2;
      }
      if ( i == 2) {
        energyBallClone.material = energyBallClone.material.clone();
        energyBallClone.material.color = new THREE.Color(1, 0, 0);
        energyBallClone.userData['speed'] = -0.4;
      }
  
      gsap.to(energyBallClone.position, {
        x: energyBallRightEnd.position.x,
        y: energyBallRightEnd.position.y,
        z: energyBallRightEnd.position.z,
        duration: 4,
        delay: i,
        ease: 'none',
        repeat: -1,
        onStart: () => {
          energyBallClone.visible = true;
        },
        onUpdate: () => {
          checkEnergyCollision(energyBallClone, visualTargetMesh);
        },
        onRepeat: () => {
          energyBallClone.visible = true;
        }
      })
      gsap.to(energyBallClone.rotation, {
        z: Math.PI * 2,
        duration: Math.random() * 2 + 2,
        ease: 'none',
        repeat: -1
      })
    }

  })


}

let curGameSpeed = 1;
function checkEnergyCollision(energyMesh, visualTargetMesh) {
  const energyBox3 = new THREE.Box3().setFromObject(energyMesh);
  const playerBox3 = new THREE.Box3().setFromObject(visualTargetMesh);

  // scene.add(new THREE.Box3Helper(energyBox3))
  // scene.add(new THREE.Box3Helper(playerBox3))

  if(energyBox3.intersectsBox(playerBox3) && energyMesh.uuid !== pickedEnergyUUid){
      console.log('碰到了~~~');
      pickedEnergyUUid = energyMesh.uuid;
      energyMesh.visible = false;

      const speed = energyMesh.userData['speed'];
      
      if ((speed < 0 && curGameSpeed > 1) || (speed > 0 && curGameSpeed < 4)) {
        curGameSpeed += speed;
        gsap.globalTimeline.timeScale(curGameSpeed);
        actionRun.timeScale = curGameSpeed;
      }
  }
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
  const material = new THREE.PointsMaterial({color: 0xffffff, map: texture, transparent: true, depthWrite: false});
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
let cameraWorldPos = new THREE.Vector3();
let cameraWorldQuat = new THREE.Quaternion();
let sphereInnerMesh;

function checkRaycaster() {
  pointThreejs.x = (pointScreen.x / window.innerWidth) * 2 - 1;
  pointThreejs.y = (pointScreen.y / window.innerHeight) * -2 + 1;
  // console.log(pointThreejs.x, pointThreejs.y);

  if (camera.visible) {
    raycaster.setFromCamera(pointThreejs, camera);
  }
  if (cameraFly.visible) {
    raycaster.setFromCamera(pointThreejs, cameraFly);
  }
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

  // 进入车内
  if (intersects.length && (intersects[0].object.userData['ORVFatherDoorObj'] || intersects[0].object === spritelEnter)) {
    nameLabel.visible = false;

    playerInSceneCanRaycast = [...canRaycastMeshes];
    canRaycastMeshes.length = 0;
    canRaycastMeshes.push(spritelExit);

    const ORVLeftDoor = scene.getObjectByName('越野车01-车门-左');
    if (!intersects[0].object.userData['isOpen'] && !intersects[0].object.userData['isOpening']) {
      intersects[0].object.userData['isOpening'] = true;
      spritelEnter.visible = false;
      // ORVLeftDoor.rotateY(-1.2);
      gsap.to(ORVLeftDoor.rotation, {
        y: -1.2,
        duration: 1,
        onComplete:() => {
          camera.getWorldPosition(cameraWorldPos);
          camera.getWorldQuaternion(cameraWorldQuat);
          const cameraFlyCurve = new THREE.CatmullRomCurve3( [
            cameraWorldPos,
            scene.getObjectByName('越野车01-车外目标').position,
            scene.getObjectByName('越野车01-车内目标').position,
          ], false );
          
          // const points = cameraFlyCurve.getPoints( 50 );
          // const geometry = new THREE.BufferGeometry().setFromPoints( points );
          
          // const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
          
          // Create the final object to add to the scene
          // const curveObject = new THREE.Line( geometry, material );
          // scene.add(curveObject);

          cameraFly.position.copy(cameraWorldPos);
          cameraFly.quaternion.copy(cameraWorldQuat);
          camera.visible = false;
          cameraFly.visible = true;

          let cameraFlyPosTmp;
          const ORVLookAtTarget = scene.getObjectByName('越野车01-注视目标');

          const stepObj = {step: 0};
          gsap.to(stepObj, {
            step: 1000,
            duration: 4,
            onUpdate: () => {
              cameraFlyPosTmp = cameraFlyCurve.getPointAt(stepObj.step / 1000);
              cameraFly.position.copy(cameraFlyPosTmp);
              cameraFly.lookAt(ORVLookAtTarget.position);
            },
            onComplete: () => {
              gsap.to(ORVLeftDoor.rotation, {
                y: 0,
                duration: 1
              })
              intersects.forEach(item => {
                item.object.userData['isOpen'] = false;
              });

              const ORV = scene.getObjectByName('越野车01');
              ORV.visible = false;
              
              // const ORVInnerMap = new THREE.TextureLoader().load('carInnerBg.jpg');
              if (!sphereInnerMesh) {
                new THREE.TextureLoader().load('carInnerBg.jpg', ORVInnerMap => {
                  spritelExit.visible = true;
                  ORVInnerMap.encoding = THREE.sRGBEncoding;
                  const sphereGeo = new THREE.SphereGeometry(1.5);
                  const sphereMat = new THREE.MeshBasicMaterial({side: THREE.DoubleSide, map: ORVInnerMap});
                  sphereInnerMesh = new THREE.Mesh(sphereGeo, sphereMat);
                  scene.add(sphereInnerMesh);
                  sphereInnerMesh.position.copy(scene.getObjectByName('越野车01-车内目标').position);
                })
              } else {
                sphereInnerMesh.visible = true;
                spritelExit.visible = true;
              }
              intersects[0].object.userData['isOpening'] = false;
            }
          })
        }
      })
      intersects.forEach(item => {
        item.object.userData['isOpen'] = true;
      });
    } else {
      // ORVLeftDoor.rotateY(1.2);
      // gsap.to(ORVLeftDoor.rotation, {
      //   y: 0,
      //   duration: 1
      // })
      // intersects.forEach(item => {
      //   item.object.userData['isOpen'] = false;
      // });
    }
  }

  // 离开车内
  if (intersects.length && intersects[0].object === spritelExit) {
    nameLabel.visible = true;
    
    canRaycastMeshes = [...playerInSceneCanRaycast];

    sphereInnerMesh.visible = false;
    const ORV = scene.getObjectByName('越野车01');
    ORV.visible = true;

    camera.visible = true;
    cameraFly.visible = false;

    spritelEnter.visible = true;
    spritelExit.visible = false;
  }

  // 调色板
  if (intersects.length && intersects[0].object.name === 'spritelTsb') {
    toggleTsb();
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
  camera.position.set(0, 5, -6);
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
let gamePlayerPos = 0; // 角色位置 -1:左边 0:中间 1:右边
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
      raycasterFront.camera = camera;
      const collisionFront = raycasterFront.intersectObjects(canRaycastMeshes);
      // console.log(collisionFront);
      if (collisionFront && collisionFront.length && collisionFront[0].distance < 1.5) {
        return ;
      }
  
      // 向上
      const raycasterUp = new THREE.Raycaster(playerMesh.position, playerUpVec);
      raycasterUp.camera = camera;
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
      raycasterDown.camera = camera;
      const collisionDown = raycasterDown.intersectObjects(canRaycastMeshes);
      // console.log(collisionDown);
      if (collisionDown && collisionDown.length && collisionDown[0].distance < 0.6) {
        playerMesh.position.setY(collisionDown[0].point.y);
      }
    }


  }

  if (gamePlayerPos > -1 && keycode.key === 'ArrowLeft') {
    playerMesh.translateX(2.3);
    visualTargetMesh.translateX(2.3);
    gamePlayerPos--;
  }
  if (gamePlayerPos < 1 && keycode.key === 'ArrowRight') {
    playerMesh.translateX(-2.3);
    visualTargetMesh.translateX(-2.3);
    gamePlayerPos++;
  }
})

let mousedownOffsetX, mousedownOffsetY;
let isKeyWDown = false;
window.addEventListener('mousedown', e => {
  if (e.button === 0) {
    // 鼠标左键按下
    isKeyWDown = true;
    preScreenX = undefined;
    preScreenY = undefined;

    mousedownOffsetX = e.clientX;
    mousedownOffsetY = e.clientY;
  }
})
window.addEventListener('mouseup', e => {
  if (e.button === 0) {
    // 鼠标左键抬起
    isKeyWDown = false;

    mousedownOffsetX = e.clientX - mousedownOffsetX;
    mousedownOffsetY = e.clientY - mousedownOffsetY;

    if (Math.abs(mousedownOffsetX) < 5 && Math.abs(mousedownOffsetY) < 5) {
      checkRaycaster();
    }
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

  if (isKeyWDown && cameraFly.visible) {
    if (preScreenX) {
      mouseOffsetScreenX = e.clientX - preScreenX;
      // cameraFly.rotateY(-mouseOffsetScreenX * deltaTime);
      cameraFly.rotateOnWorldAxis(yAxis, -mouseOffsetScreenX * deltaTime);
    }
    preScreenX = e.clientX;
    if (preScreenY) {
      mouseOffsetScreenY = e.clientY - preScreenY;
      cameraFly.rotateX(-mouseOffsetScreenY * deltaTime);
    }
    preScreenY = e.clientY;
  }

  if (isKeyWDown && camera.visible) {
    if (preScreenX) {
      mouseOffsetScreenX = e.clientX - preScreenX;
      // if (mouseOffsetScreenX > 0) {
      //   visualTargetMesh.rotateOnWorldAxis(yAxis, -3 * deltaTime);
      // } 
      // if (mouseOffsetScreenX < 0){
      //   visualTargetMesh.rotateOnWorldAxis(yAxis, 3 * deltaTime);
      // }
      visualTargetMesh.rotateOnWorldAxis(yAxis, -0.3 * mouseOffsetScreenX * deltaTime);
    }
    preScreenX = e.clientX;
  
    if (preScreenY) {
      camera.getWorldPosition(caneraYVec);
      mouseOffsetScreenY = e.clientY - preScreenY;
      // if (mouseOffsetScreenY > 0) {
      //   if (caneraYVec.y < 5) {
      //     visualTargetMesh.rotateX(0.8 * deltaTime);
      //   }
      // } 
      // if (mouseOffsetScreenY < 0){
      //   if (caneraYVec.y > 0.8) {
      //     visualTargetMesh.rotateX(-0.8 * deltaTime);
      //   }
      // }

      if (visualTargetMesh){
        if ((mouseOffsetScreenY > 0 && caneraYVec.y < 5) || (mouseOffsetScreenY < 0 && caneraYVec.y > 0.8)) {
          visualTargetMesh.rotateX(0.08 * mouseOffsetScreenY * deltaTime);
        }
      }
    }
    preScreenY = e.clientY;
  }
})

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  cameraFly.aspect = window.innerWidth / window.innerHeight;
  cameraFly.updateProjectionMatrix();

  cameraGame.aspect = window.innerWidth / window.innerHeight;
  cameraGame.updateProjectionMatrix();
})

// window.addEventListener('click', e => {
//   checkRaycaster();
// })

// 帧循环
function animate(){
  requestAnimationFrame(animate);

  if (camera.visible) {
    renderer.render(scene,camera);
  }

  if (cameraFly.visible) {
    renderer.render(scene,cameraFly);
  }

  if (cameraGame.visible) {
    renderer.render(scene,cameraGame);
  }

  if (labelRenderer) {
    labelRenderer.render(scene, camera);
  }
  
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

  if (mixerDancer01 && mixerDancer02 && mixerDancer03) {
    mixerDancer01.update(deltaTime);
    mixerDancer02.update(deltaTime);
    mixerDancer03.update(deltaTime);
  }
}


animate();
