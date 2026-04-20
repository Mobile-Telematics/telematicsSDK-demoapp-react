package com.reactnativetelematicssdk;

import androidx.annotation.NonNull;

import com.facebook.react.BaseReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.uimanager.ViewManager;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TelematicsSdkPackage extends BaseReactPackage {
  @NonNull
  @Override
  public NativeModule getModule(@NonNull String name, @NonNull ReactApplicationContext reactContext) {
    if (TelematicsSdkModule.NAME.equals(name)) {
      return new TelematicsSdkModule(reactContext);
    }
    return null;
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @NonNull
  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
      ReactModule reactModule = TelematicsSdkModule.class.getAnnotation(ReactModule.class);

      moduleInfos.put(
        TelematicsSdkModule.NAME,
        new ReactModuleInfo(
          TelematicsSdkModule.NAME,
          TelematicsSdkModule.class.getName(),
          reactModule != null && reactModule.canOverrideExistingModule(),
          reactModule != null && reactModule.needsEagerInit(),
          reactModule != null && reactModule.isCxxModule(),
          true
        )
      );

      return moduleInfos;
    };
  }
}
