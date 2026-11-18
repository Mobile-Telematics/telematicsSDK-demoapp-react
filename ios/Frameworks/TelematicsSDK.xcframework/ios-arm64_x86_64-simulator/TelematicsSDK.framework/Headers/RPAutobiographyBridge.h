//
//  RPAutobiographyBridge.h
//  TelematicsSDK
//
//  Created by Gusakovsky, Sergey on 17/12/2024.
//  Copyright © 2024 Damoov. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class RPWrappedLocation;
@class RPRawTrackPoint;
@class RPQuantile;
@class RPMotionVector;

@protocol RPAutobiographyBridgeProtocol
@required
- (void)resetAutobiography;
- (nullable RPRawTrackPoint *)processTrackDataWithLocation:(nonnull RPWrappedLocation *)lastLocation
                                              acceleration:(nullable RPMotionVector *)lastAcceleration
                                                  rotation:(nullable RPMotionVector *)lastRotation;
@end

@interface RPAutobiographyBridge : NSObject <RPAutobiographyBridgeProtocol> {
    
}

- (void)resetAutobiography;
- (nullable RPRawTrackPoint *)processTrackDataWithLocation:(nonnull RPWrappedLocation *)lastLocation
                                              acceleration:(nullable RPMotionVector *)lastAcceleration
                                                  rotation:(nullable RPMotionVector *)lastRotation;

@end

NS_ASSUME_NONNULL_END
