import Foundation
import React
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

  @objc(initializeSdk:reject:)
  public func initializeSdk(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(nil)
  }

  @objc(isInitializedSdk:reject:)
  public func isInitializedSdk(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.isInitialized())
  }

  // MARK: - Device token

  @objc(getDeviceId:reject:)
  public func getDeviceId(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.getDeviceId())
  }

  @objc(getDeviceIdRegistrationState:reject:)
  public func getDeviceIdRegistrationState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let state = RPEntry.instance.getDeviceIdRegistrationState()
    let checkedAtMillis: Int
    if state.checkedAt > 0 {
      checkedAtMillis = Int((state.checkedAt * 1000).rounded())
    } else {
      checkedAtMillis = 0
    }

    resolve([
      "status": deviceIdRegistrationStatusString(from: state.status),
      "checkedAtMillis": checkedAtMillis,
    ])
  }

  @objc(setDeviceId:resolve:reject:)
  public func setDeviceId(
    _ deviceId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      try RPEntry.instance.setDeviceID(deviceId: deviceId)
      resolve(nil)
    } catch {
      reject("ERROR", error.localizedDescription, error)
    }
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
    resolve(RPEntry.instance.isAllRequiredPermissionsAndSensorsGranted())
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
    resolve(RPEntry.instance.isTracking())
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

  @objc(startTrackAsPersistent:reject:)
  public func startTrackAsPersistent(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.startTrackAsPersistent()
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

  @objc(setMaxPersistentTrackingInterval:resolve:reject:)
  public func setMaxPersistentTrackingInterval(
    _ minutes: Double,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    do {
      try RPEntry.instance.setMaxPersistentTrackingInterval(minutes: Int(minutes))
      resolve(nil)
    } catch {
      reject("INVALID_ARGUMENT", error.localizedDescription, error)
    }
  }

  @objc(getMaxPersistentTrackingInterval:reject:)
  public func getMaxPersistentTrackingInterval(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.getMaxPersistentTrackingInterval())
  }

  @objc(setTrackingMode:resolve:reject:)
  public func setTrackingMode(
    _ trackingMode: Double,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let mode = RPTrackingMode(rawValue: Int(trackingMode)) else {
      reject("INVALID_ARGUMENT", "trackingMode is invalid", nil)
      return
    }

    RPEntry.instance.setTrackingMode(mode)
    resolve(nil)
  }

  @objc(getTrackingMode:reject:)
  public func getTrackingMode(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.getTrackingMode().rawValue)
  }

  @objc(getTrackingState:reject:)
  public func getTrackingState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.getTrackingState { [weak self] state in
      resolve([
        "automaticTrackingStatus": self?.trackingStatusString(from: state.automaticTrackingStatus) ?? "UNKNOWN",
        "manualTrackingStatus": self?.trackingStatusString(from: state.manualTrackingStatus) ?? "UNKNOWN",
      ])
    }
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
    RPEntry.instance.getUnsentTripCount { unsentTripsCount in
      resolve(unsentTripsCount)
    }
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
    RPEntry.instance.setAccidentDetectionSensitivity(sensitivity: sensitivity)
    resolve(nil)
  }

  @objc(isRTLDEnabled:reject:)
  public func isRTLDEnabled(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isRTLDEnabled())
  }

  @objc(enableAccidents:resolve:reject:)
  public func enableAccidents(
    _ enable: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    RPEntry.instance.setAccidentDetectionEnabled(enable)
    resolve(nil)
  }

  @objc(isEnabledAccidents:reject:)
  public func isEnabledAccidents(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isAccidentDetectionEnabled())
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

  @objc(isAggressiveHeartbeats:reject:)
  public func isAggressiveHeartbeats(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isAggressiveHeartbeats())
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
    RPEntry.instance.setDisableTracking(disableTracking: value)
    resolve(nil)
  }

  @objc(isDisableTracking:reject:)
  public func isDisableTracking(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isDisableTracking())
  }

  @objc(isWrongAccuracyState:reject:)
  public func isWrongAccuracyState(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(RPEntry.instance.isWrongAccuracyState())
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
    switch RPEntry.instance.getApiLanguage() {
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
      RPEntry.instance.setApiLanguage(apiLanguage: .none)
    case "English":
      RPEntry.instance.setApiLanguage(apiLanguage: .english)
    case "Russian":
      RPEntry.instance.setApiLanguage(apiLanguage: .russian)
    case "Portuguese":
      RPEntry.instance.setApiLanguage(apiLanguage: .portuguese)
    case "Spanish":
      RPEntry.instance.setApiLanguage(apiLanguage: .spanish)
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

  private func deviceIdRegistrationStatusString(
    from status: RPDeviceIdRegistrationStatus
  ) -> String {
    switch status {
    case .notSet:
      return "NOT_SET"
    case .unknown:
      return "UNKNOWN"
    case .registered:
      return "REGISTERED"
    case .notRegistered:
      return "NOT_REGISTERED"
    @unknown default:
      return "UNKNOWN"
    }
  }

  private func trackingStatusString(from status: RPTrackingStatus) -> String {
    switch status {
    case .enabled:
      return "ENABLED"
    case .deviceIdNotSet:
      return "DEVICE_ID_NOT_SET"
    case .sdkDisabled:
      return "SDK_DISABLED"
    case .disabledBySettings:
      return "DISABLED_BY_SETTINGS"
    case .disabledByServer:
      return "DISABLED_BY_SERVER"
    case .disabledBySchedule:
      return "DISABLED_BY_SCHEDULE"
    @unknown default:
      return "UNKNOWN"
    }
  }

  private func parseTagStatus(status: RPTagStatus) -> String {
    switch status {
    case .success:
      return "Success"
    case .offline:
      return "Offline"
    case .errorTagOperation:
      return "Wrong tag operation"
    case .invalidDeviceId:
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

extension TelematicsSdk: RPRTLDDelegate {
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
