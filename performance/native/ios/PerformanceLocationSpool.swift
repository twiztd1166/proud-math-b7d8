import Foundation

struct PerformanceLocationRecord: Codable {
    let clientPointId: String
    let employeeId: String
    let deviceId: String
    let shiftId: String
    let latitude: Double
    let longitude: Double
    let accuracyMeters: Double
    let capturedAt: String
    let precise: Bool
    let source: String
    let mocked: Bool
    let altitudeMeters: Double?
    let speedMetersPerSecond: Double?
    let headingDegrees: Double?

    var dictionary: [String: Any] {
        var value: [String: Any] = [
            "clientPointId": clientPointId,
            "employeeId": employeeId,
            "deviceId": deviceId,
            "shiftId": shiftId,
            "latitude": latitude,
            "longitude": longitude,
            "accuracyMeters": accuracyMeters,
            "capturedAt": capturedAt,
            "platform": "ios",
            "precise": precise,
            "source": source,
            "mocked": mocked,
        ]
        if let altitudeMeters { value["altitudeMeters"] = altitudeMeters }
        if let speedMetersPerSecond { value["speedMetersPerSecond"] = speedMetersPerSecond }
        if let headingDegrees { value["headingDegrees"] = headingDegrees }
        return value
    }
}

/// App-private durable handoff for native GPS samples.
///
/// Every point is committed to disk before listener delivery. JavaScript acknowledges the
/// clientPointId only after its idempotent offline queue accepts the record. The spool is
/// transport evidence only; it never grants authorization or changes field Lookup authority.
final class PerformanceLocationSpool {
    private let lock = NSLock()
    private let fileURL: URL
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init() {
        let fm = FileManager.default
        let base = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? fm.urls(for: .documentDirectory, in: .userDomainMask).first!
        let directory = base.appendingPathComponent("ParadisePerformance", isDirectory: true)
        try? fm.createDirectory(at: directory, withIntermediateDirectories: true)
        self.fileURL = directory.appendingPathComponent("location-spool-v1.json")
    }

    func append(_ record: PerformanceLocationRecord) throws {
        try withLock {
            var records = try readUnlocked()
            records.append(record)
            try writeUnlocked(records)
        }
    }

    func drain(limit: Int = 250) throws -> [PerformanceLocationRecord] {
        try withLock {
            let bounded = max(1, min(1000, limit))
            return Array(try readUnlocked().prefix(bounded))
        }
    }

    func acknowledge(clientPointIds: Set<String>) throws {
        guard clientPointIds.isEmpty == false else { return }
        try withLock {
            let retained = try readUnlocked().filter { clientPointIds.contains($0.clientPointId) == false }
            try writeUnlocked(retained)
        }
    }

    func pendingCount() throws -> Int {
        try withLock { try readUnlocked().count }
    }

    private func readUnlocked() throws -> [PerformanceLocationRecord] {
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return [] }
        do {
            return try decoder.decode([PerformanceLocationRecord].self, from: Data(contentsOf: fileURL))
        } catch {
            throw NSError(
                domain: "ParadisePerformanceLocationSpool",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Native location spool is unreadable; refusing to discard pending GPS"]
            )
        }
    }

    private func writeUnlocked(_ records: [PerformanceLocationRecord]) throws {
        if records.isEmpty {
            if FileManager.default.fileExists(atPath: fileURL.path) {
                try FileManager.default.removeItem(at: fileURL)
            }
            return
        }
        let data = try encoder.encode(records)
        try data.write(to: fileURL, options: [.atomic])
    }

    private func withLock<T>(_ work: () throws -> T) rethrows -> T {
        lock.lock()
        defer { lock.unlock() }
        return try work()
    }
}
