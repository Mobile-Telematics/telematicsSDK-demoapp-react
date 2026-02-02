package com.reactnativetelematicssdk;

import android.location.Location;
import androidx.annotation.Nullable;
import com.telematicssdk.tracking.LocationListener;

public class LocationListenerImpl implements LocationListener {

  private final TelematicsSdkModule module;

  public LocationListenerImpl(TelematicsSdkModule module) {
    this.module = module;
  }

  @Override
  public void onLocationChanged(@Nullable Location location) {
    module.emitLocationChanged(location);
  }
}
