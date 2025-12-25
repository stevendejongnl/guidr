#!/bin/bash
# Wrapper script for running React Native on Android with correct environment

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export ANDROID_HOME=/home/stevendejong/Android/Sdk
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$PATH

npm run android
