import Foundation
import TelematicsSDK
import UIKit

fileprivate enum Events: String, CaseIterable {
  case onLowPowerMode = "onLowPowerMode"
  case onLocationChanged = "onLocationChanged"
  case onTrackingStateChanged = "onTrackingStateChanged"
  case onWrongAccuracyAuthorization = "onWrongAccuracyAuthorization"
  case onRtldColectedData = "onRtldColectedData"
  case onSpeedViolation = "onSpeedViolation"
}

@objc(TelematicsSdk)
public class TelematicsSdk: RCTEventEmitter {

  private var hasListeners = false
  private var speedLimitKmH: Double = 0
  private var speedLimitTimeThreshold: TimeInterval = 0

  @objc override public static func requiresMainQueueSetup() -> Bool { true }

  override public func supportedEvents() -> [String]! {
    Events.allCases.map(\.rawValue)
  }

  override public func startObserving() {
    hasListeners = true
    RPEntry.instance.lowPowerModeDelegate = self
    RPEntry.instance.locationDelegate = self
    RPEntry.instance.trackingStateDelegate = self
    RPEntry.instance.accuracyAuthorizationDelegate = self
    RPEntry.instance.rtldDelegate = self
  }

  override public func stopObserving() {
    hasListeners = false
    RPEntry.instance.lowPowerModeDelegate = nil
    RPEntry.instance.locationDelegate = nil
    RPEntry.instance.trackingStateDelegate = nil
    RPEntry.instance.accuracyAuthorizationDelegate = nil
    RPEntry.instance.rtldDelegate = nil
  }

  // MARK: - Lifecycle

  @objc(initializeSdk)
  public func initializeSdk() {
    
  }

