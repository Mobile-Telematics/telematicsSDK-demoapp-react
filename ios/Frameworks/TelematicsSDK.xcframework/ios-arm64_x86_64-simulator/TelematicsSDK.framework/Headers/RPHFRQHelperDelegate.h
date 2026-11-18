//
//  RPHFRQHelperDelegate.h
//  TelematicsSDK
//
//  Created by Gusakovsky, Sergey on 04/02/2025.
//  Copyright © 2025 Damoov. All rights reserved.
//

#import <Foundation/Foundation.h>

@protocol RPHFRQHelperDelegate <NSObject>

/// A ready accident RAW buffer (JSON v2, built by the HF module). Save it as one file and upload it.
/// @param json buffer body `{"HFAccidentRaw":{"Version":2,...}}`
/// @param uuid buffer file name (FileId): EventId of a confirmed accident, otherwise the buffer's own Id
/// @param deviceId device the buffer is uploaded for
- (void)addRawBufferJson:(NSString * _Nonnull)json
                    uuid:(NSString * _Nonnull)uuid
                deviceId:(NSString * _Nullable)deviceId;
- (NSString * _Nullable)getCurrentTrackToken;
- (NSString * _Nullable)getCurrentDeviceId;
/// SDK version for the RAW buffer (SdkVersion): RPSystem.sdkVersion, "version.build", e.g. "7.3.0.5"
- (NSString * _Nonnull)getSdkVersion;

@end
