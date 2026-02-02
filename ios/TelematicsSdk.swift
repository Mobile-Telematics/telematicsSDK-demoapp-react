import Foundation
import TelematicsSDK
import UIKit

@objc(TelematicsSdk)
public class TelematicsSdk: RCTEventEmitter, RPLowPowerModeDelegate {
  
  private var hasLowPowerListeners = false
  private var lowPowerEventName = "onLowPowerModeEnabled"
  
  private var lowPowerModeCallback: RCTResponseSenderBlock?
  // used to allow UI operations
  @objc public override static func requiresMainQueueSetup() -> Bool { true }
  
  override init() {
    super.init()
    RPEntry.instance.lowPowerModeDelegate = self
  }
  
  @objc(initialize)
  public func initialize() {}
  
  @objc(isInitialized:rejecter:)
  public func isInitialized(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let isInitialized = RPEntry.isInitialized
    resolve(isInitialized)
  }
  
  @objc(getDeviceId:rejecter:)
  public func getDeviceId(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.virtualDeviceToken ?? "")
  }
  
  @objc(setDeviceId:resolver:rejecter:)
  public func setDeviceId(
    _ deviceId: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.virtualDeviceToken = String(deviceId)
    resolve(nil)
  }
  
  @objc(logout:rejecter:)
  public func logout(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.logout()
    resolve(nil)
  }
  
  @objc(isAllRequiredPermissionsAndSensorsGranted:rejecter:)
  public func isAllRequiredPermissionsAndSensorsGranted(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isAllRequiredPermissionsGranted())
  }
  
  @objc(isSdkEnabled:rejecter:)
  public func isSdkEnabled(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isSDKEnabled())
  }
  
  @objc(isTracking:rejecter:)
  public func isTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isTrackingActive())
  }
  
  @objc(setEnableSdk:resolver:rejecter:)
  public func setEnableSdk(
    _ enable: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.setEnableSdk(enable)
    resolve(nil)
  }
  
  @objc(startManualTracking:rejecter:)
  public func startManualTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.startTracking()
    resolve(nil)
  }
  
  @objc(startManualPersistentTracking:rejecter:)
  public func startManualPersistentTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.startPersistentTracking()
    resolve(nil)
  }
  
  @objc(stopManualTracking:rejecter:)
  public func stopManualTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.stopTracking()
    resolve(nil)
  }
  
  @objc(uploadUnsentTrips:rejecter:)
  public func uploadUnsentTrips(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.uploadUnsentTrips()
    resolve(nil)
  }
  
  @objc(getUnsentTripCount:rejecter:)
  public func getUnsentTripCount(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.getUnsentTripCount())
  }
  
  @objc(sendCustomHeartbeats:resolver:rejecter:)
  public func sendCustomHeartbeats(
    _ reason: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.sendCustomHeartbeat(String(reason))
    resolve(nil)
  }
  
  @objc(showPermissionWizard:enableAggressivePermissionsWizardPage:resolver:rejecter:)
  public func showPermissionWizard(
    _ enableAggressivePermissionsWizard: Bool,
    enableAggressivePermissionsWizardPage: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if RPEntry.instance.isAllRequiredPermissionsGranted() {
      resolve(true)
      return
    }
    
    DispatchQueue.main.async {
      RPPermissionsWizard.returnInstance().launch { _ in
        RPEntry.instance.isAllRequiredPermissionsGranted() ? resolve(true) : resolve(false)
      }
    }
  }
  
  @objc(setAccidentDetectionSensitivity:resolver:rejecter:)
  public func setAccidentDetectionSensitivity(
    value: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let sensitivity = RPAccidentDetectionSensitivity(rawValue: value.intValue) else {
      reject("INVALID_PARAMS", "Missing accidentDetectionSensitivity", nil)
      return
    }
    RPEntry.instance.accidentDetectionSensitivity = sensitivity
    resolve(nil)
  }
  
  @objc(isRTLDEnabled:rejecter:)
  public func isRTLDEnabled(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isRTDEnabled())
  }
  
  @objc(enableAccidents:resolver:rejecter:)
  public func enableAccidents(
    _ enable: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.enableAccidents(enable)
    resolve(nil)
  }
  
  @objc(isEnabledAccidents:rejecter:)
  public func isEnabledAccidents(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isEnabledAccidents())
  }
  
  @objc(isAggressiveHeartbeat:rejecter:)
  public func isAggressiveHeartbeat(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
      resolve(RPEntry.instance.aggressiveHeartbeat())
  }
  
  @objc(setAggressiveHeartbeats:resolver:rejecter:)
  public func setAggressiveHeartbeats(
    _ enable: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
      RPEntry.instance.setAggressiveHeartbeats(enable)
      resolve(nil)
  }
  
  
  @objc(setDisableTracking:resolver:rejecter:)
  public func setDisableTracking(
    _ value: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
      RPEntry.instance.disableTracking = value
      resolve(nil)
  }

  @objc(isDisableTracking:rejecter:)
  public func isDisableTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
      resolve(RPEntry.instance.disableTracking)
  }


  @objc(isWrongAccuracyState:rejecter:)
  public func isWrongAccuracyState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
      resolve(RPEntry.instance.wrongAccuracyState)
  }


  @objc(requestIOSLocationAlwaysPermission:rejecter:)
  public func requestIOSLocationAlwaysPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
      RPEntry.instance.requestLocationAlwaysPermission()
      resolve(nil)
  }

  @objc(requestIOSMotionPermission:rejecter:)
  public func requestIOSMotionPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
      RPEntry.instance.requestMotionPermission()
      resolve(nil)
  }
  
  @objc(addFutureTrackTag:source:resolver:rejecter:)
  public func addFutureTrackTag(
    _ tag: NSString,
    _ source: NSString,
    _ resolve: @escaping RCTPromiseResolveBlock,
    _ reject: @escaping RCTPromiseRejectBlock
  ) {
    
    let futureTag = RPFutureTag(tag: String(tag), source: String(source))
    RPEntry.instance.api.addFutureTrackTag(futureTag) { status, error in
      if let err = error {
        reject("ERROR", err.localizedDescription, err)
      } else {
        let result: [String: Any] = ["status": self.parseTagStatus(status: status), "tag": ["tag": tag, "source": source]]
        resolve(result)
      }
    }
  }
  
  @objc(removeFutureTrackTag:resolver:rejecter:)
  public func removeFutureTrackTag(
    _ tag: NSString,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let futureTag = RPFutureTag(tag: String(tag), source: nil)
    RPEntry.instance.api.removeFutureTrackTag(futureTag) { status, error in
      if let err = error {
        reject("ERROR", err.localizedDescription, err)
      } else {
        let result: [String: Any] = ["status": self.parseTagStatus(status: status), "tag": ["tag": tag]]
        resolve(result)
      }
    }
  }
  
  @objc(removeAllFutureTrackTags:rejecter:)
  public func removeAllFutureTrackTags(
    _ resolve: @escaping RCTPromiseResolveBlock,
    _ reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.api.removeAllFutureTrackTags { status, error in
      if let err = error {
        reject("ERROR", err.localizedDescription, err)
      } else {
        resolve(self.parseTagStatus(status: status))
      }
    }
  }
  
  @objc(getFutureTrackTags:rejecter:)
  public func getFutureTrackTags(
    _ resolve: @escaping RCTPromiseResolveBlock,
    _ reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.api.getFutureTrackTag { status, tags in
      let tagsList = tags.map { ["tag": $0.tag, "source": $0.source ?? ""] }
      let result: [String: Any] = ["status": self.parseTagStatus(status: status), "tags": tagsList]
      resolve(result)
    }
  }
  
  // Low power mode
  public override func supportedEvents() -> [String]! {
    return [lowPowerEventName]
  }
  
  public override func startObserving() {
    hasLowPowerListeners = true
  }
  
  public override func stopObserving() {
    hasLowPowerListeners = false
  }
  
  public func lowPowerMode(_ state: Bool) {
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
    case .invalidDeviceToken:
      return "Invalid device token"
    @unknown default:
      return "Unknown error"
    }
  }
}
