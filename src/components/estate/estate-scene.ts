import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sky } from "three/addons/objects/Sky.js";

// Illustrative coordinates in the original Blender study, not surveyed positions.
const views = [
  { target: [10, 70, -56], zoom: 1.7 },
  { target: [-14, 57, -32], zoom: 1.5 },
  { target: [0, 36, -12], zoom: 1.45 },
  { target: [-22, 27, 2], zoom: 2 },
  { target: [-9, 2, 28], zoom: 2 },
  { target: [-565, 160, -250], zoom: .72, regional: true },
];
const overview = new THREE.Vector3(-150, 125, -75);
const viewingDirection = new THREE.Vector3(123, 103, 179);
const coastalDirection = new THREE.Vector3(480, 130, 570);

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const bitmaps = new Set<ImageBitmap>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
      }
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) textures.add(value);
    }
    material.dispose();
  });
  textures.forEach((texture) => {
    if (typeof ImageBitmap !== "undefined" && texture.source.data instanceof ImageBitmap) {
      bitmaps.add(texture.source.data);
    }
    texture.dispose();
  });
  bitmaps.forEach((bitmap) => bitmap.close());
}

export async function createEstateScene(host: HTMLElement, signal: AbortSignal, onFailure: () => void) {
  const response = await fetch("/models/la-fenice-study.glb", { signal });
  if (!response.ok) throw new Error("Estate model unavailable");
  const data = await response.arrayBuffer();
  signal.throwIfAborted();
  const manager = new THREE.LoadingManager();
  const draco = new DRACOLoader(manager).setDecoderPath("/models/draco/").setWorkerLimit(1);
  // A decoder download can finish just as it is cancelled. Let its queued worker
  // initialization settle before the final disposal, including older fetch implementations.
  manager.onLoad = () => { if (signal.aborted) window.setTimeout(() => draco.dispose(), 0); };
  let abortLoad: () => void = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    abortLoad = () => {
      manager.abort();
      draco.dispose();
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abortLoad, { once: true });
  });
  const parsing = new GLTFLoader(manager).setDRACOLoader(draco).parseAsync(data, "/models/").then((result) => {
    if (signal.aborted) {
      disposeObject(result.scene);
      throw new DOMException("Aborted", "AbortError");
    }
    return result;
  });
  let gltf: GLTF;
  try {
    gltf = await Promise.race([parsing, cancelled]);
  } finally {
    signal.removeEventListener("abort", abortLoad);
    draco.dispose();
  }
  if (signal.aborted) {
    disposeObject(gltf.scene);
    throw new DOMException("Aborted", "AbortError");
  }
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch (error) {
    disposeObject(gltf.scene);
    throw error;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // Buildings and sun are static; only the water animates.
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .85;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#cedde0");
  scene.fog = new THREE.Fog("#cedde0", 1050, 4300);
  const camera = new THREE.PerspectiveCamera(33, 1, 1, 10000);
  camera.position.copy(overview).add(coastalDirection);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(overview);
  controls.enablePan = false;
  controls.enableZoom = false; // wheel and vertical touch remain ordinary page scrolling
  controls.minPolarAngle = .3;
  controls.maxPolarAngle = 1.48;
  controls.minAzimuthAngle = -1.1;
  controls.maxAzimuthAngle = 1.3;
  controls.minZoom = .7;
  controls.maxZoom = 2.7;
  controls.update();
  renderer.domElement.style.touchAction = "pan-y";

  scene.add(new THREE.HemisphereLight(0xe4e9ee, 0x655f53, .70));
  const sun = new THREE.DirectionalLight(0xfff4e5, 2.8);
  sun.position.set(-100, 175, 130);
  sun.target.position.set(0, 35, -10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, far: 400 });
  sun.shadow.normalBias = .12;
  sun.shadow.bias = -.0001;
  scene.add(sun, sun.target);
  const sunDirection = sun.position.clone().sub(sun.target.position).normalize();

  // One baked procedural sky lights the PBR maps; there is no per-frame reflection pass.
  const sky = new Sky();
  sky.scale.setScalar(450);
  Object.assign(sky.material.uniforms.turbidity, { value: 2.5 });
  sky.material.uniforms.rayleigh.value = 1.5;
  sky.material.uniforms.mieCoefficient.value = .003;
  sky.material.uniforms.sunPosition.value.copy(sunDirection);
  sky.material.uniforms.showSunDisc.value = false;
  sky.material.uniforms.cloudCoverage.value = 0;
  const skyScene = new THREE.Scene();
  skyScene.add(sky);
  const environmentGenerator = new THREE.PMREMGenerator(renderer);
  let environment: THREE.WebGLRenderTarget;
  try {
    environment = environmentGenerator.fromScene(skyScene, 0, .1, 1000, { size: 128 });
  } catch (error) {
    controls.dispose();
    disposeObject(gltf.scene);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    throw error;
  } finally {
    environmentGenerator.dispose();
    disposeObject(sky);
  }
  scene.environment = environment.texture;
  scene.environmentIntensity = .08;
  gltf.scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  scene.add(gltf.scene);

  // Bounded analytic waves, not a fluid simulation or measured bathymetry.
  const waves = `
    void wave(vec2 p, vec2 direction, float amplitude, float frequency, float speed,
              inout float height, inout vec2 slope) {
      float phase = dot(p, direction) * frequency + time * speed;
      height += amplitude * sin(phase);
      slope += direction * amplitude * frequency * cos(phase);
    }
    void swell(vec2 p, inout float height, inout vec2 slope) {
      // A slow, bounded phase bend breaks straight stripes; this remains an optical sea.
      vec2 bend = vec2(p.y*.018 + time*.04, p.x*.015 - time*.03);
      vec2 q = p + sin(bend)*3.;
      vec2 localSlope = vec2(0.);
      wave(q, vec2(.96,.28), .12, .13, -.53, height, localSlope);
      wave(q, vec2(.6,-.8), .075, .23, .68, height, localSlope);
      wave(q, vec2(-.28,.96), .04, .41, -.84, height, localSlope);
      wave(q, vec2(-.87,-.49), .045, .19, .37, height, localSlope);
      // Chain rule keeps the surface normal consistent with the bent height field.
      slope += localSlope + localSlope.yx*cos(bend.yx)*vec2(.045,.054);
    }
  `;
  const water = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.lights,
      { time: { value: 0 }, sunDirection: { value: sunDirection }, horizonColor: { value: scene.background.clone() } },
    ]),
    lights: true,
    vertexShader: `
      uniform float time;
      varying vec3 seaPosition;
      #include <common>
      #include <shadowmap_pars_vertex>
      ${waves}
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.);
        float height = 0.;
        vec2 slope = vec2(0.);
        swell(worldPosition.xz, height, slope);
        worldPosition.y += height * (1.-smoothstep(220.,500.,length(worldPosition.xz)));
        seaPosition = worldPosition.xyz;
        vec4 mvPosition = viewMatrix * worldPosition;
        vec3 transformedNormal = normalMatrix * normal;
        gl_Position = projectionMatrix * mvPosition;
        #include <shadowmap_vertex>
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 sunDirection;
      uniform vec3 horizonColor;
      varying vec3 seaPosition;
      #include <common>
      #include <bsdfs>
      #include <lights_pars_begin>
      #include <shadowmap_pars_fragment>
      #include <shadowmask_pars_fragment>
      ${waves}
      void main() {
        vec2 p = seaPosition.xz;
        float height = 0.;
        vec2 slope = vec2(0.);
        swell(p, height, slope);
        // Attenuate sub-pixel capillary waves instead of producing glitter aliasing.
        float footprint = max(length(dFdx(p)), length(dFdy(p)));
        slope *= 1. - smoothstep(1.5, 12., footprint);
        float detail = 1. - smoothstep(.35, 1.8, footprint);
        wave(p, vec2(.8,.6), .027 * detail, 1.17, -1.24, height, slope);
        wave(p, vec2(-.6,.8), .014 * detail, 1.93, 1.51, height, slope);
        wave(p, vec2(.96,-.28), .007 * detail, 3.11, -1.83, height, slope);
        wave(p, vec2(.28,.96), .003 * detail, 4.73, 2.17, height, slope);
        vec3 normal = normalize(vec3(-slope.x, 1., -slope.y));
        vec3 view = normalize(cameraPosition - seaPosition);
        vec3 reflected = reflect(-view, normal);
        float fresnel = .02 + .98 * pow(1. - max(dot(normal, view), 0.), 5.);
        vec3 skyColor = mix(vec3(.55,.66,.71), vec3(.12,.28,.48), pow(max(reflected.y, 0.), .45));
        float shore = (length((p - vec2(-8.,28.)) / vec2(24.,10.)) - 1.) * 10.;
        float depth = smoothstep(0., 62., max(shore, 0.));
        vec3 bodyColor = mix(vec3(.025,.18,.19), vec3(.008,.046,.083), depth);
        float sunVisibility = getShadowMask();
        bodyColor *= mix(.58, 1., sunVisibility);
        // Light ripples are restricted to the shallow cove, not dotted across the sea.
        float caustic = pow(max(0., sin(p.x*1.27+p.y*.47+sin(p.y*.29-time*.6))
          * sin(p.y*1.41-p.x*.38+sin(p.x*.31+time*.43))), 7.);
        bodyColor += vec3(.010,.016,.012) * caustic * (1.-smoothstep(.5,7.,shore)) * sunVisibility;
        vec3 waterColor = mix(bodyColor, skyColor, fresnel);
        float specular = pow(max(dot(normal, normalize(sunDirection + view)), 0.), 48.);
        waterColor += vec3(1.,.94,.84) * specular * .09 * sunVisibility;
        float wash = sin(p.x*.54 + sin(p.y*.32) - time*.85) * .3;
        float foam = (1.-smoothstep(.12,.65,abs(shore-.5-wash))) * smoothstep(-.1,.3,shore);
        foam *= .07 + .045*sin(p.x*1.19+p.y*.83-time*.73);
        waterColor = mix(waterColor, vec3(.64,.72,.67), foam * sunVisibility);
        gl_FragColor = vec4(waterColor,1.);
        #include <tonemapping_fragment>
        // Match the unlit background after tone mapping, hiding the finite sea edge in haze.
        gl_FragColor.rgb = mix(gl_FragColor.rgb, horizonColor, smoothstep(700.,2600.,length(cameraPosition.xz-p)));
        #include <colorspace_fragment>
      }
    `,
  });
  const seaGeometry = new THREE.PlaneGeometry(600, 600, 120, 120);
  const seaVertices = seaGeometry.attributes.position;
  // Keep the near-water 5-unit grid; stretch only its outside rows to the horizon.
  for (let i = 0; i < seaVertices.count; i++) {
    for (const axis of [0, 1]) {
      const value = seaVertices.getComponent(i, axis);
      seaVertices.setComponent(i, axis, value + Math.sign(value) * Math.pow(Math.max(0, Math.abs(value)-180)/120, 3) * 5800);
    }
  }
  seaGeometry.computeBoundingSphere();
  const sea = new THREE.Mesh(seaGeometry, water);
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -.25;
  sea.receiveShadow = true;
  scene.add(sea);

  gltf.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      // MSAA coverage softens the fine needle silhouettes without blended sorting.
      material.alphaToCoverage = material.alphaTest > 0;
      if (material.alphaTest > 0) {
        // ponytail: a small leaf-colored fill approximates transmission; no extra render pass.
        material.emissive.set(0xffffff);
        material.emissiveMap = material.map;
        material.emissiveIntensity = .12;
      }
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      }
      if (material.name !== "Pool water") continue;
      material.roughness = .18;
      material.metalness = .08;
      material.onBeforeCompile = (shader) => {
        shader.uniforms.estateTime = water.uniforms.time;
        shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 estatePoolPosition;")
          .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nestatePoolPosition = (modelMatrix * vec4(transformed, 1.)).xyz;");
        shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 estatePoolPosition;\nuniform float estateTime;")
          .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
            vec2 poolSlope = vec2(.045*cos(estatePoolPosition.x*.9 + estateTime*.8), .035*cos(estatePoolPosition.z*1.13 - estateTime));
            normal = normalize(normal + mat3(viewMatrix) * vec3(-poolSlope.x, 0., -poolSlope.y));`);
      };
      material.needsUpdate = true;
    }
  });

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(.9, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xc38438, depthTest: false }),
  );
  marker.renderOrder = 5;
  marker.visible = false;
  scene.add(marker);

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let disposed = false;
  let regional = true;
  function draw() {
    if (disposed || !visible || document.hidden) return;
    renderer.render(scene, camera);
  }
  function animate(time: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || motion.matches) return;
    if (time - lastTime >= 1000 / 30) {
      water.uniforms.time.value += Math.min((time - lastTime) / 1000, .05);
      lastTime = time;
      draw();
    }
    frame = requestAnimationFrame(animate);
  }
  function resume() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = performance.now();
    if (motion.matches) water.uniforms.time.value = 0;
    draw();
    if (!disposed && visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(animate);
  }
  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const span = regional ? Math.max(700, 1000 / aspect) : Math.max(140, 160 / aspect);
    camera.aspect = aspect;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(span / (2 * (regional ? coastalDirection : viewingDirection).length())));
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    draw();
  }
  function lost(event: Event) {
    event.preventDefault();
    onFailure();
  }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); });
  const resizeObserver = new ResizeObserver(resize);
  observer.observe(host);
  resizeObserver.observe(host);
  controls.addEventListener("change", draw);
  motion.addEventListener("change", resume);
  document.addEventListener("visibilitychange", resume);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  resize();
  resume();

  return {
    view(index: number) {
      const view = views[index];
      regional = !view || Boolean("regional" in view && view.regional);
      const target = view ? new THREE.Vector3().fromArray(view.target) : overview;
      controls.target.copy(target);
      camera.position.copy(target).add(regional ? coastalDirection : viewingDirection);
      camera.zoom = view?.zoom ?? 1;
      camera.updateProjectionMatrix();
      marker.visible = Boolean(view) && !regional;
      marker.position.copy(target).add(new THREE.Vector3(0, 2, 0));
      controls.update();
      resize();
    },
    rotate(direction: number) { controls.rotateLeft(direction * .22); controls.update(); draw(); },
    zoom(direction: number) {
      camera.zoom = THREE.MathUtils.clamp(camera.zoom + direction * .22, .7, 2.7);
      camera.updateProjectionMatrix();
      draw();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      motion.removeEventListener("change", resume);
      document.removeEventListener("visibilitychange", resume);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      disposeObject(scene);
      environment.dispose();
      sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
