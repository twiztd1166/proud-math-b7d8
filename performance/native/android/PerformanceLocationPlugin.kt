package com.paradise.performance

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import androidx.core.content.ContextCompat
import androidx.core.location.LocationCompat
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.time.Instant
import java.util.UUID

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
    private val activeEmployeeKey = "activeEmployeeId"
    private val activeDeviceKey = "activeDeviceId"
    private val askedPermissionKey = "askedLocationPermission"
    private val spool by lazy { PerformanceLocationSpool(context.applicationContext) }

    override fun load() {
        PerformanceLocationService.setSampleListener { record ->
            notifyListeners("location", record.toJson())
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
        val employeeId = call.getString("employeeId")
        val deviceId = call.getString("deviceId")
        if (shiftId.isNullOrBlank() || employeeId.isNullOrBlank() || deviceId.isNullOrBlank()) {
            call.reject("shiftId, employeeId, and deviceId are required")
            return
        }
        if (!permissionGranted()) {
            call.reject("Location permission is required")
            return
        }

        val persisted = persistedContext()
        if (persisted != null && persisted != Triple(shiftId, employeeId, deviceId)) {
            call.reject("Another shift or device context is already tracking")
            return
        }

        persistContext(shiftId, employeeId, deviceId)
        startForegroundShiftService(shiftId, employeeId, deviceId, reattach = false)
        call.resolve(trackingStatus())
    }

    @PluginMethod
    fun reattachShiftTracking(call: PluginCall) {
        val shiftId = call.getString("shiftId")
        val employeeId = call.getString("employeeId")
        val deviceId = call.getString("deviceId")
        if (shiftId.isNullOrBlank() || employeeId.isNullOrBlank() || deviceId.isNullOrBlank()) {
            call.reject("shiftId, employeeId, and deviceId are required")
            return
        }
        if (!permissionGranted()) {
            call.reject("Location permission is required")
            return
        }
        if (persistedContext() != Triple(shiftId, employeeId, deviceId)) {
            call.reject("No persisted matching shift/device context may be reattached")
            return
        }

        startForegroundShiftService(shiftId, employeeId, deviceId, reattach = true)
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
        clearContext()
        call.resolve(trackingStatus())
    }

    @PluginMethod
    fun getTrackingStatus(call: PluginCall) {
        call.resolve(trackingStatus())
    }

    @PluginMethod
    fun getCurrentLocation(call: PluginCall) {
        val active = persistedContext()
        if (active == null) {
            call.reject("No active shift location context")
            return
        }

        val latest = PerformanceLocationService.lastRecord()
        if (latest != null && latest.shiftId == active.first && latest.employeeId == active.second && latest.deviceId == active.third) {
            call.resolve(latest.toJson())
            return
        }

        val location = lastKnownLocation()
        if (location == null) {
            call.reject("No current native location sample is available yet")
            return
        }
        try {
            val record = createAndPersistRecord(location, active.first, active.second, active.third)
            call.resolve(record.toJson())
        } catch (error: Exception) {
            call.reject("Unable to persist current native location: ${error.message}")
        }
    }

    @PluginMethod
    fun drainPendingLocations(call: PluginCall) {
        try {
            val limit = (call.getInt("limit") ?: 250).coerceIn(1, 1000)
            val records = spool.drain(limit)
            call.resolve(
                JSObject()
                    .put("samples", spool.asJsonArray(records))
                    .put("remaining", (spool.pendingCount() - records.size).coerceAtLeast(0)),
            )
        } catch (error: Exception) {
            call.reject("Unable to read pending native locations: ${error.message}")
        }
    }

    @PluginMethod
    fun ackPendingLocations(call: PluginCall) {
        val array = call.getArray("clientPointIds")
        if (array == null) {
            call.reject("clientPointIds is required")
            return
        }
        val ids = buildSet {
            for (index in 0 until array.length()) {
                val value = array.optString(index, "")
                if (value.isNotBlank()) add(value)
            }
        }
        try {
            spool.acknowledge(ids)
            call.resolve(JSObject().put("acknowledged", ids.size).put("pending", spool.pendingCount()))
        } catch (error: Exception) {
            call.reject("Unable to acknowledge pending native locations: ${error.message}")
        }
    }

    private fun startForegroundShiftService(shiftId: String, employeeId: String, deviceId: String, reattach: Boolean) {
        val intent = Intent(context, PerformanceLocationService::class.java).apply {
            action = if (reattach) PerformanceLocationService.ACTION_REATTACH else PerformanceLocationService.ACTION_START
            putExtra(PerformanceLocationService.EXTRA_SHIFT_ID, shiftId)
            putExtra(PerformanceLocationService.EXTRA_EMPLOYEE_ID, employeeId)
            putExtra(PerformanceLocationService.EXTRA_DEVICE_ID, deviceId)
        }
        ContextCompat.startForegroundService(context, intent)
    }

    private fun trackingStatus(): JSObject {
        val persisted = persistedContext()
        val shiftId = persisted?.first
        return JSObject()
            .put("active", persisted != null)
            .put("shiftId", shiftId)
            .put("employeeId", persisted?.second)
            .put("deviceId", persisted?.third)
            .put("running", PerformanceLocationService.isRunningFor(shiftId))
            .put("pendingNativeLocations", runCatching { spool.pendingCount() }.getOrDefault(-1))
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

    private fun createAndPersistRecord(location: Location, shiftId: String, employeeId: String, deviceId: String): PerformanceLocationRecord {
        val precise = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val record = PerformanceLocationRecord(
            clientPointId = UUID.randomUUID().toString(),
            employeeId = employeeId,
            deviceId = deviceId,
            shiftId = shiftId,
            latitude = location.latitude,
            longitude = location.longitude,
            accuracyMeters = location.accuracy.toDouble().coerceAtLeast(0.0),
            capturedAt = Instant.ofEpochMilli(location.time).toString(),
            precise = precise,
            source = "android-location-manager",
            mocked = LocationCompat.isMock(location),
            altitudeMeters = if (location.hasAltitude()) location.altitude else null,
            speedMetersPerSecond = if (location.hasSpeed()) location.speed.toDouble() else null,
            headingDegrees = if (location.hasBearing()) location.bearing.toDouble() else null,
        )
        spool.append(record)
        return record
    }

    private fun persistContext(shiftId: String, employeeId: String, deviceId: String) {
        preferences().edit()
            .putString(activeShiftKey, shiftId)
            .putString(activeEmployeeKey, employeeId)
            .putString(activeDeviceKey, deviceId)
            .apply()
    }

    private fun clearContext() {
        preferences().edit()
            .remove(activeShiftKey)
            .remove(activeEmployeeKey)
            .remove(activeDeviceKey)
            .apply()
    }

    private fun persistedContext(): Triple<String, String, String>? {
        val shiftId = preferences().getString(activeShiftKey, null)
        val employeeId = preferences().getString(activeEmployeeKey, null)
        val deviceId = preferences().getString(activeDeviceKey, null)
        return if (!shiftId.isNullOrBlank() && !employeeId.isNullOrBlank() && !deviceId.isNullOrBlank()) {
            Triple(shiftId, employeeId, deviceId)
        } else null
    }

    private fun preferences() = context.getSharedPreferences(prefsName, Context.MODE_PRIVATE)
}
