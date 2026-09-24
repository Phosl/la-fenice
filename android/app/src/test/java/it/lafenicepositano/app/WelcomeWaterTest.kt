package it.lafenicepositano.app

import org.junit.Assert.assertEquals
import org.junit.Test

class WelcomeWaterTest {
    @Test fun decorativeMotionIsFiniteAndRespectsDisabledOrInvalidScales() {
        assertEquals(5_500L, welcomeWaterDurationMillis(1f))
        assertEquals(2_750L, welcomeWaterDurationMillis(0.5f))
        assertEquals(8_000L, welcomeWaterDurationMillis(10f))
        assertEquals(8_000L, welcomeWaterDurationMillis(Float.MAX_VALUE))
        listOf(0f, -1f, Float.NaN, Float.POSITIVE_INFINITY, Float.NEGATIVE_INFINITY).forEach {
            assertEquals(0L, welcomeWaterDurationMillis(it))
        }
    }
}
