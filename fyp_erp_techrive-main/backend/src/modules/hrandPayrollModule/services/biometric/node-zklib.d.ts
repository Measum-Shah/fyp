// node-zklib (and its actively-maintained fork zklib-js) ship no TypeScript
// types. We only ever touch it through ZktecoDeviceClient below, which
// treats every call defensively (feature-checks methods, validates shapes
// at runtime) — so a loose `any` here is safe: nothing outside that one file
// depends on this declaration's accuracy.
declare module "node-zklib" {
  const ZKLib: any;
  export default ZKLib;
}
