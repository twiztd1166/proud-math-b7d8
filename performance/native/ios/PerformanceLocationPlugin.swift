import Foundation
import CoreLocation
import Capacitor

@objc(PerformanceLocationPlugin)
public final class PerformanceLocationPlugin: CAPPlugin, CAPBridgedPlugin, CLLocationManagerDelegate {
    public let identifier = "PerformanceLocationPlugin"
    public let jsName = "PerformanceLocation"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getPermissionState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestShiftLocationPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startShiftTracking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reattachShiftTracking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopShiftTracking", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getTrackingStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCurrentLocation", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "drainPendingLocations", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ackPendingLocations", returnType: CAPPluginReturnPromise),
    ]

    private let manager = CLLocationManager()
    private let spool = PerformanceLocationSpool()
    private let activeShiftKey = "ParadisePerformance.activeShiftId"
    private let activeEmployeeKey = "ParadisePerformance.activeEmployeeId"
    private let activeDeviceKey = "ParadisePerformance.activeDeviceId"
    private var activeShiftId: String?
    private var activeEmployeeId: String?
    private var activeDeviceId: String?
    private var isTrackingInProcess = false
    private var lastRecord: PerformanceLocationRecord?
    private var pendingPermissionCall: CAPPluginCall?
    private var pendingCurrentLocationCall: CAPPluginCall?

    private lazy var isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    override public func load() {
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 10
        manager.activityType = .otherNavigation
        loadPersistedContext()
        isTrackingInProcess = false
        // Critical invariant: loading the plugin never starts location updates.
        // A persisted context may be resumed only by reattachShiftTracking after the web layer
        // confirms the same authoritative shift, employee, and device.
    }

    @objc public func getPermissionState(_ call: CAPPluginCall) {
        call.resolve(["state": permissionState()])
    }

    @objc public func requestShiftLocationPermission(_ call: CAPPluginCall) {
        if CLLocationManager.locationServicesEnabled() == false {
            call.resolve(["state": "RESTRICTED"])
            return
        }

        switch manager.authorizationStatus {
        case .notDetermined:
            pendingPermissionCall = call
            manager.requestWhenInUseAuthorization()
        default:
            call.resolve(["state": permissionState()])
        }
    }

    @objc public func startShiftTracking(_ call: CAPPluginCall) {
        guard call.getBool("initiatedByUser") == true else {
            call.reject("Shift tracking may start only from the visible Start My Day action")
            return
        }
        guard let shiftId = call.getString("shiftId"), shiftId.isEmpty == false,
              let employeeId = call.getString("employeeId"), employeeId.isEmpty == false,
              let deviceId = call.getString("deviceId"), deviceId.isEmpty == false else {
            call.reject("shiftId, employeeId, and deviceId are required")
            return
        }
        guard isAuthorizedForLocation() else {
            call.reject("Location permission is required")
            return
        }
        if let existing = persistedContext(), existing != (shiftId, employeeId, deviceId) {
            call.reject("Another shift or device context is already tracking")
            return
        }

        persistContext(shiftId: shiftId, employeeId: employeeId, deviceId: deviceId)
        beginUpdates()
        call.resolve(trackingStatus())
    }

    @objc public func reattachShiftTracking(_ call: CAPPluginCall) {
        guard let shiftId = call.getString("shiftId"), shiftId.isEmpty == false,
              let employeeId = call.getString("employeeId"), employeeId.isEmpty == false,
              let deviceId = call.getString("deviceId"), deviceId.isEmpty == false else {
            call.reject("shiftId, employeeId, and deviceId are required")
            return
        }
        guard let persisted = persistedContext(),
              persisted.0 == shiftId,
              persisted.1 == employeeId,
              persisted.2 == deviceId else {
            call.reject("No persisted matching shift/device context may be reattached")
            return
        }
        guard isAuthorizedForLocation() else {
            call.reject("Location permission is required")
            return
        }

        activeShiftId = shiftId
        activeEmployeeId = employeeId
        activeDeviceId = deviceId
        beginUpdates()
        call.resolve(trackingStatus())
    }

    @objc public func stopShiftTracking(_ call: CAPPluginCall) {
        if let requested = call.getString("shiftId"),
           let active = activeShiftId,
           requested.isEmpty == false,
           requested != active {
            call.reject("Cannot stop a different shift")
            return
        }

        manager.stopUpdatingLocation()
        manager.allowsBackgroundLocationUpdates = false
        isTrackingInProcess = false
        lastRecord = nil
        clearPersistedContext()
        call.resolve(trackingStatus())
    }

    @objc public func getTrackingStatus(_ call: CAPPluginCall) {
        loadPersistedContext()
        call.resolve(trackingStatus())
    }

    @objc public func getCurrentLocation(_ call: CAPPluginCall) {
        guard let context = persistedContext() else {
            call.reject("No active shift location context")
            return
        }
        if let record = lastRecord,
           record.shiftId == context.0,
           record.employeeId == context.1,
           record.deviceId == context.2 {
            call.resolve(record.dictionary)
            return
        }
        if let location = manager.location {
            do {
                call.resolve(try persist(location: location).dictionary)
            } catch {
                call.reject("Unable to persist current native location: \(error.localizedDescription)")
            }
            return
        }
        guard isAuthorizedForLocation() else {
            call.reject("Location permission is required")
            return
        }
        pendingCurrentLocationCall = call
        manager.requestLocation()
    }

    @objc public func drainPendingLocations(_ call: CAPPluginCall) {
        do {
            let limit = max(1, min(1000, call.getInt("limit") ?? 250))
            let records = try spool.drain(limit: limit)
            let remaining = max(0, try spool.pendingCount() - records.count)
            call.resolve([
                "samples": records.map { $0.dictionary },
                "remaining": remaining,
            ])
        } catch {
            call.reject("Unable to read pending native locations: \(error.localizedDescription)")
        }
    }

    @objc public func ackPendingLocations(_ call: CAPPluginCall) {
        guard let values = call.getArray("clientPointIds", String.self) else {
            call.reject("clientPointIds is required")
            return
        }
        do {
            let ids = Set(values.filter { $0.isEmpty == false })
            try spool.acknowledge(clientPointIds: ids)
            call.resolve([
                "acknowledged": ids.count,
                "pending": try spool.pendingCount(),
            ])
        } catch {
            call.reject("Unable to acknowledge pending native locations: \(error.localizedDescription)")
        }
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard let call = pendingPermissionCall else { return }
        if manager.authorizationStatus == .notDetermined { return }
        pendingPermissionCall = nil
        call.resolve(["state": permissionState()])
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        var newest: PerformanceLocationRecord?
        for location in locations {
            do {
                let record = try persist(location: location)
                newest = record
                notifyListeners("location", data: record.dictionary)
            } catch {
                CAPLog.print("Paradise Performance location spool write failed; point not delivered to JS: \(error.localizedDescription)")
            }
        }

        if let call = pendingCurrentLocationCall, let newest {
            pendingCurrentLocationCall = nil
            call.resolve(newest.dictionary)
        }
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if let call = pendingCurrentLocationCall {
            pendingCurrentLocationCall = nil
            call.reject("Unable to obtain current location: \(error.localizedDescription)")
        }
    }

    private func beginUpdates() {
        manager.desiredAccuracy = manager.accuracyAuthorization == .fullAccuracy
            ? kCLLocationAccuracyBest
            : kCLLocationAccuracyKilometer
        manager.allowsBackgroundLocationUpdates = true
        manager.pausesLocationUpdatesAutomatically = false
        manager.showsBackgroundLocationIndicator = true
        manager.startUpdatingLocation()
        isTrackingInProcess = true
    }

    private func persist(location: CLLocation) throws -> PerformanceLocationRecord {
        guard let shiftId = activeShiftId,
              let employeeId = activeEmployeeId,
              let deviceId = activeDeviceId else {
            throw NSError(
                domain: "ParadisePerformanceLocation",
                code: 2,
                userInfo: [NSLocalizedDescriptionKey: "No active shift/device context for native location"]
            )
        }

        var mocked = false
        if #available(iOS 15.0, *) {
            mocked = location.sourceInformation?.isSimulatedBySoftware ?? false
        }

        let record = PerformanceLocationRecord(
            clientPointId: UUID().uuidString.lowercased(),
            employeeId: employeeId,
            deviceId: deviceId,
            shiftId: shiftId,
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            accuracyMeters: max(0, location.horizontalAccuracy),
            capturedAt: isoFormatter.string(from: location.timestamp),
            precise: manager.accuracyAuthorization == .fullAccuracy,
            source: "core-location",
            mocked: mocked,
            altitudeMeters: location.verticalAccuracy >= 0 ? location.altitude : nil,
            speedMetersPerSecond: location.speed >= 0 ? location.speed : nil,
            headingDegrees: location.course >= 0 ? location.course : nil
        )
        // Persist before listener delivery so suspension/webview loss cannot erase the point.
        try spool.append(record)
        lastRecord = record
        return record
    }

    private func isAuthorizedForLocation() -> Bool {
        switch manager.authorizationStatus {
        case .authorizedAlways, .authorizedWhenInUse:
            return true
        default:
            return false
        }
    }

    private func permissionState() -> String {
        guard CLLocationManager.locationServicesEnabled() else { return "RESTRICTED" }
        switch manager.authorizationStatus {
        case .notDetermined:
            return "NOT_DETERMINED"
        case .denied:
            return "DENIED"
        case .restricted:
            return "RESTRICTED"
        case .authorizedAlways, .authorizedWhenInUse:
            return manager.accuracyAuthorization == .fullAccuracy
                ? "GRANTED_PRECISE"
                : "GRANTED_APPROXIMATE"
        @unknown default:
            return "RESTRICTED"
        }
    }

    private func trackingStatus() -> [String: Any] {
        return [
            "active": persistedContext() != nil,
            "shiftId": activeShiftId ?? NSNull(),
            "employeeId": activeEmployeeId ?? NSNull(),
            "deviceId": activeDeviceId ?? NSNull(),
            "running": isTrackingInProcess,
            "pendingNativeLocations": (try? spool.pendingCount()) ?? -1,
        ]
    }

    private func persistedContext() -> (String, String, String)? {
        guard let shiftId = UserDefaults.standard.string(forKey: activeShiftKey), shiftId.isEmpty == false,
              let employeeId = UserDefaults.standard.string(forKey: activeEmployeeKey), employeeId.isEmpty == false,
              let deviceId = UserDefaults.standard.string(forKey: activeDeviceKey), deviceId.isEmpty == false else {
            return nil
        }
        return (shiftId, employeeId, deviceId)
    }

    private func loadPersistedContext() {
        if let context = persistedContext() {
            activeShiftId = context.0
            activeEmployeeId = context.1
            activeDeviceId = context.2
        } else {
            activeShiftId = nil
            activeEmployeeId = nil
            activeDeviceId = nil
        }
    }

    private func persistContext(shiftId: String, employeeId: String, deviceId: String) {
        UserDefaults.standard.set(shiftId, forKey: activeShiftKey)
        UserDefaults.standard.set(employeeId, forKey: activeEmployeeKey)
        UserDefaults.standard.set(deviceId, forKey: activeDeviceKey)
        activeShiftId = shiftId
        activeEmployeeId = employeeId
        activeDeviceId = deviceId
    }

    private func clearPersistedContext() {
        UserDefaults.standard.removeObject(forKey: activeShiftKey)
        UserDefaults.standard.removeObject(forKey: activeEmployeeKey)
        UserDefaults.standard.removeObject(forKey: activeDeviceKey)
        activeShiftId = nil
        activeEmployeeId = nil
        activeDeviceId = nil
    }
}
