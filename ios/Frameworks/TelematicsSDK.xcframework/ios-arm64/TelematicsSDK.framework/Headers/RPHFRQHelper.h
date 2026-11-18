//
//  RPHFRQHelper.h
//  TelematicsSDK
//
//  Created by Sergey Emelyanov on 22.10.2019.
//  Copyright © 2020 Damoov. Ltd. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import <TelematicsSDK/RPHFRQHelperDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@class RPQuantile;
@class RPEventPoint;
@class RPEventValue;
@class RPMotionVector;

@protocol RPHFRQHelperProtocol
@required

@property (weak, nonatomic) id<RPHFRQHelperDelegate> helperDelegate;

/// Server-driven: whether raw sensor buffers around an accident may be stored.
/// Pushed from the SDK scope configuration; NO until the first scope is applied.
@property (atomic, assign, getter=isBufferRawSamplesEnabled) BOOL bufferRawSamplesEnabled;

/// Which raw accident buffers are issued: YES — every candidate (AllCandidates),
/// NO — confirmed accidents only (ConfirmedOnly, the default). Takes effect on the next decision.
@property (atomic, assign, getter=isRawBufferAllCandidatesEnabled) BOOL rawBufferAllCandidatesEnabled;

/// Server-driven: whether accidents are searched. YES when the SDK configuration enables accidents
/// and the user is active; pushed from the scope configuration, NO until the first scope is applied.
/// Regular events (braking, acceleration, cornering) do not depend on it.
@property (atomic, assign, getter=isEnabledAccidents) BOOL enabledAccidents;

- (void)clearEvents;
- (BOOL)hasLastEvents;
- (NSArray<RPEventPoint*>*)getHFEvents;
- (RPQuantile*)getQuantile;

- (void)detectEventForAcceleration:(nonnull RPMotionVector *)acceleration
                             speed:(double)speed
                          accuracy:(double)accuracy
                     speedAccuracy: (double)speedAccuracy
                          latitude:(double)originLatitude
                         longitude:(double)originLongitude
                              time:(double)timestamp
                           fixTime:(double)fixTime
                            course:(double)course
                              gyro:(nonnull RPMotionVector *)gyro;

- (void)setAccidentSettingWithSpeedTime: (UInt32)speedTime
                      accidentThreshold: (double)accidentThreshold
                      lowSpeedThreshold: (double)lowSpeedThreshold;

@end

@interface RPHFRQHelper : NSObject <RPHFRQHelperProtocol>

/// Server-driven: whether raw sensor buffers around an accident may be stored.
/// Pushed from the SDK scope configuration; NO until the first scope is applied.
@property (atomic, assign, getter=isBufferRawSamplesEnabled) BOOL bufferRawSamplesEnabled;

/// Which raw accident buffers are issued: YES — every candidate (AllCandidates),
/// NO — confirmed accidents only (ConfirmedOnly, the default). Takes effect on the next decision.
@property (atomic, assign, getter=isRawBufferAllCandidatesEnabled) BOOL rawBufferAllCandidatesEnabled;

/// Server-driven: whether accidents are searched. YES when the SDK configuration enables accidents
/// and the user is active; pushed from the scope configuration, NO until the first scope is applied.
/// Regular events (braking, acceleration, cornering) do not depend on it.
@property (atomic, assign, getter=isEnabledAccidents) BOOL enabledAccidents;

- (void)clearEvents;
- (BOOL)hasLastEvents;
- (NSArray<RPEventPoint*>*)getHFEvents;
- (RPQuantile*)getQuantile;

- (void)detectEventForAcceleration:(nonnull RPMotionVector *)acceleration
                             speed:(double)speed
                          accuracy:(double)accuracy
                     speedAccuracy: (double)speedAccuracy
                          latitude:(double)originLatitude
                         longitude:(double)originLongitude
                              time:(double)timestamp
                           fixTime:(double)fixTime
                            course:(double)course
                              gyro:(nonnull RPMotionVector *)gyro;

- (void)setAccidentSettingWithSpeedTime: (UInt32)speedTime
                      accidentThreshold: (double)accidentThreshold
                      lowSpeedThreshold: (double)lowSpeedThreshold;

@property (weak, nonatomic) id<RPHFRQHelperDelegate> helperDelegate;

@end

NS_ASSUME_NONNULL_END
