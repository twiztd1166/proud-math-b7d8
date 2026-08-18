package com.paradise.performance

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.core.location.LocationCompat
import java.time.Instant
import java.util.UUID

class PerformanceLocationService : Service(), LocationListener {
    companion object {
        const val ACTION_START = "com.paradise.performance.action.START_SHIFT_LOCATION"
        const val ACTION_REATTACH = "com.paradise.performance.action.REATTACH_SHIFT_LOCATION"
        const val ACTION_STOP = "com.paradise.performance.action.STOP_SHIFT_LOCATION"
        const val EXTRA_SHIFT_ID = "shiftId"
        const val EXTRA_EMPLOYEE_ID = "employeeId"
        const val EXTRA_DEVICE_ID = "deviceId"

        private const val PREFS = "ParadisePerformance"
        private const val ACTIVE_SHIFT_KEY = "activeShiftId"
        private const val ACTIVE_EMPLOYEE_KEY = "activeEmployeeId"
        private const val ACTIVE_DEVICE_KEY = "activeDeviceId"
        private const val CHANNEL_ID = "paradise_performance_active_shift_location"
        private const val NOTIFICATION_ID = 7401

        // Technical sampling defaults only; these are not KPI, productivity, territory, or compensation standards.
        private const val MIN_TIME_MS = 15_000L
        private const val MIN_DISTANCE_METERS = 10f

        @Volatile private var runningShiftId: String? = null
        @Volatile private var runningEmployeeId: String? = null
        @Volatile private var runningDeviceId: String? = null
        @Volatile private var latestRecord: PerformanceLocationRecord? = null
        @Volatile private var sampleListener: ((PerformanceLocationRecord) -> Unit)? = null

        fun setSampleListener(listener: ((PerformanceLocationRecord) -> Unit)?) {
            sampleListener = listener
        }

        fun lastRecord(): PerformanceLocationRecord? = latestRecord
        fun isRunningFor(shiftId: String?): Boolean = shiftId != null && runningShiftId == shiftId
    }

    private lateinit var locationManager: LocationManager
    private lateinit var spool: PerformanceLocationSpool

    override fun onCreate() {
        super.onCreate()
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        spool = PerformanceLocationSpool(applicationContext)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val action = intent?.action

        if (action == ACTION_STOP) {
            stopTracking()
            prefs.edit()
                .remove(ACTIVE_SHIFT_KEY)
                .remove(ACTIVE_EMPLOYEE_KEY)
                .remove(ACTIVE_DEVICE_KEY)
                .apply()
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            return START_NOT_STICKY
        }

        val shiftId = intent?.getStringExtra(EXTRA_SHIFT_ID) ?: prefs.getString(ACTIVE_SHIFT_KEY, null)
        val employeeId = intent?.getStringExtra(EXTRA_EMPLOYEE_ID) ?: prefs.getString(ACTIVE_EMPLOYEE_KEY, null)
        val deviceId = intent?.getStringExtra(EXTRA_DEVICE_ID) ?: prefs.getString(ACTIVE_DEVICE_KEY, null)
        if (shiftId.isNullOrBlank() || employeeId.isNullOrBlank() || deviceId.isNullOrBlank()) {
            stopSelf()
            return START_NOT_STICKY
        }

        // ACTION_REATTACH and OS START_STICKY recovery may resume only the already-persisted exact context.
        if (action == ACTION_REATTACH || intent == null) {
            val persistedShift = prefs.getString(ACTIVE_SHIFT_KEY, null)
            val persistedEmployee = prefs.getString(ACTIVE_EMPLOYEE_KEY, null)
            val persistedDevice = prefs.getString(ACTIVE_DEVICE_KEY, null)
            if (persistedShift != shiftId || persistedEmployee != employeeId || persistedDevice != deviceId) {
                stopSelf()
                return START_NOT_STICKY
            }
        }

        prefs.edit()
            .putString(ACTIVE_SHIFT_KEY, shiftId)
            .putString(ACTIVE_EMPLOYEE_KEY, employeeId)
            .putString(ACTIVE_DEVICE_KEY, deviceId)
            .apply()
        startAsLocationForegroundService(shiftId)
        startTracking(shiftId, employeeId, deviceId)
        return START_STICKY
    }

    override fun onDestroy() {
        stopTracking()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onLocationChanged(location: Location) {
        val record = persistLocation(location) ?: return
        sampleListener?.invoke(record)
    }

    @Deprecated("Deprecated by Android platform")
    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit

    override fun onProviderEnabled(provider: String) = Unit
    override fun onProviderDisabled(provider: String) = Unit

    private fun startAsLocationForegroundService(shiftId: String) {
        val notification = buildNotification(shiftId)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    @Suppress("MissingPermission")
    private fun startTracking(shiftId: String, employeeId: String, deviceId: String) {
        if (!hasLocationPermission()) {
            stopSelf()
            return
        }
        if (runningShiftId != null && (
                runningShiftId != shiftId || runningEmployeeId != employeeId || runningDeviceId != deviceId
            )) {
            stopTracking()
        }
        runningShiftId = shiftId
        runningEmployeeId = employeeId
        runningDeviceId = deviceId
        requestProvider(LocationManager.GPS_PROVIDER)
        requestProvider(LocationManager.NETWORK_PROVIDER)
    }

    @Suppress("MissingPermission")
    private fun requestProvider(provider: String) {
        if (!locationManager.allProviders.contains(provider)) return
        runCatching {
            locationManager.requestLocationUpdates(
                provider,
                MIN_TIME_MS,
                MIN_DISTANCE_METERS,
                this,
                Looper.getMainLooper(),
            )
        }
    }

    private fun stopTracking() {
        if (::locationManager.isInitialized) runCatching { locationManager.removeUpdates(this) }
        runningShiftId = null
        runningEmployeeId = null
        runningDeviceId = null
        latestRecord = null
    }

    private fun persistLocation(location: Location): PerformanceLocationRecord? {
        val shiftId = runningShiftId ?: return null
        val employeeId = runningEmployeeId ?: return null
        val deviceId = runningDeviceId ?: return null
        val precise = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
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
        // Persist before listener delivery so process/webview loss cannot erase the point.
        spool.append(record)
        latestRecord = record
        return record
    }

    private fun hasLocationPermission(): Boolean {
        val fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Active Performance shift location",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Shown only while an employee's Paradise Performance shift location is active."
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    private fun buildNotification(shiftId: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(applicationInfo.icon)
            .setContentTitle("Paradise Performance · Shift active")
            .setContentText("Location is being recorded only for your active workday.")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSubText("Shift ${shiftId.take(8)}")
            .build()
    }
}
