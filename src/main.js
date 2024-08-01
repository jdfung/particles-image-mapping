import './styles/style.css';
import * as THREE from 'three';
import chainImage from './chain.png'
import iegao from './iegao.png'
import gsap from 'gsap';

let scene, camera, renderer, particles, particlePositions;
let mouseX = 0, mouseY = 0;
const spreadStrength = 10;
let isMouseOver = false;
const scatterRate = 0.003;
const button = document.getElementById('button');
const button2 = document.getElementById('button2');

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.setZ(500);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.querySelector('#bg').appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', onDocumentMouseMove, false);

  // loadImageCreateParticles(iegao);
  loadImageCreateParticles(chainImage);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  isMouseOver = true;
}

function loadImageCreateParticles(imagePath) {
  const loader = new THREE.TextureLoader();
  loader.load(imagePath, function(texture) {
    console.log("image loaded");

    const img = texture.image;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const canvas = document.createElement('canvas');
    // const canvas = document.querySelector('#bg');
    // canvas.className = 'testing'
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, imgWidth, imgHeight);

    const imageData = context.getImageData(0, 0, imgWidth, imgHeight);
    const data = imageData.data;

    const positions = [];
    const targetPos = [];
    const colors = [];
    
    // let index = 0;
    for (let y = 0; y < imgHeight; y+=2) {
      for (let x = 0; x < imgWidth; x+=2) {
        const index   = (y * imgWidth + x) * 4;
        //rgb of the loaded img data
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];

        if (a > 128) { // Only get the pos of visible pixels
          const posX = x - imgWidth / 2;
          const posY = -y + imgHeight / 2;
          // const posZ = 0;

          //initial randomize pos
          positions.push(
            Math.random() * window.innerWidth - window.innerWidth / 2,
            Math.random() * window.innerHeight - window.innerHeight / 2,
            Math.random() * 500 - 250
          );

          targetPos.push(posX, posY, 0)
          colors.push(r / 255, g / 255, b / 255);
        }
      }
    }


    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
    })
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    console.log('Particles created and added to the scene.');

    particlePositions = targetPos;
    animateParticlesToImg(targetPos);
  }, undefined,
  (error) => {console.error(error)})
}

function animateParticlesToImg(targetPositions) {
  const positions = particles.geometry.attributes.position.array;
  gsap.to(positions, {
    duration: 3,
    endArray: targetPositions,
    ease: "power2.inOut",
    onUpdate: () => {
      particles.geometry.attributes.position.needsUpdate = true;
    },
    
  });
}


function setParticleColor(color) {
  if (particles) {
    const colors = particles.geometry.attributes.color.array;
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    particles.geometry.attributes.color.needsUpdate = true;
  }
}

function animate() {
  requestAnimationFrame(animate);

  updateParticles();
 
  render();
}

function updateParticles() {
  if (particles) {
    const positions = particles.geometry.attributes.position.array;

    for (let i = 0; i < positions.length / 3; i++) {
      const index = i * 3;
      const posX = positions[index];
      const posY = positions[index + 1];
      const distance = Math.sqrt(
        Math.pow(posX - mouseX * window.innerWidth / 2, 2) +
        Math.pow(posY - mouseY * window.innerHeight / 2, 2)
      );

      // on mouse contact push particles away
      const spreadRadius = 50;
      if (distance < spreadRadius) {
        const spreadFactor = 1 - (distance / spreadRadius);
        positions[index] += (posX - mouseX * window.innerWidth / 2) * spreadFactor * spreadStrength;
        positions[index + 1] += (posY - mouseY * window.innerHeight / 2) * spreadFactor * spreadStrength;
      } else {
        //random particle scattering effect
        if (Math.random() < scatterRate) {
          const scatterSpeed = 0.05
          const targetX = Math.random() * window.innerWidth - window.innerWidth / 2;
          const targetY = Math.random() * window.innerHeight - window.innerHeight / 2;

          //  Move the particle towards the target position
          positions[index] += (targetX - posX) * scatterSpeed;
          positions[index + 1] += (targetY - posY) * scatterSpeed;
        } else {
          // move back to ori position if not in the scatter area
          positions[index] += (particlePositions[index] - posX) * 0.03;
          positions[index + 1] += (particlePositions[index + 1] - posY) * 0.03;
        }
      }
    }

    particles.geometry.attributes.position.needsUpdate = true;
  }
}

function render() {
  renderer.render(scene, camera);
}


let imgIndex = 0;
let colorIndex = 0;
button.onclick = () => {
  const arrImg = [iegao, chainImage]
  if(scene.children.length > 0){ 
    scene.remove(scene.children[0]); 
  }
  loadImageCreateParticles(arrImg[imgIndex]);
  imgIndex++;
  if(imgIndex >= arrImg.length)
  {
    imgIndex = 0;
  }
}

button2.onclick = () => {
  const arr = ['#0000FF', '#ADD8E6', '#FFFF00']
  setParticleColor(new THREE.Color(arr[colorIndex]));
  colorIndex++;
  if(colorIndex >= arr.length)
  {
    colorIndex = 0;
  }
}