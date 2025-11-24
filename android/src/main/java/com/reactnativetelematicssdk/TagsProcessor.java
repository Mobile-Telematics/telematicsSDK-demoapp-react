package com.reactnativetelematicssdk;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.telematicssdk.tracking.TagsProcessingListener;
import com.telematicssdk.tracking.model.database.models.raw_tags.Status;
import com.telematicssdk.tracking.server.model.sdk.raw_tags.Tag;

public class TagsProcessor implements TagsProcessingListener {
  private static final String TAG = "TelematicsSdkModule";
  private Promise onAllTagsRemovePromise = null;
  private Promise onGetTagsPromise = null;
  private Promise onAddTagPromise = null;
  private Promise onTagRemovePromise = null;

  public void setOnAddTag(Promise onAddTag) {
    this.onAddTagPromise = onAddTag;
  }

  public void setOnAllTagsRemove(Promise onAllTagsRemove) {
    this.onAllTagsRemovePromise = onAllTagsRemove;
  }

  public void setOnGetTags(Promise onGetTags) {
    this.onGetTagsPromise = onGetTags;
  }

  public void setOnTagRemove(Promise onTagRemove) {
    this.onTagRemovePromise = onTagRemove;
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
    map.putString("source", tag.getSource());
    return map;
  }

  // Converts Tags array from SDK to React Native specific WritableArray
  private WritableArray tagsToWritableArray(Tag[] tags) {
    WritableArray array = new WritableNativeArray();
    for (Tag tag : tags) {
      array.pushMap(tagToWritableMap(tag));
    }
    return array;
  }

  @Override
  public void onAllTagsRemove(@NonNull Status status, int i, long l) {
    Log.d(TAG, "onAllTagsRemove");
    String statusString = parseStatus(status);
    if(onAllTagsRemovePromise == null) {
      Log.d(TAG, "onAllTagsRemove cannot resolve the Promise");
      return;
    }
    onAllTagsRemovePromise.resolve(statusString);
  }

  @Override
  public void onGetTags(@NonNull Status status, Tag[] tags, long l) {
    Log.d(TAG, "onGetTags");
    String statusString = parseStatus(status);
    if(onGetTagsPromise == null) {
      Log.d(TAG, "onGetTags cannot resolve the Promise");
      return;
    }
    WritableMap result = new WritableNativeMap();
    result.putString("status", statusString);
    result.putArray("tags", tagsToWritableArray(tags));
    onGetTagsPromise.resolve(result);
  }

  @Override
  public void onTagAdd(@NonNull Status status, @NonNull Tag tag, long l) {
    Log.d(TAG, "onTagAdd");
    String statusString = parseStatus(status);
    if(onAddTagPromise == null) {
      Log.d(TAG, "onTagAdd cannot resolve the Promise");
      return;
    }
    WritableMap result = new WritableNativeMap();
    result.putString("status", statusString);
    result.putMap("tag", tagToWritableMap(tag));
    onAddTagPromise.resolve(result);
  }

  @Override
  public void onTagRemove(@NonNull Status status, @NonNull Tag tag, long l) {
    Log.d(TAG, "onTagRemove");
    String statusString = parseStatus(status);
    if(onTagRemovePromise == null) {
      Log.d(TAG, "onTagRemove cannot resolve the Promise");
      return;
    }
    WritableMap result = new WritableNativeMap();
    result.putString("status", statusString);
    result.putMap("tag", tagToWritableMap(tag));
    onTagRemovePromise.resolve(result);
  }
}
