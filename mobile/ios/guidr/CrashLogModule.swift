import Foundation
import React

@objc(CrashLogModule)
class CrashLogModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc func getEntries(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(CrashLogStorage.shared.loadEntries())
  }

  @objc func clear(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    CrashLogStorage.shared.clear()
    resolve(nil)
  }
}
