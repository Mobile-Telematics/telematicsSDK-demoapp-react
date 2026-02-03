import UIKit
import TelematicsSDK

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

    // Init React Native
    window = UIWindow(frame: UIScreen.main.bounds)
    window?.rootViewController = ReactViewController()
    window?.makeKeyAndVisible()

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
