import Foundation
import Security
import Capacitor

@objc(PerformanceSecureStoragePlugin)
public final class PerformanceSecureStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PerformanceSecureStoragePlugin"
    public let jsName = "PerformanceSecureStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeItem", returnType: CAPPluginReturnPromise),
    ]

    private let service = "com.paradiseexteriors.performance.secure-session"

    @objc public func getItem(_ call: CAPPluginCall) {
        guard let key = requiredKey(call) else { return }
        var item: CFTypeRef?
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecAttrSynchronizable as String: false,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound {
            call.resolve(["value": NSNull()])
            return
        }
        guard status == errSecSuccess, let data = item as? Data, let value = String(data: data, encoding: .utf8) else {
            call.reject("Unable to read protected session value", nil, NSError(domain: NSOSStatusErrorDomain, code: Int(status)))
            return
        }
        call.resolve(["value": value])
    }

    @objc public func setItem(_ call: CAPPluginCall) {
        guard let key = requiredKey(call) else { return }
        guard let value = call.getString("value"), let data = value.data(using: .utf8) else {
            call.reject("value is required")
            return
        }

        let match: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecAttrSynchronizable as String: false,
        ]
        let update: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        var status = SecItemUpdate(match as CFDictionary, update as CFDictionary)
        if status == errSecItemNotFound {
            var add = match
            add[kSecValueData as String] = data
            add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            status = SecItemAdd(add as CFDictionary, nil)
        }
        guard status == errSecSuccess else {
            call.reject("Unable to store protected session value", nil, NSError(domain: NSOSStatusErrorDomain, code: Int(status)))
            return
        }
        call.resolve()
    }

    @objc public func removeItem(_ call: CAPPluginCall) {
        guard let key = requiredKey(call) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecAttrSynchronizable as String: false,
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            call.reject("Unable to remove protected session value", nil, NSError(domain: NSOSStatusErrorDomain, code: Int(status)))
            return
        }
        call.resolve()
    }

    private func requiredKey(_ call: CAPPluginCall) -> String? {
        guard let key = call.getString("key"), key.isEmpty == false else {
            call.reject("key is required")
            return nil
        }
        return key
    }
}
