import Foundation
import TelematicsSDK
import UIKit

@objc(TelematicsSdk)
class TelematicsSdk: RCTEventEmitter, RPLowPowerModeDelegate {

    private var hasLowPowerListeners = false;
        private var lowPowerEventName = "onLowPowerModeEnabled"
        
        private var lowPowerModeCallback: RCTResponseSenderBlock?
        private var tagsStateDelegate: TagsStateDelegate?

        // used to allow UI operations
        @objc override static func requiresMainQueueSetup() -> Bool {
            return true
        }
        
        // Initialization and permission request
        @objc(initialize)
        func initialize() {
            tagsStateDelegate = TagsStateDelegate()
            //RPEntry.instance.api.tag = tagsStateDelegate // Seems to be removed?
            RPEntry.instance.lowPowerModeDelegate = self
            //RPEntry.enableHF(true) // Enabled by default now
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
                RPEntry.instance.virtualDeviceToken = String(token)
                RPEntry.instance.setEnableSdk(true)
                RPEntry.instance.disableTracking = false
                //RPTracker.instance.startPersistentTracking()
                resolve(RPEntry.instance.isSDKEnabled())
            }
        }
        
        @objc(disable)
        func disable() {
            //RPEntry.instance.disableTracking = true
            //RPEntry.instance.setDisableWithUpload() // deprecated: https://docs.damoov.com/docs/methods-for-ios-app
            //RPEntry.instance.removeVirtualDeviceToken()
            RPEntry.instance.setEnableSdk(false)
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
            let tagEntity = RPFutureTag(
                tag: tag as String,
                source: source as String
            )
            if let stateDelegate = tagsStateDelegate {
                stateDelegate.addTagPromise = Promise(resolve:resolve, reject: reject)
            }
            RPEntry.instance.api.addFutureTrackTag(tagEntity,completion:{[weak self]status, error in
                if let error {
                    reject("Error", error.localizedDescription, nil)
                    return
                }
                guard let self else {return}
                self.tagsStateDelegate?.addFutureTag(status, tag: tagEntity)
            })
        }
        
        @objc(removeFutureTrackTag:source:resolver:rejecter:)
        func removeFutureTrackTag(_ tag: NSString, _ source: NSString, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            // TODO
            let tagEntity = RPFutureTag(
                tag: tag as String,
                source: source as String
            )
            if let stateDelegate = tagsStateDelegate {
                stateDelegate.deleteTagPromise = Promise(resolve: resolve, reject: reject)
            }
            RPEntry.instance.api.removeFutureTrackTag(tagEntity, completion: {[weak self]status, error in
                if let error {
                    reject("Error", error.localizedDescription, nil)
                    return
                }
                guard let self else {return}
                self.tagsStateDelegate?.removeFutureTrackTag(status, tag: tagEntity)
            })
        }
        
        @objc(removeAllFutureTrackTags:rejecter:)
        func removeAllFutureTrackTags(_ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
            if let stateDelegate = tagsStateDelegate {
                stateDelegate.removeAllPromise = Promise(resolve: resolve, reject: reject)
            }
          RPEntry.instance.api.removeAllFutureTrackTags(completion: {[weak self] status, error in
                if let error {
                    reject("Error", error.localizedDescription, nil)
                    return
                }
                guard let self else {return}
                self.tagsStateDelegate?.removeAllFutureTrackTag(status)
        })
        }
        
        @objc(getFutureTrackTags:rejecter:)
        func getFutureTrackTags(_ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
            if let stateDelegate = tagsStateDelegate {
                stateDelegate.getTagsPromise = Promise(resolve: resolve, reject: reject)
            }
            let dateExample = Date()
            RPEntry.instance.api.getFutureTrackTag(dateExample, completion: {[weak self]status, tags in
                guard let self else {return}
                self.tagsStateDelegate?.getTags(status, tags: tags)
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
}
