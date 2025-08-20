import Foundation
import Capacitor
import UIKit

@objc(ScreenshotProtectionPlugin)
public class ScreenshotProtectionPlugin: CAPPlugin {
    private var isProtectionEnabled = false
    private var screenshotObserver: NSObjectProtocol?
    
    @objc func enableProtection(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Add a secure view overlay to prevent screenshots
            if let window = UIApplication.shared.windows.first {
                let secureView = UIView(frame: window.bounds)
                secureView.backgroundColor = UIColor.clear
                secureView.isUserInteractionEnabled = false
                secureView.tag = 999999 // Unique tag for identification
                
                // Make the view secure
                secureView.layer.contents = nil
                window.addSubview(secureView)
                window.makeSecure()
            }
            
            // Listen for screenshot notifications
            self.screenshotObserver = NotificationCenter.default.addObserver(
                forName: UIApplication.userDidTakeScreenshotNotification,
                object: nil,
                queue: .main
            ) { _ in
                // Notify the web layer of screenshot attempt
                self.notifyListeners("screenshotAttempt", data: [
                    "timestamp": Date().timeIntervalSince1970 * 1000
                ])
            }
            
            self.isProtectionEnabled = true
            call.resolve()
        }
    }
    
    @objc func disableProtection(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Remove secure view overlay
            if let window = UIApplication.shared.windows.first {
                for subview in window.subviews {
                    if subview.tag == 999999 {
                        subview.removeFromSuperview()
                    }
                }
                window.makeNormal()
            }
            
            // Remove screenshot observer
            if let observer = self.screenshotObserver {
                NotificationCenter.default.removeObserver(observer)
                self.screenshotObserver = nil
            }
            
            self.isProtectionEnabled = false
            call.resolve()
        }
    }
    
    @objc func isProtectionEnabled(_ call: CAPPluginCall) {
        call.resolve(["enabled": isProtectionEnabled])
    }
}

extension UIWindow {
    func makeSecure() {
        // Additional iOS-specific security measures
        if #available(iOS 13.0, *) {
            // Prevent screen recording in recent iOS versions
            let fieldClass = NSClassFromString("UITextEffectsWindow")
            if let field = fieldClass {
                let windows = UIApplication.shared.windows
                for window in windows {
                    if window.isKind(of: field) {
                        window.isHidden = false
                    }
                }
            }
        }
    }
    
    func makeNormal() {
        // Restore normal functionality
        let fieldClass = NSClassFromString("UITextEffectsWindow")
        if let field = fieldClass {
            let windows = UIApplication.shared.windows
            for window in windows {
                if window.isKind(of: field) {
                    window.isHidden = true
                }
            }
        }
    }
}