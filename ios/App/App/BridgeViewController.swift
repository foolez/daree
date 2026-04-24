import UIKit
import Capacitor

/**
 Ensures the embedded WKWebView always scrolls vertically in the native shell
 (TestFlight / App Store). Some CSS or OS combinations leave scroll disabled.
 */
final class BridgeViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        applyScrollTuning()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        applyScrollTuning()
    }

    private func applyScrollTuning() {
        guard let wk = webView else { return }
        let sv = wk.scrollView
        sv.isScrollEnabled = true
        sv.bounces = true
        sv.alwaysBounceVertical = true
        sv.isDirectionalLockEnabled = false
        if #available(iOS 12.0, *) {
            sv.contentInsetAdjustmentBehavior = .scrollableAxes
        }
    }
}
