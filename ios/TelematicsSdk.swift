import Foundation
import RaxelPulse
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
            RPEntry.instance().tagStateDelegate = tagsStateDelegate
            RPEntry.instance().lowPowerModeDelegate = self
            RPEntry.enableHF(true)
        }
        
        @objc(requestPermissions:rejecter:)
        func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            if RPEntry.isAllRequiredPermissionsGranted() {
                resolve(true)
                return
            }
            DispatchQueue.main.async {
                RPPermissionsWizard.returnInstance().launch(finish: {_ in
                    RPEntry.isAllRequiredPermissionsGranted() ? resolve(true) : resolve(false)
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
                RPEntry.instance().virtualDeviceToken = token
                RPEntry.instance().setEnableSdk(true)
                RPEntry.instance().disableTracking = false
                //RPTracker.instance().startPersistentTracking()
                resolve(RPEntry.isSDKEnabled())
            }
        }
        
        @objc(disable)
        func disable() {
            RPEntry.instance().disableTracking = true
            RPEntry.instance().setDisableWithUpload()
            //RPEntry.instance().removeVirtualDeviceToken()
        }
        
        // API Status
        @objc(getStatus:rejecter:)
        func getStatus(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            resolve(RPEntry.isSDKEnabled())
        }
    
        // Device token
        @objc(getDeviceToken:rejecter:)
        func getDeviceToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            resolve(RPEntry.instance().virtualDeviceToken)
        }
        
        // Tags API
        @objc(addFutureTrackTag:source:resolver:rejecter:)
        func addFutureTrackTag(_ tag: NSString, _ source: NSString, _ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
            let tagEntity = RPTag.init()
            tagEntity.tag = tag as String
            tagEntity.source = source as String
            if let stateDelegate = tagsStateDelegate {
                stateDelegate.addTagPromise = Promise(resolve:resolve, reject: reject)
            }
            RPEntry.instance().api.addFutureTrackTag(tagEntity,completion:{status, tag, timestamp in
                self.tagsStateDelegate?.addFutureTag(status,tag: tag,timestamp: timestamp)
            })
        }
        
        @objc(removeFutureTrackTag:resolver:rejecter:)
        func removeFutureTrackTag(_ tag: NSString, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
            let tagEntity = RPTag.init()
            tagEntity.tag = tag as String
            if let stateDelegate = tagsStateDelegate {
                stateDelegate.deleteTagPromise = Promise(resolve: resolve, reject: reject)
            }
            RPEntry.instance().api.removeFutureTrackTag(tagEntity, completion: { [weak self] status, tag, timestamp in
                guard let self else {return}
                self.tagsStateDelegate?.removeFutureTrackTag(status ,tag:tag, timestamp:timestamp)})
        }
        
        @objc(removeAllFutureTrackTags:rejecter:)
        func removeAllFutureTrackTags(_ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
            if let stateDelegate = tagsStateDelegate {
                stateDelegate.removeAllPromise = Promise(resolve: resolve, reject: reject)
            }
            RPEntry.instance().api.removeAllFutureTrackTagsWithСompletion({[weak self] status, timestamp in
                guard let self else {return}
                self.tagsStateDelegate?.removeAllFutureTrackTag(status, timestamp: timestamp)})
        }
        
        @objc(getFutureTrackTags:rejecter:)
        func getFutureTrackTags(_ resolve: @escaping RCTPromiseResolveBlock, _ reject: @escaping RCTPromiseRejectBlock) {
            if let stateDelegate = tagsStateDelegate {
                stateDelegate.getTagsPromise = Promise(resolve: resolve, reject: reject)
            }
            RPEntry.instance().api.getFutureTrackTag(0, completion: {[weak self]status, tags, timestamp in
                guard let self else {return}
                self.tagsStateDelegate?.getTags(status, tags: tags, timestamp: timestamp)
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
