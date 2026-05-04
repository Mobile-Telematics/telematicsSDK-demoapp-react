#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#if __has_include("RNTelematicsSdkSpec.h")
#import "RNTelematicsSdkSpec.h"
#endif

@class TelematicsSdk;

#if __has_include("RNTelematicsSdkSpec.h")
@interface TelematicsSdk () <NativeTelematicsSdkSpec>
@end
#endif
