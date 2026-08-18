package com.paradise.performance

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.time.Instant

@CapacitorPlugin(
    name = "PerformanceLocation",
    permissions = [
        Permission(
            alias = "location",
            strings = [
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
            ],
        ),
    ],
)
class PerformanceLocationPlugin : Plugin() {
    private val prefsName = "ParadisePerformance"
    private val activeShiftKey = "activeShiftId"
    private val askedPermissionKey = "askedLocationPermission"

    override fun load() {
        PerformanceLocationService.setSampleListener { location ->
            notifyListeners("location", sample(location))
        }
        // Critical invariant: plugin load never starts the foreground service.
    }

    override fun handleOnDestroy() {
        PerformanceLocationService.setSampleListener(null)
        super.handleOnDestroy()
    }

    @PluginMethod
    fun getPermissionState(call: PluginCall) {
        call.resolve(JSObject().put("state", permissionState()))
    }

    @PluginMethod
    fun requestShiftLocationPermission(call: PluginCall) {
        if (permissionGranted()) {
            call.resolve(JSObject().put("state", permissionState()))
            return
        }
        preferences().edit().putBoolean(askedPermissionKey, true).apply()
        requestPermissionForAlias("location", call, "locationPermissionCallback")
    }

    @PermissionCallback
    private fun locationPermissionCallback(call: PluginCall) {
        call.resolve(JSObject().put("state", permissionState()))
    }

    @PluginMethod
    fun startShiftTracking(call: PluginCall) {
        if (call.getBoolean("initiatedByUser", false) != true) {
            call.reject("Shift tracking may start only from the visible Start My Day action")
            return
        }
        val shiftId = call.getString("shiftId")
        if (shiftId.isNullOrBlank()) {
            call.reject("shiftId is required")
            return
        }
        if (!permissionGranted()) {
            call.reject("Location permission is required")
            return
        }
        val active = preferences().getString(activeShiftKey, null)
        if (active != null && active != shiftId) {
            call.reject("Another shift is already tracking")
            return
        }

        startForegroundShiftService(shiftId, reattach = false)
        call.resolve(trackingStatus())
    }

    @PluginMethod
    fun reattachShiftTracking(call: PluginCall) {
        val shiftId = call.getString("shiftId")
        if (shiftId.isNullOrBlank()) {
            call.reject("shiftId is required")
            return
        }
        if (!permissionGranted()) {
            call.reject("Location permission is required")
            return
        }
        val persisted = preferences().getString(activeShiftKey, null)
        if (persisted != shiftId) {
            call.reject("No persisted matching shift may be reattached")
            return
        }

        startForegroundShiftService(shiftId, reattach = true)
        call.resolve(trackingStatus())
    }

    @PluginMethod
    fun stopShiftTracking(call: PluginCall) {
        val requested = call.getString("shiftId")
        val active = preferences().getString(activeShiftKey, null)
        if (!requested.isNullOrBlank() && active != null && requested != active) {
            call.reject("Cannot stop a different shift")
            return
        }
        val intent = Intent(context, PerformanceLocationService::class.java).apply {
            action = PerformanceLocationService.ACTION_STOP
            putExtra(PerformanceLocationService.EXTRA_SHIFT_ID, active)
        }
        context.startService(intent)
        preferences().edit().remove(activeShiftKey).apply()
        call.resolve(trackingStatus())
    }

    @PluginMethod
    fun getTrackingStatus(call: PluginCall) {
        call.resolve(trackingStatus())
    }

    @PluginMethod
    fun getCurrentLocation(call: PluginCall) {
        val current = PerformanceLocationService.lastLocation()
            ?: lastKnownLocation()
        if (current == null) {
            call.reject("No current native location sample is available yet")
            return
        }
        call.resolve(sample(current))
    }

    private fun startForegroundShiftService(shiftId: String, reattach: Boolean) {
        preferences().edit().putString(activeShiftKey, shiftId).apply()
        val intent = Intent(context, PerformanceLocationService::class.java).apply {
            action = if (reattach) PerformanceLocationService.ACTION_REATTACH else PerformanceLocationService.ACTION_START
            putExtra(PerformanceLocationService.EXTRA_SHIFT_ID, shiftId)
        }
        ContextCompat.startForegroundService(context, intent)
    }

    private fun trackingStatus(): JSObject {
        val shiftId = preferences().getString(activeShiftKey, null)
        return JSObject()
            .put("active", shiftId != null)
            .put("shiftId", shiftId)
            .put("running", PerformanceLocationService.isRunningFor(shiftId))
    }

    private fun permissionGranted(): Boolean {
        val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private fun permissionState(): String {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        if (!manager.isLocationEnabled) return "RESTRICTED"
        val fine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (fine) return "GRANTED_PRECISE"
        if (coarse) return "GRANTED_APPROXIMATE"
        val asked = preferences().getBoolean(askedPermissionKey, false)
        return if (asked || getPermissionState("location") == PermissionState.DENIED) "DENIED" else "NOT_DETERMINED"
    }

    @Suppress("MissingPermission")
    private fun lastKnownLocation(): Location? {
        if (!permissionGranted()) return null
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        return manager.getProviders(true)
            .mapNotNull { provider -> runCatching { manager.getLastKnownLocation(provider) }.getOrNull() }
            .maxByOrNull { it.time }
    }

    private fun preferences() = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)

    private fun sample(location: Location): JSObject {
        val precise = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val result = JSObject()
            .put("latitude", location.latitude)
            .put("longitude", location.longitude)
            .put("accuracyMeters", location.accuracy.toDouble().coerceAtLeast(0.0))
            .put("capturedAt", Instant.ofEpochMilli(location.time).toString())
            .put("platform", "android")
            .put("precise", precise)
            .put("source", "android-location-manager")
            .put("mocked", if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) location.isMock else location.isFromMockProvider)

        if (location.hasAltitude()) result.put("altitudeMeters", location.altitude)
        if (location.hasSpeed()) result.put("speedMetersPerSecond", location.speed.toDouble())
        if (location.hasBearing()) result.put("headingDegrees", location.bearing.toDouble())
        return result
    }
}
