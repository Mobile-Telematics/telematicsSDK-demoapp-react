import UIKit
import TelematicsSDK
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  
  var window: UIWindow?
  var reactNativeDelegate: RCTReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?
  
  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = (scene as? UIWindowScene) else { return }
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    
    reactNativeDelegate = delegate
    reactNativeFactory = factory
    
    window = UIWindow(windowScene: windowScene)
    (UIApplication.shared.delegate as? AppDelegate)?.window = window
    factory.startReactNative(
      withModuleName: "TelematicsSdkExample",
      in: window,
//      launchOptions: launchOptions
    )
    
    window?.makeKeyAndVisible()
  }
  
  func sceneDidDisconnect(_ scene: UIScene) {
    
  }
  
  func sceneDidBecomeActive(_ scene: UIScene) {
    RPEntry.instance.sceneDidBecomeActive(scene)
  }
  
  func sceneWillResignActive(_ scene: UIScene) {
    
  }
  
  func sceneWillEnterForeground(_ scene: UIScene) {
    RPEntry.instance.sceneWillEnterForeground(scene)
  }
  
  func sceneDidEnterBackground(_ scene: UIScene) {
    RPEntry.instance.sceneDidEnterBackground(scene)
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
