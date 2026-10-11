import { BIOMETRIC_DEVICE_DRIVER } from "../../constants/biometricDevice.constants";
import { IBiometricDeviceClient } from "./biometricDevice.types";
import { ZktecoDeviceClient } from "./zktecoDeviceClient";
import { MockBiometricDeviceClient } from "./mockDeviceClient";

/**
 * Single seam between business logic (attendanceSyncFromDevice.service.ts)
 * and hardware. Business logic asks this factory for a client and never
 * imports ZktecoDeviceClient/MockBiometricDeviceClient directly — that's
 * what keeps the sync/upload/clear logic hardware-agnostic.
 *
 * Set BIOMETRIC_DEVICE_DRIVER=mock in .env to develop/test the whole
 * biometric flow without a physical terminal on the network. Any other
 * value (including unset) uses the real ZKTeco driver.
 */
export const createBiometricDeviceClient = (ip: string, port: number): IBiometricDeviceClient => {
  if (BIOMETRIC_DEVICE_DRIVER === "mock") {
    return new MockBiometricDeviceClient(ip, port);
  }
  return new ZktecoDeviceClient(ip, port);
};
