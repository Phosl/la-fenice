package it.lafenicepositano.app

import android.animation.ValueAnimator
import android.graphics.RuntimeShader
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.MotionDurationScale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.delay
import kotlin.coroutines.coroutineContext

private val stillWater = Brush.verticalGradient(listOf(
    Color(0xFFDDECF0), Color(0xFFB8D7DF), Color(0xFFE6EEEC)
))

/** Decorative optical water only: no input, text distortion, or fluid simulation. */
@Composable
fun WelcomeWater(modifier: Modifier = Modifier, active: Boolean = true) {
    if (Build.VERSION.SDK_INT >= 33) {
        ShaderWater(modifier, active)
    } else {
        Canvas(modifier) { drawRect(stillWater) }
    }
}

// Bound even a slow system duration setting; disabled/invalid scales never animate.
internal fun welcomeWaterDurationMillis(scale: Float): Long =
    if (!scale.isFinite() || scale <= 0f) 0L
    else (5_500.0 * scale).coerceIn(1.0, 8_000.0).toLong()

@RequiresApi(33)
@Composable
private fun ShaderWater(modifier: Modifier, active: Boolean) {
    val view = LocalView.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    var foreground by remember(lifecycle) { mutableStateOf(lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)) }
    var visible by remember { mutableStateOf(false) }
    var hardware by remember(view) { mutableStateOf(view.isHardwareAccelerated) }
    var systemMotion by remember { mutableStateOf(ValueAnimator.areAnimatorsEnabled()) }
    var reducedMotion by remember { mutableStateOf(false) }
    var failed by remember { mutableStateOf(false) }
    var drawLogged by remember { mutableStateOf(false) }
    var progress by remember { mutableFloatStateOf(0f) }
    var activeMillis by remember { mutableFloatStateOf(0f) }
    // One compiled program/brush per mount, including after a pause or resize.
    val shader = remember {
        runCatching { RuntimeShader(WATER_SHADER) }
            .onFailure { Log.w("WelcomeWater", "AGSL unavailable; using static water.", it) }
            .getOrNull()
    }
    val brush = remember(shader) { shader?.let(::ShaderBrush) }

    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, _ ->
            foreground = lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)
            systemMotion = ValueAnimator.areAnimatorsEnabled()
        }
        val scaleListener = ValueAnimator.DurationScaleChangeListener {
            systemMotion = ValueAnimator.areAnimatorsEnabled()
        }
        lifecycle.addObserver(observer)
        ValueAnimator.registerDurationScaleChangeListener(scaleListener)
        onDispose {
            lifecycle.removeObserver(observer)
            ValueAnimator.unregisterDurationScaleChangeListener(scaleListener)
        }
    }

    val canDrawShader = shader != null && hardware && systemMotion && !reducedMotion && !failed
    LaunchedEffect(active, foreground, visible, canDrawShader) {
        if (!systemMotion) progress = 1f
        if (!active || !foreground || !visible || !canDrawShader || progress >= 1f) return@LaunchedEffect
        var previous = withFrameNanos { it }
        while (progress < 1f) {
            val scale = coroutineContext[MotionDurationScale]?.scaleFactor ?: ValueAnimator.getDurationScale()
            val duration = welcomeWaterDurationMillis(scale)
            if (!ValueAnimator.areAnimatorsEnabled() || duration == 0L) {
                reducedMotion = true
                progress = 1f
                break
            }
            // No ambient loop: at most ~30 draw updates/s, then no frame work at rest.
            delay(32)
            val now = withFrameNanos { it }
            val deltaMillis = ((now - previous).coerceAtLeast(0L) / 1_000_000.0).toFloat()
            previous = now
            activeMillis += deltaMillis
            progress = if (activeMillis >= 8_000f) 1f else (progress + deltaMillis / duration).coerceAtMost(1f)
        }
    }

    Canvas(modifier.onGloballyPositioned { coordinates ->
        val bounds = coordinates.boundsInWindow() // clipped to the scrolling ancestors/window
        visible = bounds.width > 0f && bounds.height > 0f
        hardware = view.isHardwareAccelerated
    }) {
        drawRect(stillWater)
        if (canDrawShader && brush != null && size.width > 0f && size.height > 0f) {
            if (!drawContext.canvas.nativeCanvas.isHardwareAccelerated) {
                failed = true
            } else {
                try {
                    shader.setFloatUniform("resolution", size.width, size.height)
                    shader.setFloatUniform("progress", progress)
                    drawRect(brush)
                    if (!drawLogged) {
                        Log.i("WelcomeWater", "AGSL hardware draw submitted; visual output not verified by this log.")
                        drawLogged = true
                    }
                } catch (error: RuntimeException) {
                    // A device-specific shader failure must never obstruct the login.
                    Log.w("WelcomeWater", "AGSL draw failed; using static water.", error)
                    failed = true
                }
            }
        }
    }
}

private const val WATER_SHADER = """
uniform float2 resolution;
uniform float progress;

half4 main(float2 pixel) {
    float2 uv = pixel / max(resolution, float2(1.0));
    // Height-based coordinates keep the ripple circular in a shallow, wide strip.
    float2 p = (pixel - resolution * float2(0.62, 0.30)) / max(resolution.y, 1.0);
    float q = clamp(progress, 0.0, 1.0);
    float time = 5.5 * (1.0 - pow(1.0 - q, 3.0));
    float envelope = (1.0 - smoothstep(0.06, 0.95, q));
    float radius = length(p);
    float wave = sin(radius * 8.0 - time * 2.8) * exp(-radius * 0.75) * envelope;
    float2 refracted = p + float2(wave * 0.08, wave * 0.045);
    float crossing = sin(refracted.x * 2.7 + sin(refracted.y * 3.1 + time * 0.20))
        + sin(refracted.y * 4.4 - refracted.x * 1.8 - time * 0.13);
    float light = pow(clamp(0.5 + 0.25 * crossing, 0.0, 1.0), 8.0);
    float3 water = mix(float3(0.87, 0.93, 0.94), float3(0.62, 0.79, 0.83), uv.y * 0.72);
    water += light * float3(0.095, 0.10, 0.095) + wave * float3(0.022, 0.028, 0.029);
    water = mix(water, float3(0.90, 0.94, 0.93), smoothstep(0.70, 1.0, uv.y) * 0.60);
    return half4(clamp(water, 0.0, 1.0), 1.0);
}
"""
