package com.reactnativetelematicssdk;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.telematicssdk.tracking.TagsProcessingListener;
import com.telematicssdk.tracking.model.database.models.raw_tags.Status;
import com.telematicssdk.tracking.server.model.sdk.raw_tags.Tag;

public class TagsProcessor implements TagsProcessingListener {
  private static final String TAG = "TelematicsSdkModule";
  private static final String OPERATION_IN_PROGRESS = "OPERATION_IN_PROGRESS";

  private final ReactApplicationContext reactContext;
  private Promise onAllTagsRemovePromise = null;
  private Promise onGetTagsPromise = null;
  private Promise onAddTagPromise = null;
  private Promise onTagRemovePromise = null;

  public TagsProcessor(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
  }

  public synchronized boolean setOnAddTag(Promise onAddTag) {
    if (onAddTagPromise != null) {
      rejectOnUiQueue(onAddTag, OPERATION_IN_PROGRESS, "addFutureTrackTag is already pending");
      return false;
    }
    this.onAddTagPromise = onAddTag;
    return true;
  }

  public synchronized boolean setOnAllTagsRemove(Promise onAllTagsRemove) {
    if (onAllTagsRemovePromise != null) {
      rejectOnUiQueue(onAllTagsRemove, OPERATION_IN_PROGRESS, "removeAllFutureTrackTags is already pending");
      return false;
    }
    this.onAllTagsRemovePromise = onAllTagsRemove;
    return true;
  }

  public synchronized boolean setOnGetTags(Promise onGetTags) {
    if (onGetTagsPromise != null) {
      rejectOnUiQueue(onGetTags, OPERATION_IN_PROGRESS, "getFutureTrackTags is already pending");
      return false;
    }
    this.onGetTagsPromise = onGetTags;
    return true;
  }

  public synchronized boolean setOnTagRemove(Promise onTagRemove) {
    if (onTagRemovePromise != null) {
      rejectOnUiQueue(onTagRemove, OPERATION_IN_PROGRESS, "removeFutureTrackTag is already pending");
      return false;
    }
    this.onTagRemovePromise = onTagRemove;
    return true;
  }

  private synchronized Promise takeOnAllTagsRemovePromise() {
    Promise promise = onAllTagsRemovePromise;
    onAllTagsRemovePromise = null;
    return promise;
  }

  private synchronized Promise takeOnGetTagsPromise() {
    Promise promise = onGetTagsPromise;
    onGetTagsPromise = null;
    return promise;
  }

  private synchronized Promise takeOnAddTagPromise() {
    Promise promise = onAddTagPromise;
    onAddTagPromise = null;
    return promise;
  }

  private synchronized Promise takeOnTagRemovePromise() {
    Promise promise = onTagRemovePromise;
    onTagRemovePromise = null;
    return promise;
  }

  private void resolveOnUiQueue(Promise promise, Object value) {
    reactContext.runOnUiQueueThread(() -> promise.resolve(value));
  }

  private void rejectOnUiQueue(Promise promise, String code, String message) {
    reactContext.runOnUiQueueThread(() -> promise.reject(code, message));
  }

  private String parseStatus(Status status) {
    switch(status) {
      case SUCCESS: return "Success";
      case OFFLINE: return "Offline";
      case ERROR_INVALID_TAG_SPECIFIED: return "Invalid tag specified";
      case ERROR_TAG_OPERATION: return "Wrong tag operation";
      case ERROR_WRONG_TIME: return "Wrong time";
      default: return "Unknown error";
    }
  }

  // Converts Tag object from SDK to React Native specific WritableMap
  private WritableMap tagToWritableMap(Tag tag) {
    WritableMap map = new WritableNativeMap();
    map.putString("tag", tag.getTag());
    String source = tag.getSource();
    if (source == null) {
      map.putNull("source");
    } else {
      map.putString("source", source);
    }
    return map;
  }

  // Converts Tags array from SDK to React Native specific WritableArray
  private WritableArray tagsToWritableArray(@Nullable Tag[] tags) {
    WritableArray array = new WritableNativeArray();
    if (tags == null) {
      return array;
    }
    for (Tag tag : tags) {
      array.pushMap(tagToWritableMap(tag));
    }
    return array;
  }

  @Override
  public void onAllTagsRemove(@NonNull Status status, int i, long l) {
    Log.d(TAG, "onAllTagsRemove");
    String statusString = parseStatus(status);
    Promise promise = takeOnAllTagsRemovePromise();
    if(promise == null) {
      Log.d(TAG, "onAllTagsRemove cannot resolve the Promise");
      return;
    }
    resolveOnUiQueue(promise, statusString);
  }

  @Override
  public void onGetTags(@NonNull Status status, Tag[] tags, long l) {
    Log.d(TAG, "onGetTags");
    String statusString = parseStatus(status);
    Promise promise = takeOnGetTagsPromise();
    if(promise == null) {
      Log.d(TAG, "onGetTags cannot resolve the Promise");
      return;
    }
    WritableMap result = new WritableNativeMap();
    result.putString("status", statusString);
    result.putArray("tags", tagsToWritableArray(tags));
    resolveOnUiQueue(promise, result);
  }

  @Override
  public void onTagAdd(@NonNull Status status, @NonNull Tag tag, long l) {
    Log.d(TAG, "onTagAdd");
    String statusString = parseStatus(status);
    Promise promise = takeOnAddTagPromise();
    if(promise == null) {
      Log.d(TAG, "onTagAdd cannot resolve the Promise");
      return;
    }
    WritableMap result = new WritableNativeMap();
    result.putString("status", statusString);
    result.putMap("tag", tagToWritableMap(tag));
    resolveOnUiQueue(promise, result);
  }

  @Override
  public void onTagRemove(@NonNull Status status, @NonNull Tag tag, long l) {
    Log.d(TAG, "onTagRemove");
    String statusString = parseStatus(status);
    Promise promise = takeOnTagRemovePromise();
    if(promise == null) {
      Log.d(TAG, "onTagRemove cannot resolve the Promise");
      return;
    }
    WritableMap result = new WritableNativeMap();
    result.putString("status", statusString);
    result.putMap("tag", tagToWritableMap(tag));
    resolveOnUiQueue(promise, result);
  }
}
