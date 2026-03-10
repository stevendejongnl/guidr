#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CrashLogModule, NSObject)
RCT_EXTERN_METHOD(getEntries:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(clear:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
