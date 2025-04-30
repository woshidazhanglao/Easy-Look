const THREE = require('three');
const { OBJLoader } = require('three/examples/jsm/loaders/OBJLoader.js');
const { OrbitControls } =require('three/examples/jsm/controls/OrbitControls.js');

let scene, camera, renderer, model,controls;

function init() {
  const canvas = document.getElementById('threeCanvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x202020);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(3, 0, 0); 
  camera.lookAt(0, 0, 0); 

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  const ambientLight = new THREE.AmbientLight(0x404040, 3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
  directionalLight.position.set(0,0,1).normalize();
  scene.add(directionalLight);
  
  directionalLight.target.position.set(0, 0, 0);
  scene.add(directionalLight.target);

  animate();
}

function animate() {
  requestAnimationFrame(animate);

  controls.update();

   const zoomSlider = document.getElementById('zoomSlider');
   const distance = camera.position.length();
   const sliderValue = distance * 10;        
 
   if (Math.abs(sliderValue - zoomSlider.value) > 0.5) {
     zoomSlider.value = sliderValue;
   }

  renderer.render(scene, camera);
}

const zoomSlider = document.getElementById('zoomSlider');
zoomSlider.addEventListener('input', () => {
  const value = parseFloat(zoomSlider.value);
  camera.position.set(value / 10, 0, 0);
  camera.lookAt(0, 0, 0);
});

function loadOBJ(file) {
  const loader = new OBJLoader();
  const reader = new FileReader();

  reader.onload = function(event) {
    const text = event.target.result;
    const object = loader.parse(text);
    if (model) {
      scene.remove(model);
    }
    model = object;

    scene.add(model);
  };

  reader.readAsText(file);
}

function generateAndApplyNormalMap(obj, textureImage) {
  const normalMapDataURL = generateNormalMapFromTexture(textureImage);

  obj.traverse(function (child) {
    if (child.isMesh) {
      applyNormalMapToMaterial(child, normalMapDataURL);
    }
  });
}

function generateNormalMapFromTexture(textureImage) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = textureImage.width;
  const height = textureImage.height;
  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(textureImage, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const normalData = ctx.createImageData(width, height);
  const normalPixels = normalData.data;

  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  function getLuminanceAt(x, y) {
    const i = (y * width + x) * 4;
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let dx = 0, dy = 0;

      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const weightX = sobelX[(j + 1) * 3 + (i + 1)];
          const weightY = sobelY[(j + 1) * 3 + (i + 1)];
          const lum = getLuminanceAt(x + i, y + j);
          dx += lum * weightX;
          dy += lum * weightY;
        }
      }

      const dz = 1.0;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = dx / len;
      const ny = dy / len;
      const nz = dz / len;

      const index = (y * width + x) * 4;
      normalPixels[index] = Math.floor((nx + 1) * 0.5 * 255);
      normalPixels[index + 1] = Math.floor((ny + 1) * 0.5 * 255);
      normalPixels[index + 2] = Math.floor((nz + 1) * 0.5 * 255);
      normalPixels[index + 3] = 255;
    }
  }

  ctx.putImageData(normalData, 0, 0);
  return canvas.toDataURL();
}

function applyNormalMapToMaterial(mesh, normalMapDataURL) {
  const loader = new THREE.TextureLoader();
  loader.load(normalMapDataURL, (normalMap) => {
    const oldMap = mesh.material.map;

    mesh.material = new THREE.MeshStandardMaterial({
      map: oldMap || null,
      normalMap: normalMap,
      metalness: 0.5,
      roughness: 0.5
    });

    mesh.material.needsUpdate = true;
  });
}

function loadTexture(url,textureLoader) {
      textureLoader.load(url, (texture) => {
        if (model) {
          model.traverse((child) => {
            if (child.isMesh) {
              const existingNormalMap = child.material.normalMap;

              const nowMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,           
                map: texture,             
                shininess: 50,            
                specular: new THREE.Color(0.5, 0.5, 0.5), 
                normalMap: existingNormalMap || null,    
              });

              child.material = nowMaterial;
              child.material.needsUpdate = true; 
            }
          });
        }
      });
    };
  
const workflow = {
  "prompt": {}
};

async function comfyuiStyleTransfer(contentFile, styleFile) {
    const contentFormData = new FormData();
    contentFormData.append('image', contentFile);
  
    const contentUploadResp = await fetch('http://localhost:8188/upload/image', {
      method: 'POST',
      body: contentFormData
    });
    const contentData = await contentUploadResp.json();
    const contentImagePath = contentData.name;  
  
    const styleFormData = new FormData();
    styleFormData.append('image', styleFile);
  
    const styleUploadResp = await fetch('http://localhost:8188/upload/image', {
      method: 'POST',
      body: styleFormData
    });
    const styleData = await styleUploadResp.json();
    const styleImagePath = styleData.name; 
  
    console.log('上传完成', contentImagePath, styleImagePath);
  
    const processResp = await fetch('http://localhost:8188/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
  
    const processData = await processResp.json();
    console.log('处理完成:', processData);

    const promptId = processData.prompt_id;
  
    const resultImageUrl= await waitResult(promptId);
  
    console.log('风格化完成，图片地址:', resultImageUrl);
    return resultImageUrl;
  }

async function waitResult(promptId) {
    const startTime = Date.now();
    const timeout = 3000000; 
    let firstTry = true;

    while (true) {
      const resp = await fetch(`http://localhost:8188/history/${promptId}`);
      const data = await resp.json();

      console.log('history返回:', data);

      const result = data[promptId];
      if (result && result.outputs && result.outputs["9"] && result.outputs["9"].images.length > 0) {
        console.log('找到生成的图片:', result.outputs["9"].images[0].filename);
        const filename = result.outputs["9"].images[0].filename;
        return `http://localhost:8188/view?filename=${encodeURIComponent(filename)}`;
      }

      if (Date.now() - startTime > timeout) {
        throw new Error('等待超时，没有拿到图片输出');
      }

      await new Promise(r => setTimeout(r, firstTry ? 500 : 1000));
      firstTry = false;
    }
  }

window.onload = () => {
  init();

  document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      loadOBJ(file);
    }
  });

  document.getElementById('textureInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
  
      const textureImage = new Image();
      textureImage.src=file.name;
      textureImage.onload = function () {
        generateAndApplyNormalMap(model, textureImage);
      };

      reader.onload = function(event) {
        const imageUrl = event.target.result;
        const textureLoader = new THREE.TextureLoader();
        loadTexture(imageUrl,textureLoader);
      }
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('workflowInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const jsonContent = JSON.parse(e.target.result);
          workflow.prompt=jsonContent;
        } catch (err) {
          console.error("JSON 解析失败：", err);
        }
      };
    
      reader.onerror = function() {
        console.error("文件读取出错");
      };
    
      reader.readAsText(file);
    }
  });

  document.getElementById('btnTransfer').addEventListener('click',(e)=>{
    const contentFile = document.getElementById('textureInput').files[0];
    const styleFile = document.getElementById('styleInput').files[0];

    comfyuiStyleTransfer(contentFile, styleFile)
    .then(url => {
        document.getElementById('resultImage').src = url;
        console.log('图片为：${url}')

        const textureLoader = new THREE.TextureLoader();
        loadTexture(url,textureLoader);
    });
  })

  document.getElementById('resultImage').addEventListener('load',()=>{
    console.log('66')
    if(document.getElementById('resultImage').src&&document.getElementById('resultImage').src!==window.location.href){
      document.getElementById('resultText').style.display='inline';
    }
  })
};