  @objc(isInitializedSdk:reject:)
  public func isInitializedSdk(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.isInitialized)
  }

  // MARK: - Device token

  @objc(getDeviceId:reject:)
  public func getDeviceId(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.virtualDeviceToken ?? "")
  }

  @objc(setDeviceId:resolve:reject:)
  public func setDeviceId(
    _ deviceId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.virtualDeviceToken = deviceId
    resolve(nil)
  }

  @objc(logout:reject:)
  public func logout(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.logout()
    resolve(nil)
  }

  // MARK: - Permissions & tracking

  @objc(isAllRequiredPermissionsAndSensorsGranted:reject:)
  public func isAllRequiredPermissionsAndSensorsGranted(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isAllRequiredPermissionsGranted())
  }

  @objc(isSdkEnabled:reject:)
  public func isSdkEnabled(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isSDKEnabled())
  }

  @objc(isTracking:reject:)
  public func isTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isTrackingActive())
  }

  @objc(setEnableSdk:resolve:reject:)
  public func setEnableSdk(
    _ enable: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.setEnableSdk(enable)
    resolve(nil)
  }

  @objc(startManualTracking:reject:)
  public func startManualTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.startTracking()
    resolve(nil)
  }

  @objc(startManualPersistentTracking:reject:)
  public func startManualPersistentTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.startPersistentTracking()
    resolve(nil)
  }

  @objc(stopManualTracking:reject:)
  public func stopManualTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.stopTracking()
    resolve(nil)
  }

  // MARK: - Upload

  @objc(uploadUnsentTrips:reject:)
  public func uploadUnsentTrips(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.uploadUnsentTrips()
    resolve(nil)
  }

  @objc(getUnsentTripCount:reject:)
  public func getUnsentTripCount(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.getUnsentTripCount())
  }

  // MARK: - Heartbeats

  @objc(sendCustomHeartbeats:resolve:reject:)
  public func sendCustomHeartbeats(
    _ reason: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.sendCustomHeartbeat(reason)
    resolve(nil)
  }

  // MARK: - Wizard

  @objc(showPermissionWizard:enableAggressivePermissionsWizardPage:resolve:reject:)
  public func showPermissionWizard(
    _ enableAggressivePermissionsWizard: Bool,
    enableAggressivePermissionsWizardPage: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
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

  // MARK: - Accidents / RTLD

  @objc(setAccidentDetectionSensitivity:resolve:reject:)
  public func setAccidentDetectionSensitivity(
    _ value: Double,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let sensitivity = RPAccidentDetectionSensitivity(rawValue: Int(value)) else {
      reject("INVALID_PARAMS", "Invalid accidentDetectionSensitivity value", nil)
      return
    }
    RPEntry.instance.accidentDetectionSensitivity = sensitivity
    resolve(nil)
  }

  @objc(isRTLDEnabled:reject:)
  public func isRTLDEnabled(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isRTDEnabled())
  }

  @objc(enableAccidents:resolve:reject:)
  public func enableAccidents(
    _ enable: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.enableAccidents(enable)
    resolve(nil)
  }

  @objc(isEnabledAccidents:reject:)
  public func isEnabledAccidents(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isEnabledAccidents())
  }

  // MARK: - Tags API

  @objc(getFutureTrackTags:reject:)
  public func getFutureTrackTags(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.api.getFutureTrackTag { status, tags in
      let tagsList = tags.map { ["tag": $0.tag, "source": $0.source ?? ""] }
      let result: [String: Any] = ["status": self.parseTagStatus(status: status), "tags": tagsList]
      resolve(result)
    }
  }

  @objc(addFutureTrackTag:source:resolve:reject:)
  public func addFutureTrackTag(
    _ tag: String,
    source: String?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let futureTag = RPFutureTag(tag: tag, source: source ?? "")
    RPEntry.instance.api.addFutureTrackTag(futureTag) { status, error in
      if let err = error {
        reject("ERROR", err.localizedDescription, err)
      } else {
        let result: [String: Any] = [
          "status": self.parseTagStatus(status: status),
          "tag": ["tag": tag, "source": source ?? ""],
        ]
        resolve(result)
      }
    }
  }

  @objc(removeFutureTrackTag:resolve:reject:)
  public func removeFutureTrackTag(
    _ tag: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let futureTag = RPFutureTag(tag: tag, source: nil)
    RPEntry.instance.api.removeFutureTrackTag(futureTag) { status, error in
      if let err = error {
        reject("ERROR", err.localizedDescription, err)
      } else {
        let result: [String: Any] = ["status": self.parseTagStatus(status: status), "tag": ["tag": tag]]
        resolve(result)
      }
    }
  }

  @objc(removeAllFutureTrackTags:reject:)
  public func removeAllFutureTrackTags(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.api.removeAllFutureTrackTags { status, error in
      if let err = error {
        reject("ERROR", err.localizedDescription, err)
      } else {
        resolve(self.parseTagStatus(status: status))
      }
    }
  }

  // MARK: - Speed violations (flattened params)

  @objc(registerSpeedViolations:speedLimitTimeout:resolve:reject:)
  public func registerSpeedViolations(
    _ speedLimitKmH: Double,
    speedLimitTimeout: Double,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    self.speedLimitKmH = speedLimitKmH
    self.speedLimitTimeThreshold = speedLimitTimeout

    RPEntry.instance.speedLimitDelegate = self
    resolve(nil)
  }

  // MARK: - iOS-only

  @objc(isAggressiveHeartbeat:reject:)
  public func isAggressiveHeartbeat(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.aggressiveHeartbeat())
  }

  @objc(setAggressiveHeartbeats:resolve:reject:)
  public func setAggressiveHeartbeats(
    _ enable: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.setAggressiveHeartbeats(enable)
    resolve(nil)
  }

  @objc(setDisableTracking:resolve:reject:)
  public func setDisableTracking(
    _ value: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.disableTracking = value
    resolve(nil)
  }

  @objc(isDisableTracking:reject:)
  public func isDisableTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.disableTracking)
  }

  @objc(isWrongAccuracyState:reject:)
  public func isWrongAccuracyState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.wrongAccuracyState)
  }

  @objc(requestIOSLocationAlwaysPermission:reject:)
  public func requestIOSLocationAlwaysPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.requestLocationAlwaysPermission()
    resolve(nil)
  }

  @objc(requestIOSMotionPermission:reject:)
  public func requestIOSMotionPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.requestMotionPermission()
    resolve(nil)
  }

  @objc(getApiLanguage:reject:)
  public func getApiLanguage(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    switch RPEntry.instance.apiLanguage {
    case .none:
      resolve("None")
    case .english:
      resolve("English")
    case .russian:
      resolve("Russian")
    case .portuguese:
      resolve("Portuguese")
    case .spanish:
      resolve("Spanish")
    @unknown default:
      resolve("English")
    }
  }

  @objc(setApiLanguage:resolve:reject:)
  public func setApiLanguage(
    _ language: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    switch language {
    case "None":
      RPEntry.instance.apiLanguage = .none
    case "English":
      RPEntry.instance.apiLanguage = .english
    case "Russian":
      RPEntry.instance.apiLanguage = .russian
    case "Portuguese":
      RPEntry.instance.apiLanguage = .portuguese
    case "Spanish":
      RPEntry.instance.apiLanguage = .spanish
    default:
      reject("INVALID_PARAMS", "Unsupported language: \(language)", nil)
      return
    }
    resolve(nil)
  }

  // MARK: - Android-only stubs (no-op on iOS, required by codegen protocol)

  @objc(setAndroidAutoStartEnabled:permanent:resolve:reject:)
  public func setAndroidAutoStartEnabled(
    _ enable: Bool,
    permanent: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    reject("PLATFORM_ERROR", "setAndroidAutoStartEnabled is not available on iOS", nil)
  }

  @objc(isAndroidAutoStartEnabled:reject:)
  public func isAndroidAutoStartEnabled(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    reject("PLATFORM_ERROR", "isAndroidAutoStartEnabled is not available on iOS", nil)
  }

  // MARK: - Helpers

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

