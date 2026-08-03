"use client";

import { type RefObject, useEffect, useRef } from "react";
import { BRAND_LOGO_ASPECT_RATIO, brandLogo } from "@/lib/brand-assets";

const MAX_DEVICE_PIXEL_RATIO = 1.5;
const MAX_RENDER_PIXELS = 1_200_000;
const FRAME_INTERVAL_MS = 1000 / 30;
const noopLogoIntegration = () => undefined;

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform sampler2D u_logo_texture;
  uniform vec4 u_logo_rect;
  uniform float u_logo_ready;
  varying vec2 v_uv;

  vec2 causticNet(vec2 point, float time) {
    vec2 warped = point;
    warped.x += 0.105 * sin(warped.y * 7.0 + time * 1.10);
    warped.y += 0.085 * sin(warped.x * 6.2 - time * 0.88);

    float ribbonA = sin(
      warped.x * 13.4 +
      sin(warped.y * 7.4 - time * 0.92) * 1.22 +
      time * 0.64
    );
    float ribbonB = sin(
      warped.y * 12.2 +
      sin(warped.x * 8.1 + time * 0.74) * 1.12 -
      time * 0.52
    );
    float joined = abs((ribbonA + ribbonB) * 0.5);
    float primary = 1.0 - smoothstep(0.035, 0.125, joined);
    float fringe =
      (1.0 - smoothstep(0.10, 0.285, joined)) *
      (1.0 - primary * 0.82);

    float detailRibbon = sin(
      warped.x * 18.0 - warped.y * 8.6 +
      sin(warped.y * 9.4 + time) * 0.80 +
      time * 0.36
    );
    float detail =
      (1.0 - smoothstep(0.015, 0.058, abs(detailRibbon))) * 0.34;

    return vec2(max(primary, detail), fringe);
  }

  void main() {
    vec2 point = v_uv * 2.0 - 1.0;
    point.x *= u_resolution.x / max(u_resolution.y, 1.0);
    float time = u_time;

    float depth = smoothstep(-0.92, 0.88, -point.y);
    vec3 pearl = vec3(0.965, 0.985, 0.988);
    vec3 water = vec3(0.690, 0.860, 0.920);
    vec3 colour = mix(pearl, water, depth * 0.58);

    vec2 logoSpace =
      (v_uv - u_logo_rect.xy) /
      max(u_logo_rect.zw, vec2(0.0001));
    float logoClear = 1.0 - smoothstep(
      0.52,
      1.02,
      length(logoSpace * vec2(0.76, 1.0))
    );
    colour = mix(
      colour,
      vec3(0.997, 0.994, 0.977),
      logoClear * 0.74
    );

    vec2 caustic = causticNet(point + vec2(0.03, -0.02), time);
    float patternMask = 1.0 - logoClear * 0.78;
    float broadRipple = 0.5 + 0.5 * sin(
      point.x * 3.3 + point.y * 4.8 - time * 1.15
    );

    colour = mix(
      colour,
      vec3(0.420, 0.710, 0.820),
      caustic.y * 0.14 * patternMask
    );
    colour = mix(
      colour,
      vec3(1.0, 0.998, 0.975),
      caustic.x * 0.54 * patternMask
    );
    colour = mix(
      colour,
      vec3(0.800, 0.930, 0.960),
      broadRipple * 0.055 * patternMask
    );

    float edge = smoothstep(
      0.46,
      1.58,
      length(point * vec2(0.70, 0.82))
    );
    colour = mix(
      colour,
      vec3(0.450, 0.740, 0.840),
      edge * 0.055
    );

    if (u_logo_ready > 0.5) {
      vec2 logoUv = logoSpace + 0.5;
      float insideLogo =
        step(0.0, logoUv.x) * step(logoUv.x, 1.0) *
        step(0.0, logoUv.y) * step(logoUv.y, 1.0);

      if (insideLogo > 0.5) {
        float reveal = smoothstep(0.03, 0.36, time);
        vec2 sampleUv = logoUv;
        sampleUv.y += (1.0 - reveal) * 0.026;

        vec2 flow = vec2(
          sin(sampleUv.y * 15.0 + time * 2.10) +
            0.5 * sin(sampleUv.x * 22.0 - time * 1.35),
          cos(sampleUv.x * 14.0 - time * 1.70) +
            0.5 * sin(sampleUv.y * 19.0 + time * 1.15)
        );
        float sweepPosition = -0.08 + time * 0.72;
        float sweepAxis = sampleUv.x * 0.72 + sampleUv.y * 0.28;
        float waterSweep = 1.0 - smoothstep(
          0.035,
          0.14,
          abs(sweepAxis - sweepPosition)
        );
        float refractStrength =
          mix(0.68, 1.0, caustic.x) *
          (0.88 + waterSweep * 0.18);
        vec2 refractedUv = sampleUv +
          flow * vec2(0.0032, 0.0052) * refractStrength;

        float stableAlpha =
          texture2D(u_logo_texture, sampleUv).a;
        float refractedAlpha =
          texture2D(u_logo_texture, refractedUv).a;
        float logoAlpha = max(stableAlpha * 0.30, refractedAlpha);
        logoAlpha =
          smoothstep(0.015, 0.90, logoAlpha) * reveal;

        vec3 cobalt = vec3(0.0784314, 0.1725490, 0.5137255);
        vec3 sunlitCobalt = vec3(0.340, 0.520, 0.750);
        float logoLight = clamp(
          caustic.x * 0.34 + caustic.y * 0.10 +
          broadRipple * 0.050 + waterSweep * 0.46,
          0.0,
          0.68
        );
        colour = mix(
          colour,
          mix(cobalt, sunlitCobalt, logoLight),
          logoAlpha
        );
      }
    }

    gl_FragColor = vec4(colour, 1.0);
  }
