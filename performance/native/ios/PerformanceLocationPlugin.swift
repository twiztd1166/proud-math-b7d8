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
    ]

    private let manager = CLLocationManager()
    private let activeShiftKey = "ParadisePerformance.activeShiftId"
    private var activeShiftId: String?
    private var isTrackingInProcess = false
    private var lastLocation: CLLocation?
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
        activeShiftId = UserDefaults.standard.string(forKey: activeShiftKey)
        isTrackingInProcess = false
        // Critical invariant: loading the plugin never starts location updates.
        // A persisted shift may be resumed only by reattachShiftTracking after the web layer
        // confirms the same authoritative active shift.
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
        guard let shiftId = call.getString("shiftId"), shiftId.isEmpty == false else {
            call.reject("shiftId is required")
            return
        }
        guard isAuthorizedForLocation() else {
            call.reject("Location permission is required")
            return
        }
        if let existing = activeShiftId, existing != shiftId {
            call.reject("Another shift is already tracking")
            return
        }

        activeShiftId = shiftId
        UserDefaults.standard.set(shiftId, forKey: activeShiftKey)
        beginUpdates()
        call.resolve(trackingStatus())
    }

    @objc public func reattachShiftTracking(_ call: CAPPluginCall) {
        guard let shiftId = call.getString("shiftId"), shiftId.isEmpty == false else {
            call.reject("shiftId is required")
            return
        }
        let persisted = UserDefaults.standard.string(forKey: activeShiftKey)
        guard persisted == shiftId else {
            call.reject("No persisted matching shift may be reattached")
            return
        }
        guard isAuthorizedForLocation() else {
            call.reject("Location permission is required")
            return
        }

        activeShiftId = shiftId
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
        activeShiftId = nil
        UserDefaults.standard.removeObject(forKey: activeShiftKey)
        call.resolve(trackingStatus())
    }

    @objc public func getTrackingStatus(_ call: CAPPluginCall) {
        activeShiftId = UserDefaults.standard.string(forKey: activeShiftKey)
        call.resolve(trackingStatus())
    }

    @objc public func getCurrentLocation(_ call: CAPPluginCall) {
        if let location = lastLocation ?? manager.location {
            call.resolve(sample(location))
            return
        }
        guard isAuthorizedForLocation() else {
            call.reject("Location permission is required")
            return
        }
        pendingCurrentLocationCall = call
        manager.requestLocation()
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard let call = pendingPermissionCall else { return }
        if manager.authorizationStatus == .notDetermined { return }
        pendingPermissionCall = nil
        call.resolve(["state": permissionState()])
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        lastLocation = location
        let payload = sample(location)

        if let call = pendingCurrentLocationCall {
            pendingCurrentLocationCall = nil
            call.resolve(payload)
        }

        guard activeShiftId != nil else { return }
        notifyListeners("location", data: payload)
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
            "active": activeShiftId != nil,
            "shiftId": activeShiftId ?? NSNull(),
            "running": isTrackingInProcess,
        ]
    }

    private func sample(_ location: CLLocation) -> [String: Any] {
        var mocked = false
        if #available(iOS 15.0, *) {
            mocked = location.sourceInformation?.isSimulatedBySoftware ?? false
        }

        var payload: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracyMeters": max(0, location.horizontalAccuracy),
            "capturedAt": isoFormatter.string(from: location.timestamp),
            "platform": "ios",
            "precise": manager.accuracyAuthorization == .fullAccuracy,
            "source": "core-location",
            "mocked": mocked,
        ]

        if location.verticalAccuracy >= 0 { payload["altitudeMeters"] = location.altitude }
        if location.speed >= 0 { payload["speedMetersPerSecond"] = location.speed }
        if location.course >= 0 { payload["headingDegrees"] = location.course }
        return payload
    }
}
