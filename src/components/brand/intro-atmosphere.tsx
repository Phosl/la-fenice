"use client";

import { useEffect, useRef } from "react";

const MAX_DEVICE_PIXEL_RATIO = 1.5;
const MAX_RENDER_PIXELS = 1_200_000;
const FRAME_INTERVAL_MS = 1000 / 30;

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
      (1.0 - smoothstep(0.015, 0.058, abs(detailRibbon))) * 0.38;

    return vec2(max(primary, detail), fringe);
  }

  void main() {
    vec2 point = v_uv * 2.0 - 1.0;
    point.x *= u_resolution.x / max(u_resolution.y, 1.0);
    float time = u_time;

    float depth = smoothstep(-0.92, 0.88, -point.y);
    vec3 pearl = vec3(0.915, 0.966, 0.982);
    vec3 water = vec3(0.480, 0.765, 0.875);
    vec3 colour = mix(pearl, water, depth * 0.72);

    float logoDistance = length(
      vec2(point.x / 0.47, (point.y + 0.015) / 0.30)
    );
    float logoClear = 1.0 - smoothstep(0.62, 1.22, logoDistance);
    colour = mix(colour, vec3(0.995, 0.991, 0.965), logoClear * 0.82);

    vec2 caustic = causticNet(point + vec2(0.03, -0.02), time);
    float patternMask = 1.0 - logoClear * 0.86;

    colour = mix(
      colour,
      vec3(0.155, 0.555, 0.735),
      caustic.y * 0.18 * patternMask
    );
    colour = mix(
      colour,
      vec3(1.0, 0.995, 0.942),
      caustic.x * 0.64 * patternMask
    );

    float broadRipple =
      0.5 + 0.5 * sin(point.x * 3.3 + point.y * 4.8 - time * 1.15);
    colour = mix(
      colour,
      vec3(0.735, 0.910, 0.960),
      broadRipple * 0.08 * patternMask
    );

    float edge = smoothstep(
      0.42,
      1.52,
      length(point * vec2(0.70, 0.82))
    );
    colour = mix(colour, vec3(0.155, 0.505, 0.705), edge * 0.10);

    gl_FragColor = vec4(colour, 1.0);
  }
`;

type IntroAtmosphereProps = {
  active?: boolean;
  className?: string;
};

type AtmosphereRenderer = {
  dispose: () => void;
  draw: (elapsedSeconds: number) => void;
  resize: () => void;
};

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

function createRenderer(canvas: HTMLCanvasElement): AtmosphereRenderer | null {
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
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const timeLocation = gl.getUniformLocation(program, "u_time");

  if (!buffer || positionLocation < 0 || !resolutionLocation || !timeLocation) {
    if (buffer) gl.deleteBuffer(buffer);
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
  gl.clearColor(0, 0, 0, 0);

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

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  return {
    dispose: () => {
      gl.disableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.useProgram(null);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
    draw: (elapsedSeconds) => {
      if (gl.isContextLost()) return;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, elapsedSeconds);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    resize,
  };
}

export function IntroAtmosphere({ active = true, className }: IntroAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
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
        renderer = createRenderer(canvas);
      } catch {
        renderer = null;
      }

      if (!renderer) {
        canvas.dataset.renderer = "fallback";
        return;
      }

      canvas.dataset.renderer = "webgl";
      renderer.resize();
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => renderer?.resize());
        resizeObserver.observe(canvas);
      }
      requestAnimation();
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) {
        stopRenderer();
      } else {
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
      stopRenderer();
      canvas.dataset.renderer = "fallback";
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
  }, [active]);

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
