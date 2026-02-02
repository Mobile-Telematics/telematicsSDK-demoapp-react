package com.reactnativetelematicssdk;

import com.telematicssdk.tracking.SpeedViolation;
import com.telematicssdk.tracking.SpeedViolationsListener;
public class SpeedViolationsListenerImpl implements SpeedViolationsListener {
  private final TelematicsSdkModule module;

  public SpeedViolationsListenerImpl(TelematicsSdkModule module) {
    this.module = module;
  }

  @Override
  public void onSpeedViolation(SpeedViolation speedViolation) {
    if (speedViolation == null) return;
    module.emitSpeedViolation(speedViolation);
  }

}