// MARK: - Event delegates

extension TelematicsSdk: RPLowPowerModeDelegate {
  public func lowPowerMode(_ state: Bool) {
    guard hasListeners else { return }
    sendEvent(withName: Events.onLowPowerMode.rawValue, body: ["enabled": state])
  }
}

extension TelematicsSdk: RPLocationDelegate {
  public func onLocationChanged(_ location: CLLocation) {
    guard hasListeners else { return }
    let coordinate: [String: Any] = [
      "latitude": location.coordinate.latitude,
      "longitude": location.coordinate.longitude,
    ]
    sendEvent(withName: Events.onLocationChanged.rawValue, body: coordinate)
  }

  public func onNewEvents(_ events: [TelematicsSDK.RPEventPoint]) {}
}

extension TelematicsSdk: RPTrackingStateListenerDelegate {
  public func trackingStateChanged(_ state: Bool) {
    guard hasListeners else { return }
    sendEvent(withName: Events.onTrackingStateChanged.rawValue, body: state)
  }
}

extension TelematicsSdk: RPAccuracyAuthorizationDelegate {
  public func wrongAccuracyAuthorization() {
    guard hasListeners else { return }
    sendEvent(withName: Events.onWrongAccuracyAuthorization.rawValue, body: nil)
  }
}

extension TelematicsSdk: RPRTDLDelegate {
  public func rtldColectedData() {
    guard hasListeners else { return }
    sendEvent(withName: Events.onRtldColectedData.rawValue, body: nil)
  }
}

extension TelematicsSdk: RPSpeedLimitDelegate {
  public var timeThreshold: TimeInterval { speedLimitTimeThreshold }
  public var speedLimit: Double { speedLimitKmH }

  public func speedLimitNotification(
    _ speedLimit: Double,
    speed: Double,
    latitude: Double,
    longitude: Double,
    date: Date
  ) {
    guard hasListeners else { return }
    let payload: [String: Any] = [
      "date": Int(date.timeIntervalSince1970),
      "latitude": latitude,
      "longitude": longitude,
      "speed": speed,
      "speedLimit": speedLimit,
    ]
    sendEvent(withName: Events.onSpeedViolation.rawValue, body: payload)
  }
}
