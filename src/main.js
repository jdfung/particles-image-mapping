import './styles/style.css';
import * as THREE from 'three';
import chainImage from './assets/image/chain.png'
import iegao from './assets/image/iegao.png'
import bim from './assets/image/bim.png'
import iot from './assets/image/iot.png'
import disc from './assets/texture/disc.png'
import gsap from 'gsap';

let scene, camera, renderer, particles, particlePositions;
let mouseX = 0, mouseY = 0;
const spreadStrength = 20;
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

function loadImageCreateParticles(imagePath, initialColor = new THREE.Color(0, 0, 1)) {
  const loader = new THREE.TextureLoader();
  loader.load(imagePath, function(texture) {
    console.log("image loaded");

    const img = texture.image;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const canvas = document.createElement('canvas');
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, imgWidth, imgHeight);

    const imageData = context.getImageData(0, 0, imgWidth, imgHeight);
    const data = imageData.data;

    const positions = [];
    const targetPos = [];
    const colors = [];

    const darkBlue = new THREE.Color(0x00008B);
    const lightBlue = new THREE.Color('#0096FF');
    const yellow = new THREE.Color(0xFFFF00);

    const gap = 1;
    
    for (let y = 0; y < imgHeight; y+=2) {
      for (let x = 0; x < imgWidth; x+=2) {
        const index   = (y * imgWidth + x) * 4;
        //rgb of the loaded img data
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const a = data[index + 3];

        if (a > 128) { // Only get the pos of visible pixels
          const posX = (x - imgWidth / 2) * gap;
          const posY = (-y + imgHeight / 2) * gap;
          // const posZ = 0;

          //initial randomize pos
          positions.push(
            Math.random() * window.innerWidth - window.innerWidth / 2,
            Math.random() * window.innerHeight - window.innerHeight / 2,
            Math.random() * 500 - 250
          );

          targetPos.push(posX, posY, 0)
          // colors.push(initialColor.r, initialColor.g, initialColor.b);

          /* spread color left, middle, right equally */
          // const leftRange = imgWidth / 3
          // const rightRange = 2 * imgWidth / 3
          // let color;
          // if (x < leftRange) {
          //   color = darkBlue;
          // } else if (x < rightRange) {
          //   color = yellow;
          // } else {
          //   color = lightBlue;
          // }

          /* spread color in a radius, outermost, middle, and innermost */
          const maxDistance = Math.sqrt(Math.pow(imgWidth / 2, 2) + Math.pow(imgHeight / 2, 2));
          const innerRadius = maxDistance * 0.20;
          const middleRadius = maxDistance * 0.30;

           // Calculate distance from the center
           const distanceFromCenter = Math.sqrt(posX * posX + posY * posY);

           // Assign color based on distance
           let color;
           if (distanceFromCenter < innerRadius) {
             color = darkBlue;
           } else if (distanceFromCenter < middleRadius) {
             color = lightBlue;
           } else {
             color = yellow;
           }

          colors.push(color.r, color.g, color.b);

          // const darkBlueParticles = [];
          // const lightBlueParticles = [];
          // const yellowParticles = [];
          
          // const randomNum = Math.random();
          // if (randomNum < 1 / 3) {
          //   darkBlueParticles.push([darkBlue.r, darkBlue.g, darkBlue.b]);
          // } else if (randomNum < 2 / 3) {
          //   lightBlueParticles.push([lightBlue.r, lightBlue.g, lightBlue.b]);
          // } else {
          //   yellowParticles.push([yellow.r, yellow.g, yellow.b]);
          // }

          // /* Randomize the color distribution */
          // const totalParticles = darkBlueParticles.length + lightBlueParticles.length + yellowParticles.length;
          // const particlesPerColor = Math.floor(totalParticles / 3);
          // const remainder = totalParticles % 3;
      
          // for (let i = 0; i < particlesPerColor; i++) {
          //   if (i < darkBlueParticles.length) colors.push(...darkBlueParticles[i]);
          //   if (i < lightBlueParticles.length) colors.push(...lightBlueParticles[i]);
          //   if (i < yellowParticles.length) colors.push(...yellowParticles[i]);
          // }
      
          // // Add the remainder particles
          // for (let i = 0; i < remainder; i++) {
          //   if (i < darkBlueParticles.length) colors.push(...darkBlueParticles[particlesPerColor + i]);
          //   else if (i < lightBlueParticles.length) colors.push(...lightBlueParticles[particlesPerColor + i]);
          //   else if (i < yellowParticles.length) colors.push(...yellowParticles[particlesPerColor + i]);
          // }
        }
      }
    }


    const geometry = new THREE.BufferGeometry();
    const sprite = new THREE.TextureLoader().load(disc);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8, sizeAttenuation: true, map: sprite, vertexColors: true, alphaTest: 0.5, transparent: true
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
        const easing = (t) => t * t * (3 - 2 * t);
        // positions[index] += (posX - mouseX * window.innerWidth / 2) * spreadFactor * spreadStrength;
        // positions[index + 1] += (posY - mouseY * window.innerHeight / 2) * spreadFactor * spreadStrength;

        const targetX = posX + (posX - mouseX * window.innerWidth / 2) * spreadFactor * spreadStrength;
        const targetY = posY + (posY - mouseY * window.innerHeight / 2) * spreadFactor * spreadStrength;

        positions[index] = THREE.MathUtils.lerp(posX, targetX, easing(0.1));
        positions[index + 1] = THREE.MathUtils.lerp(posY, targetY, easing(0.1));
      } else {
        //random particle scattering effect
        if (Math.random() < scatterRate) {
          const scatterSpeed = 0.02 //change to 0 if dont want the random spread
          const targetX = Math.random() * window.innerWidth - window.innerWidth / 2;
          const targetY = Math.random() * window.innerHeight - window.innerHeight / 2;

          //  Move the particle towards the target position
          positions[index] += (targetX - posX) * scatterSpeed;
          positions[index + 1] += (targetY - posY) * scatterSpeed;
        } else {
          // move back to ori position if not in the scatter area
          // positions[index] += (particlePositions[index] - posX) * 0.02;
          // positions[index + 1] += (particlePositions[index + 1] - posY) * 0.02;
          positions[index] = THREE.MathUtils.lerp(posX, particlePositions[index], 0.03);
          positions[index + 1] = THREE.MathUtils.lerp(posY, particlePositions[index + 1], 0.03);
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

button.onclick = () => {
  const arrImg = [iegao, bim, iot, chainImage]
  if(scene.children.length > 0){ 
    scene.remove(scene.children[0]); 
  }
  loadImageCreateParticles(arrImg[imgIndex], new THREE.Color('#0000FF'));
  imgIndex++;
  if(imgIndex >= arrImg.length)
  {
    imgIndex = 0;
  }
}
