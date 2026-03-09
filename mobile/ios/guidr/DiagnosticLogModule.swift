import Foundation
import React

@objc(DiagnosticLogModule)
class DiagnosticLogModule: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc func getEntries(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(DiagnosticLogger.shared.loadEntries())
  }

  @objc func clear(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DiagnosticLogger.shared.clear()
    resolve(nil)
  }
}
