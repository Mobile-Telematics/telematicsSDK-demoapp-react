import Foundation
import TelematicsSDK
import UIKit

@objc(TelematicsSdk)
class TelematicsSdk: RCTEventEmitter, RPLowPowerModeDelegate {

    private var hasLowPowerListeners = false;
        private var lowPowerEventName = "onLowPowerModeEnabled"
        
        private var lowPowerModeCallback: RCTResponseSenderBlock?
        // used to allow UI operations
        @objc override static func requiresMainQueueSetup() -> Bool {
            return true
        }
        
        // Initialization and permission request
        @objc(initialize)
        func initialize() {
            RPEntry.instance.lowPowerModeDelegate = self
        }
        
        @objc(requestPermissions:rejecter:)
        func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            if RPEntry.instance.isAllRequiredPermissionsGranted() {
                resolve(true)
                return
            }
            DispatchQueue.main.async {
                RPPermissionsWizard.returnInstance().launch(finish: {_ in
                    RPEntry.instance.isAllRequiredPermissionsGranted() ? resolve(true) : resolve(false)
                })
            }
        }
        
        // Enabling and disabling SDK
        @objc(enable:resolver:rejecter:)
        func enable(_ token: NSString, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            if(token.length == 0) {
                reject("Error", "Missing token value", nil)
                return
            }
            
            DispatchQueue.main.async {
                RPEntry.instance.virtualDeviceToken = token as String
                RPEntry.instance.setEnableSdk(true)
                RPEntry.instance.disableTracking = false
                resolve(RPEntry.instance.isSDKEnabled())
            }
        }
        
        @objc(disable)
        func disable() {
            RPEntry.instance.disableTracking = true
            RPEntry.instance.setEnableSdk(false)
            RPEntry.instance.removeVirtualDeviceToken()
        }
        
        // API Status
        @objc(getStatus:rejecter:)
        func getStatus(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            resolve(RPEntry.instance.isSDKEnabled())
        }
    
        // Device token
        @objc(getDeviceToken:rejecter:)
        func getDeviceToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            resolve(RPEntry.instance.virtualDeviceToken)
        }
        
        // Start persistent tracking
        @objc(startPersistentTracking:rejecter:)
        func startPersistentTracking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            RPEntry.instance.startPersistentTracking()
            resolve(true)
        }

        // Tags API
        @objc(addFutureTrackTag:source:resolver:rejecter:)
        func addFutureTrackTag(_ tag: NSString, _ source: NSString, _ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
            let tagEntity = RPFutureTag(tag: tag as String, source: source as String)
            RPEntry.instance.api.addFutureTrackTag(tagEntity, completion: { status, error in
                if let err = error {
                    reject("ERROR", err.localizedDescription, err)
                } else {
                    let result: [String: Any] = ["status": self.parseTagStatus(status: status), "tag": ["tag": tag, "source": source]]
                    resolve(result)
                }
            })
        }
        
        @objc(removeFutureTrackTag:resolver:rejecter:)
        func removeFutureTrackTag(_ tag: NSString, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            let tagEntity = RPFutureTag(tag: tag as String, source: nil)
            RPEntry.instance.api.removeFutureTrackTag(tagEntity, completion: { status, error in
                if let err = error {
                    reject("ERROR", err.localizedDescription, err)
                } else {
                    let result: [String: Any] = ["status": self.parseTagStatus(status: status), "tag": ["tag": tag]]
                    resolve(result)
                }
            })
        }
        
        @objc(removeAllFutureTrackTags:rejecter:)
        func removeAllFutureTrackTags(_ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
            RPEntry.instance.api.removeAllFutureTrackTags(completion: { status, error in
                if let err = error {
                    reject("ERROR", err.localizedDescription, err)
                } else {
                    resolve(self.parseTagStatus(status: status))
                }
            })
        }
        
        @objc(getFutureTrackTags:rejecter:)
        func getFutureTrackTags(_ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
            RPEntry.instance.api.getFutureTrackTag(nil, completion: { status, tags in
                let tagsList = tags.map { ["tag": $0.tag ?? "", "source": $0.source ?? ""] }
                let result: [String: Any] = ["status": self.parseTagStatus(status: status), "tags": tagsList]
                resolve(result)
            })
        }
        
        // Low power mode
        override func supportedEvents() -> [String]! {
            return [lowPowerEventName]
        }
        
        override func startObserving() {
            hasLowPowerListeners = true
        }
        
        override func stopObserving() {
            hasLowPowerListeners = false
        }
        
        func lowPowerMode(_ state: Bool) {
            // if state == true low power mode was enabled
            if self.hasLowPowerListeners && (state == true) {
                self.sendEvent(withName: self.lowPowerEventName, body: nil)
            }
        }
        
        

        // Helper method to parse tag status
        private func parseTagStatus(status: RPTagStatus) -> String {
            switch status {
            case .success:
                return "Success"
            case .offline:
                return "Offline"
            case .errorTagOperation:
                return "Wrong tag operation"
            @unknown default:
                return "Unknown error"
            }
        }
}
