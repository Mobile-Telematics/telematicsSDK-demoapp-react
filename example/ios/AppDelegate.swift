import UIKit
import TelematicsSDK
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

  var window: UIWindow?
  
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {

    // Init Telematics
    RPEntry.initializeSDK()
    
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
  
//  func applicationDidEnterBackground(_ application: UIApplication) {
//    RPEntry.instance.applicationDidEnterBackground(application)
//  }
//  
//  func applicationWillEnterForeground(_ application: UIApplication) {
//    RPEntry.instance.applicationWillEnterForeground(application)
//  }
//  
//  func applicationDidBecomeActive(_ application: UIApplication) {
//    RPEntry.instance.applicationDidBecomeActive(application)
//  }

  func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    RPEntry.instance.application(application) {
      completionHandler(.newData)
    }
  }
  
  func application(
      _ application: UIApplication,
      configurationForConnecting connectingSceneSession: UISceneSession,
      options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
      UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
  }
  
  func application(
      _ application: UIApplication,
      didDiscardSceneSessions sceneSessions: Set<UISceneSession>
  ) {
      
  }
  
}
