package app.securelink.messaging;

import android.app.Activity;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenshotProtection")
public class ScreenshotProtectionPlugin extends Plugin {

    private boolean isProtectionEnabled = false;

    @PluginMethod
    public void enableProtection(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    // Prevent screenshots and screen recording
                    activity.getWindow().setFlags(
                        WindowManager.LayoutParams.FLAG_SECURE,
                        WindowManager.LayoutParams.FLAG_SECURE
                    );
                    
                    isProtectionEnabled = true;
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Failed to enable screenshot protection: " + e.getMessage());
                }
            });
        } else {
            call.reject("Activity not available");
        }
    }

    @PluginMethod
    public void disableProtection(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    // Allow screenshots and screen recording
                    activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
                    
                    isProtectionEnabled = false;
                    call.resolve();
                } catch (Exception e) {
                    call.reject("Failed to disable screenshot protection: " + e.getMessage());
                }
            });
        } else {
            call.reject("Activity not available");
        }
    }

    @PluginMethod
    public void isProtectionEnabled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", isProtectionEnabled);
        call.resolve(result);
    }
}