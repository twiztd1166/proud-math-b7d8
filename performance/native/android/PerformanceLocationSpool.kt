package com.paradise.performance

import android.content.Context
import com.getcapacitor.JSObject
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.nio.charset.StandardCharsets

/**
 * App-private durable handoff for native GPS samples.
 *
 * A sample is appended and fsynced before it is exposed to the Capacitor listener.
 * JavaScript acknowledges the clientPointId only after its idempotent local sync queue
 * has durably accepted the record. This spool is evidence transport only; it is never
 * an authorization source and cannot make a field Lookup decision.
 */
data class PerformanceLocationRecord(
    val clientPointId: String,
    val employeeId: String,
    val deviceId: String,
    val shiftId: String,
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Double,
    val capturedAt: String,
    val precise: Boolean,
    val source: String,
    val mocked: Boolean,
    val altitudeMeters: Double? = null,
    val speedMetersPerSecond: Double? = null,
    val headingDegrees: Double? = null,
) {
    fun toJson(): JSObject = JSObject()
        .put("clientPointId", clientPointId)
        .put("employeeId", employeeId)
        .put("deviceId", deviceId)
        .put("shiftId", shiftId)
        .put("latitude", latitude)
        .put("longitude", longitude)
        .put("accuracyMeters", accuracyMeters)
        .put("capturedAt", capturedAt)
        .put("platform", "android")
        .put("precise", precise)
        .put("source", source)
        .put("mocked", mocked)
        .also { json ->
            altitudeMeters?.let { json.put("altitudeMeters", it) }
            speedMetersPerSecond?.let { json.put("speedMetersPerSecond", it) }
            headingDegrees?.let { json.put("headingDegrees", it) }
        }

    companion object {
        fun fromJson(json: JSONObject): PerformanceLocationRecord = PerformanceLocationRecord(
            clientPointId = json.getString("clientPointId"),
            employeeId = json.getString("employeeId"),
            deviceId = json.getString("deviceId"),
            shiftId = json.getString("shiftId"),
            latitude = json.getDouble("latitude"),
            longitude = json.getDouble("longitude"),
            accuracyMeters = json.getDouble("accuracyMeters"),
            capturedAt = json.getString("capturedAt"),
            precise = json.getBoolean("precise"),
            source = json.optString("source", "android-location-manager"),
            mocked = json.optBoolean("mocked", false),
            altitudeMeters = json.optNullableDouble("altitudeMeters"),
            speedMetersPerSecond = json.optNullableDouble("speedMetersPerSecond"),
            headingDegrees = json.optNullableDouble("headingDegrees"),
        )

        private fun JSONObject.optNullableDouble(name: String): Double? =
            if (has(name) && !isNull(name)) getDouble(name) else null
    }
}

class PerformanceLocationSpool(context: Context) {
    private val spoolFile = File(context.filesDir, "paradise-performance-location-spool-v1.jsonl")
    private val tempFile = File(context.filesDir, "paradise-performance-location-spool-v1.tmp")
    private val lock = Any()

    fun append(record: PerformanceLocationRecord) = synchronized(lock) {
        spoolFile.parentFile?.mkdirs()
        FileOutputStream(spoolFile, true).use { output ->
            val bytes = (record.toJson().toString() + "\n").toByteArray(StandardCharsets.UTF_8)
            output.write(bytes)
            output.flush()
            output.fd.sync()
        }
    }

    fun drain(limit: Int = 250): List<PerformanceLocationRecord> = synchronized(lock) {
        if (!spoolFile.exists()) return@synchronized emptyList()
        val bounded = limit.coerceIn(1, 1000)
        val records = mutableListOf<PerformanceLocationRecord>()
        spoolFile.bufferedReader(StandardCharsets.UTF_8).useLines { lines ->
            for (line in lines) {
                if (line.isBlank()) continue
                try {
                    records += PerformanceLocationRecord.fromJson(JSONObject(line))
                } catch (error: Exception) {
                    throw IOException("Native location spool is unreadable; refusing to discard pending GPS", error)
                }
                if (records.size >= bounded) break
            }
        }
        records
    }

    fun acknowledge(clientPointIds: Set<String>) = synchronized(lock) {
        if (clientPointIds.isEmpty() || !spoolFile.exists()) return@synchronized

        val retained = mutableListOf<String>()
        spoolFile.bufferedReader(StandardCharsets.UTF_8).useLines { lines ->
            for (line in lines) {
                if (line.isBlank()) continue
                val record = try {
                    PerformanceLocationRecord.fromJson(JSONObject(line))
                } catch (error: Exception) {
                    throw IOException("Native location spool is unreadable; refusing to acknowledge pending GPS", error)
                }
                if (!clientPointIds.contains(record.clientPointId)) retained += line
            }
        }

        if (retained.isEmpty()) {
            if (!spoolFile.delete() && spoolFile.exists()) {
                throw IOException("Unable to clear acknowledged native location spool")
            }
            if (tempFile.exists()) tempFile.delete()
            return@synchronized
        }

        FileOutputStream(tempFile, false).use { output ->
            val body = retained.joinToString(separator = "\n", postfix = "\n")
            output.write(body.toByteArray(StandardCharsets.UTF_8))
            output.flush()
            output.fd.sync()
        }
        if (spoolFile.exists() && !spoolFile.delete()) {
            tempFile.delete()
            throw IOException("Unable to replace native location spool")
        }
        if (!tempFile.renameTo(spoolFile)) {
            throw IOException("Unable to commit native location spool acknowledgement")
        }
    }

    fun pendingCount(): Int = synchronized(lock) {
        if (!spoolFile.exists()) return@synchronized 0
        spoolFile.bufferedReader(StandardCharsets.UTF_8).useLines { lines -> lines.count { it.isNotBlank() } }
    }

    fun asJsonArray(records: List<PerformanceLocationRecord>): JSONArray = JSONArray().also { array ->
        records.forEach { array.put(it.toJson()) }
    }
}
