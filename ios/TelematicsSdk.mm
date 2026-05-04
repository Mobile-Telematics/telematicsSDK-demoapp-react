#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <ReactCommon/RCTTurboModule.h>
#import <TelematicsSdkSpec/TelematicsSdkSpec.h>

@interface RCT_EXTERN_MODULE(TelematicsSdk, RCTEventEmitter)
@end

@implementation TelematicsSdk (TurboModule)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeTelematicsSdkSpecJSI>(params);
}

@end
