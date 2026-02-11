#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NotificationModule, NSObject)

RCT_EXTERN_METHOD(requestPermission:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(scheduleNotification:
                  (NSString *)stepId
                  stepTitle:(NSString *)stepTitle
                  guideTitle:(NSString *)guideTitle
                  remainingSeconds:(int)remainingSeconds
                  critical:(BOOL)critical
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelNotification:
                  (NSString *)stepId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(cancelAllNotifications:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(showNotification:
                  (NSString *)stepId
                  stepTitle:(NSString *)stepTitle
                  guideTitle:(NSString *)guideTitle
                  critical:(BOOL)critical
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(syncPreferences:
                  (BOOL)timerEnabled
                  criticalEnabled:(BOOL)criticalEnabled
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
