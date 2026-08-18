import UIKit
import Capacitor

public final class PerformanceBridgeViewController: CAPBridgeViewController {
    override public func capacitorDidLoad() {
        bridge?.registerPluginInstance(PerformanceLocationPlugin())
        bridge?.registerPluginInstance(PerformanceSecureStoragePlugin())
    }
}
