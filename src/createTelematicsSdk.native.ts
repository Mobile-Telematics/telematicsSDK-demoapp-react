import { NativeModules } from 'react-native';
import NativeTelematicsSdkTurbo, {
  type Spec as NativeTelematicsSdkSpec,
} from './native-module/NativeTelematicsSdk';

declare const global: {
  __turboModuleProxy?: unknown;
};

/**
 * Returns the native Telematics SDK module.
 * - New architecture: TurboModule via codegen
 * - Old architecture: legacy module from NativeModules
 */
export function getNativeTelematicsSdk(): NativeTelematicsSdkSpec {
  const legacyModule = NativeModules.TelematicsSdk as
    | NativeTelematicsSdkSpec
    | undefined;

  const isTurboAvailable = global.__turboModuleProxy != null;
  const resolvedModule =
    (isTurboAvailable ? NativeTelematicsSdkTurbo : null) ?? legacyModule;

  if (!resolvedModule) {
    throw new Error(
      'react-native-telematics: Native module "TelematicsSdk" not found. ' +
        'Did you run pods / gradle sync and rebuild the app?'
    );
  }

  return resolvedModule as NativeTelematicsSdkSpec;
}

export type Spec = NativeTelematicsSdkSpec;
