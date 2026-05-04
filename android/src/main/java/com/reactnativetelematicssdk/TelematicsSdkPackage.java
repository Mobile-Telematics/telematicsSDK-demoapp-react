package com.reactnativetelematicssdk;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;

import java.util.HashMap;
import java.util.Map;

public class TelematicsSdkPackage extends TurboReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(@NonNull String name, @NonNull ReactApplicationContext reactContext) {
    if (TelematicsSdkModule.NAME.equals(name)) {
      return new TelematicsSdkModule(reactContext);
    }
    return null;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      Map<String, ReactModuleInfo> map = new HashMap<>();
      map.put(TelematicsSdkModule.NAME, new ReactModuleInfo(
        TelematicsSdkModule.NAME,
        TelematicsSdkModule.class.getName(),
        false, // canOverrideExistingModule
        false, // needsEagerInit
        false, // isCxxModule
        true   // isTurboModule
      ));
      return map;
    };
  }
}
