import UIKit
import TelematicsSDK
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

    // Init Telematics
    RPEntry.initializeSDK()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    
    reactNativeDelegate = delegate
    reactNativeFactory = factory
    
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "TelematicsSdkExample",
      in: window,
      launchOptions: launchOptions
    )
    
    RPEntry.instance.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )
    return true
  }

  // MARK: - Background / Lifecycle forwarding

  func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    RPEntry.instance.application(
      application,
      handleEventsForBackgroundURLSession: identifier,
      completionHandler: completionHandler
    )
  }

  func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    RPEntry.instance.applicationDidReceiveMemoryWarning(application)
  }

  func applicationWillTerminate(_ application: UIApplication) {
    RPEntry.instance.applicationWillTerminate(application)
  }
  
  func applicationDidEnterBackground(_ application: UIApplication) {
    RPEntry.instance.applicationDidEnterBackground(application)
  }
  
  func applicationWillEnterForeground(_ application: UIApplication) {
    RPEntry.instance.applicationWillEnterForeground(application)
  }
  
  func applicationDidBecomeActive(_ application: UIApplication) {
    RPEntry.instance.applicationDidBecomeActive(application)
  }

  func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    RPEntry.instance.application(application) {
      completionHandler(.newData)
    }
  }
  
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  
  override func sourceURL(for bridge: RCTBridge) -> URL? { self.bundleURL() }
  
  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
  
}
