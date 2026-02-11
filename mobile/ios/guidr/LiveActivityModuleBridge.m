#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiveActivityModule, NSObject)

RCT_EXTERN_METHOD(isAvailable:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startActivity:
                  (NSString *)stepId
                  guideTitle:(NSString *)guideTitle
                  stepTitle:(NSString *)stepTitle
                  totalDurationSeconds:(int)totalDurationSeconds
                  remainingSeconds:(int)remainingSeconds
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateActivity:
                  (NSString *)stepId
                  remainingSeconds:(int)remainingSeconds
                  isPaused:(BOOL)isPaused
                  isComplete:(BOOL)isComplete
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeTimer:
                  (NSString *)stepId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endActivity:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
