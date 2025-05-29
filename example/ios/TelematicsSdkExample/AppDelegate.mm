#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <RaxelPulse/RaxelPulse.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"TelematicsSdkExample";
  self.dependencyProvider = [RCTAppDependencyProvider new];
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  [RPEntry initializeWithRequestingPermissions:NO];
   [RPEntry application:application didFinishLaunchingWithOptions:launchOptions];

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}
\
- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// - (void)applicationWillEnterForeground:(UIApplication *)application {
//   [RPEntry applicationWillEnterForeground:application];
// }


- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(nonnull NSString *)identifier completionHandler:(nonnull void (^)(void))completionHandler {
    [RPEntry application:application handleEventsForBackgroundURLSession:identifier completionHandler:completionHandler];
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    [RPEntry applicationDidReceiveMemoryWarning:application];
}

- (void)applicationWillTerminate:(UIApplication *)application {
    [RPEntry applicationWillTerminate:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    [RPEntry applicationDidEnterBackground:application];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    [RPEntry applicationDidBecomeActive:application];
}

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler {
    [RPEntry application:application performFetchWithCompletionHandler:^{
        completionHandler(UIBackgroundFetchResultNewData);
    }];
}

@end
