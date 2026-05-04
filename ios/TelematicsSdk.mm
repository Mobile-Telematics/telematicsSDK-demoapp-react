#import "TelematicsSdk-Bridging-Header.h"
#import "react_native_telematics_sdk-Swift.h"

#if __has_include("RNTelematicsSdkSpec.h")
#import "RNTelematicsSdkSpec.h"
@interface TelematicsSdk () <NativeTelematicsSdkSpec>
@end
#endif
