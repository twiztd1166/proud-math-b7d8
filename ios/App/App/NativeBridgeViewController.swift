import UIKit
import WebKit
import Capacitor

final class NativeBridgeViewController: CAPBridgeViewController, WKScriptMessageHandler {
    private let handlerName = "paradiseNative"
    private var pendingRoute: String?

    override func viewDidLoad() {
        super.viewDidLoad()
        bridge?.webView?.configuration.userContentController.add(self, name: handlerName)
    }

    deinit {
        bridge?.webView?.configuration.userContentController.removeScriptMessageHandler(forName: handlerName)
    }

    func openRoute(_ route: String) {
        let allowed = ["today", "calendar", "shows", "payments", "control"]
        let target = allowed.contains(route) ? route : "today"
        guard isViewLoaded, let webView = bridge?.webView else {
            pendingRoute = target
            return
        }
        webView.evaluateJavaScript("window.location.hash = '#\\(target)'")
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        if let route = pendingRoute {
            pendingRoute = nil
            openRoute(route)
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == handlerName,
              let payload = message.body as? [String: Any],
              let action = payload["action"] as? String else { return }

        switch action {
        case "haptic":
            UIImpactFeedbackGenerator(style: .light).impactOccurred()

        case "share":
            let title = payload["title"] as? String ?? "Paradise Shows"
            let text = payload["text"] as? String ?? ""
            var items: [Any] = [title]
            if !text.isEmpty { items.append(text) }
            if let urlString = payload["url"] as? String, let url = URL(string: urlString) {
                items.append(url)
            }
            let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
            if let popover = sheet.popoverPresentationController {
                popover.sourceView = view
                popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.maxY - 40, width: 1, height: 1)
            }
            present(sheet, animated: true)

        default:
            break
        }
    }
}