`;

type IntroAtmosphereProps = {
  active?: boolean;
  className?: string;
  logoTargetRef: RefObject<HTMLElement | null>;
  onLogoIntegrationChange?: (integrated: boolean) => void;
};

type AtmosphereRenderer = {
  dispose: () => void;
  draw: (elapsedSeconds: number) => void;
  resize: () => void;
};

type LogoRect = [number, number, number, number];

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function getLogoRect(
  canvas: HTMLCanvasElement,
  logoTarget: HTMLElement | null,
): LogoRect {
  const bounds = canvas.getBoundingClientRect();
  const root = canvas.closest<HTMLElement>(".logo-intro");

  if (
    root &&
    logoTarget &&
    root.clientWidth > 0 &&
    root.clientHeight > 0 &&
    logoTarget.offsetWidth > 0 &&
    logoTarget.offsetHeight > 0
  ) {
    let left = 0;
    let top = 0;
    let current: HTMLElement | null = logoTarget;

    while (current && current !== root) {
      left += current.offsetLeft;
      top += current.offsetTop;
      current =
        current.offsetParent instanceof HTMLElement
          ? current.offsetParent
          : null;
    }

    if (current === root) {
      return [
        (left + logoTarget.offsetWidth / 2) / root.clientWidth,
        1 - (top + logoTarget.offsetHeight / 2) / root.clientHeight,
        logoTarget.offsetWidth / root.clientWidth,
        logoTarget.offsetHeight / root.clientHeight,
      ];
    }
  }

  const logoWidth = Math.min(
    Math.min(356, Math.max(224, bounds.width * 0.39)),
    bounds.height * 0.5328,
  );
  const logoHeight = logoWidth / BRAND_LOGO_ASPECT_RATIO;
  const markGap = Math.min(28, Math.max(18, bounds.width * 0.024));

  return [
    0.5,
    0.5 + (markGap + 1) / (2 * Math.max(bounds.height, 1)),
    logoWidth / Math.max(bounds.width, 1),
    logoHeight / Math.max(bounds.height, 1),
  ];
}

function createRenderer(
  canvas: HTMLCanvasElement,
  logoTarget: HTMLElement | null,
  onLogoIntegrationChange: (integrated: boolean) => void,
): AtmosphereRenderer | null {
  const contextOptions: WebGLContextAttributes = {
    alpha: true,
    antialias: false,
    depth: false,
    failIfMajorPerformanceCaveat: false,
    powerPreference: "low-power",
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    stencil: false,
  };

  const gl = canvas.getContext("webgl", contextOptions);
  if (!gl) return null;

  const program = createProgram(gl);
  if (!program) return null;

  const buffer = gl.createBuffer();
  const logoTexture = gl.createTexture();
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const logoReadyLocation = gl.getUniformLocation(program, "u_logo_ready");
  const logoRectLocation = gl.getUniformLocation(program, "u_logo_rect");
  const logoTextureLocation = gl.getUniformLocation(program, "u_logo_texture");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const timeLocation = gl.getUniformLocation(program, "u_time");

  if (
    !buffer ||
    !logoTexture ||
    positionLocation < 0 ||
    !logoReadyLocation ||
    !logoRectLocation ||
    !logoTextureLocation ||
    !resolutionLocation ||
    !timeLocation
  ) {
    if (buffer) gl.deleteBuffer(buffer);
    if (logoTexture) gl.deleteTexture(logoTexture);
    gl.deleteProgram(program);
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, logoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );
  gl.uniform1i(logoTextureLocation, 0);
  gl.clearColor(0, 0, 0, 0);

  let disposed = false;
  let logoReady = false;
  let logoPresented = false;
  let logoRaster: HTMLCanvasElement | null = null;
  let logoRect: LogoRect = [0.5, 0.5, 0.4, 0.24];
  const logoImage = new Image();
  logoImage.decoding = "async";
  canvas.dataset.logoTexture = "loading";
  canvas.dataset.logoFrame = "pending";

  const markLogoError = () => {
    logoReady = false;
    canvas.dataset.logoTexture = "error";
    canvas.dataset.logoFrame = "pending";
    onLogoIntegrationChange(false);
  };

  const handleLogoLoad = () => {
    if (disposed || gl.isContextLost()) return;

    try {
      const raster = document.createElement("canvas");
      raster.width = brandLogo.textureWidth;
      raster.height = brandLogo.textureHeight;
      const rasterContext = raster.getContext("2d");

      if (!rasterContext) {
        markLogoError();
        return;
      }

      rasterContext.clearRect(0, 0, raster.width, raster.height);
      rasterContext.drawImage(logoImage, 0, 0, raster.width, raster.height);
      logoRaster = raster;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, logoTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        raster,
      );
    } catch {
      markLogoError();
      return;
    }

    if (gl.getError() !== gl.NO_ERROR) {
      markLogoError();
      return;
    }

    logoReady = true;
    canvas.dataset.logoTexture = "ready";
  };
  const handleLogoError = () => {
    if (disposed) return;
    markLogoError();
  };

  logoImage.addEventListener("load", handleLogoLoad);
  logoImage.addEventListener("error", handleLogoError);
  logoImage.src = brandLogo.blueSrc;

  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const areaRatio = Math.sqrt(
      MAX_RENDER_PIXELS / Math.max(1, bounds.width * bounds.height),
    );
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      MAX_DEVICE_PIXEL_RATIO,
      areaRatio,
    );
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));
    logoRect = getLogoRect(canvas, logoTarget);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  return {
    dispose: () => {
      disposed = true;
      logoImage.removeEventListener("load", handleLogoLoad);
      logoImage.removeEventListener("error", handleLogoError);
      logoImage.src = "";
      if (logoRaster) {
        logoRaster.width = 1;
        logoRaster.height = 1;
        logoRaster = null;
      }
      gl.disableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.useProgram(null);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(logoTexture);
      gl.deleteProgram(program);
    },
    draw: (elapsedSeconds) => {
      if (gl.isContextLost()) return;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, logoTexture);
      gl.uniform1f(logoReadyLocation, logoReady ? 1 : 0);
      gl.uniform4f(logoRectLocation, ...logoRect);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, elapsedSeconds);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (logoReady && !logoPresented) {
        if (gl.getError() !== gl.NO_ERROR) {
          canvas.dataset.logoTexture = "error";
          logoReady = false;
          onLogoIntegrationChange(false);
          return;
        }

        logoPresented = true;
        canvas.dataset.logoFrame = "ready";
        onLogoIntegrationChange(true);
      }
    },
    resize,
  };
}

export function IntroAtmosphere({
  active = true,
  className,
  logoTargetRef,
  onLogoIntegrationChange = noopLogoIntegration,
}: IntroAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const logoTarget = logoTargetRef.current;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    canvas.dataset.renderer = reducedMotion.matches ? "disabled" : "pending";
    canvas.dataset.logoTexture = "idle";
    canvas.dataset.logoFrame = "pending";
    onLogoIntegrationChange(false);
    let renderer: AtmosphereRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let animationFrame = 0;
    let lastDrawnAt = 0;
    let startedAt = 0;
    let isVisible = canvas.getClientRects().length > 0;

    const cancelAnimation = () => {
      if (!animationFrame) return;
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    };

    const animate = (now: number) => {
      animationFrame = 0;
      if (!renderer || !isVisible || reducedMotion.matches || document.hidden) return;

      if (canvas.getClientRects().length === 0) {
        isVisible = false;
        return;
      }

      if (!startedAt) startedAt = now;
      if (!lastDrawnAt || now - lastDrawnAt >= FRAME_INTERVAL_MS) {
        renderer.draw((now - startedAt) / 1000);
        lastDrawnAt = now;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const requestAnimation = () => {
      if (
        animationFrame ||
        !renderer ||
        !isVisible ||
        reducedMotion.matches ||
        document.hidden
      ) {
        return;
      }
      animationFrame = window.requestAnimationFrame(animate);
    };

    const stopRenderer = () => {
      cancelAnimation();
      resizeObserver?.disconnect();
      resizeObserver = null;
      renderer?.dispose();
      renderer = null;
      lastDrawnAt = 0;
      startedAt = 0;
    };

    const startRenderer = () => {
      if (renderer || reducedMotion.matches || canvas.getClientRects().length === 0) {
        return;
      }

      try {
        renderer = createRenderer(
          canvas,
          logoTarget,
          onLogoIntegrationChange,
        );
      } catch {
        renderer = null;
      }

      if (!renderer) {
        canvas.dataset.renderer = "fallback";
        canvas.dataset.logoTexture = "error";
        canvas.dataset.logoFrame = "pending";
        onLogoIntegrationChange(false);
        return;
      }

      renderer.resize();
      renderer.draw(0);
      canvas.dataset.renderer = "webgl";
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          renderer?.resize();
          renderer?.draw(
            startedAt ? Math.max(0, performance.now() - startedAt) / 1000 : 0,
          );
        });
        resizeObserver.observe(canvas);
        if (logoTarget) resizeObserver.observe(logoTarget);
      }
      requestAnimation();
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) {
        onLogoIntegrationChange(false);
        stopRenderer();
        canvas.dataset.renderer = "disabled";
        canvas.dataset.logoTexture = "idle";
        canvas.dataset.logoFrame = "pending";
      } else {
        canvas.dataset.renderer = "pending";
        startRenderer();
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimation();
      } else {
        requestAnimation();
      }
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      onLogoIntegrationChange(false);
      stopRenderer();
      canvas.dataset.renderer = "fallback";
      canvas.dataset.logoTexture = "error";
      canvas.dataset.logoFrame = "pending";
    };

    const handleContextRestored = () => {
      startRenderer();
    };

    const handleWindowResize = () => renderer?.resize();

    if (typeof IntersectionObserver !== "undefined") {
      intersectionObserver = new IntersectionObserver(([entry]) => {
        isVisible = entry?.isIntersecting ?? false;
        if (isVisible) {
          renderer?.resize();
          requestAnimation();
        } else {
          cancelAnimation();
        }
      });
      intersectionObserver.observe(canvas);
    }

    reducedMotion.addEventListener("change", handleMotionPreference);
    document.addEventListener("visibilitychange", handleVisibility);
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    window.addEventListener("resize", handleWindowResize, { passive: true });
    startRenderer();

    return () => {
      intersectionObserver?.disconnect();
      reducedMotion.removeEventListener("change", handleMotionPreference);
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      window.removeEventListener("resize", handleWindowResize);
      stopRenderer();
    };
  }, [active, logoTargetRef, onLogoIntegrationChange]);

  return (
    <canvas
      aria-hidden="true"
      className={
        className
          ? `logo-intro__atmosphere ${className}`
          : "logo-intro__atmosphere"
      }
      data-active={active ? "true" : "false"}
      ref={canvasRef}
    />
  );
}
