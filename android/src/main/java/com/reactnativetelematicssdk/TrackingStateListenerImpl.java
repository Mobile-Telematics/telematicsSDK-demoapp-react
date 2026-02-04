package com.reactnativetelematicssdk;

import com.telematicssdk.tracking.TrackingStateListener;

public class TrackingStateListenerImpl implements TrackingStateListener {

  private final TelematicsSdkModule module;

  public TrackingStateListenerImpl(TelematicsSdkModule module) {
    this.module = module;
  }
  @Override
  public void onStartTracking() {
    module.emitTrackingStateChanged(true);
  }

  @Override
  public void onStopTracking() {
    module.emitTrackingStateChanged(false);
  }
}
