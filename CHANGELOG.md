## [1.15.3](https://github.com/stevendejongnl/guidr/compare/v1.15.2...v1.15.3) (2025-12-31)

### Bug Fixes

* add iOS config fallback and disable Sentry in tests ([813db78](https://github.com/stevendejongnl/guidr/commit/813db788b45084dacf2bf714ceedc8b7c626988e))

## [1.15.2](https://github.com/stevendejongnl/guidr/compare/v1.15.1...v1.15.2) (2025-12-31)

### Bug Fixes

* resolve iOS logout button and enable Sentry error reporting ([12528de](https://github.com/stevendejongnl/guidr/commit/12528de4d0fd20094ab58aba9c299398ff5cb62f))

## [1.15.1](https://github.com/stevendejongnl/guidr/compare/v1.15.0...v1.15.1) (2025-12-31)

### Bug Fixes

* add Android version update to release process and sync to 1.15.0 ([554565a](https://github.com/stevendejongnl/guidr/commit/554565a1c78693c13a5bd0d4089c3ce4b87dec8c))
* add Sentry auth token configuration to CI/CD workflows ([b73ac59](https://github.com/stevendejongnl/guidr/commit/b73ac5921f2d0f46ba5e48850000b917d689d7ef))
* correct Sentry installation and secure auth tokens ([905b0f9](https://github.com/stevendejongnl/guidr/commit/905b0f9d1a8ea4cf17ea01233ff54a3977bae596))

## [1.15.0](https://github.com/stevendejongnl/guidr/compare/v1.14.1...v1.15.0) (2025-12-31)

### Features

* add APK installer with download and install capabilities ([67c00a9](https://github.com/stevendejongnl/guidr/commit/67c00a91aa8310d33d3c8ed10bdcbaf9d3e243f6))
* add infrastructure and domain layers for in-app updates ([cecbe48](https://github.com/stevendejongnl/guidr/commit/cecbe4822a9652e50b7dd51dade9356db8a721f1))
* add update UI screens and Android FileProvider configuration ([73b239e](https://github.com/stevendejongnl/guidr/commit/73b239e029087d25b715637935ebfc49ef38b731))
* integrate in-app update check and UI flow for Android ([a6d0bbb](https://github.com/stevendejongnl/guidr/commit/a6d0bbbc19a00f671d760242f357079c4b84751c))

### Bug Fixes

* resolve Android version not updating in release APKs ([efb67c1](https://github.com/stevendejongnl/guidr/commit/efb67c15b0340828bd5a023182009ed52e790202))

## [1.14.1](https://github.com/stevendejongnl/guidr/compare/v1.14.0...v1.14.1) (2025-12-31)

### Bug Fixes

* resolve GitHub release APK attachment and TestFlight icon validation failures ([66c03a0](https://github.com/stevendejongnl/guidr/commit/66c03a033e42ea97886dbdfa3e8064a46354e0cc))

### Documentation

* add explicit prohibition on AI attribution in commit messages ([6413565](https://github.com/stevendejongnl/guidr/commit/64135651e405cae6e4dc8a18b38d200597be3d3c))

## [1.14.0](https://github.com/stevendejongnl/guidr/compare/v1.13.0...v1.14.0) (2025-12-31)

### Features

* add Android adaptive icon support ([b49ed55](https://github.com/stevendejongnl/guidr/commit/b49ed556bffc5ec782e318942d17aa74de0b8296)), closes [#A7F3D0](https://github.com/stevendejongnl/guidr/issues/A7F3D0)

### Bug Fixes

* update fastlane to 2.230.0 to resolve TestFlight upload error ([5f293fc](https://github.com/stevendejongnl/guidr/commit/5f293fcf271668d40bc2314a1979b344b1de3913))

## [1.13.0](https://github.com/stevendejongnl/guidr/compare/v1.12.2...v1.13.0) (2025-12-29)

### Features

* add Android emulator URL to server startup message ([48fa821](https://github.com/stevendejongnl/guidr/commit/48fa82147d4d6d67363331d77f6af513b8f473c2))
* add icon generation script for iOS and Android; include SVG source and update package.json for sharp dependency ([7dec4ca](https://github.com/stevendejongnl/guidr/commit/7dec4ca5800496e6f1d1c65c04668cbc9e6ed8f6))
* add VersionDisplay component to Debug and Home screens; update Dockerfile and Makefile for context adjustments ([708b700](https://github.com/stevendejongnl/guidr/commit/708b700c1fd223a0e66a4e1a1cd638f495b64aeb))
* refactor styles to use common theme; update loading indicators and button styles across screens ([4b5dd4c](https://github.com/stevendejongnl/guidr/commit/4b5dd4c17e1b76ba0169101f4fded44bbfa4699b))

### Bug Fixes

* sync version from package.json before building Android/iOS apps ([a88eaca](https://github.com/stevendejongnl/guidr/commit/a88eaca57138fb9c54d77d7aeb611e9a120f8c85))
* update workflow job paths in ci-cd.yml ([3c2382e](https://github.com/stevendejongnl/guidr/commit/3c2382ebac5a6d5cc2505b5448b8bcb9e8f1765f))

## [1.12.2](https://github.com/stevendejongnl/guidr/compare/v1.12.1...v1.12.2) (2025-12-29)

### Bug Fixes

* code signing shit ([51f6be4](https://github.com/stevendejongnl/guidr/commit/51f6be4c86fd094069e3b71e9d1b1ccda5a9f87a))
* include default-configuration.toml in Docker image ([a7ef0e2](https://github.com/stevendejongnl/guidr/commit/a7ef0e26466cb338e58e9b1f41f4277d994eb8a4))

## [1.12.1](https://github.com/stevendejongnl/guidr/compare/v1.12.0...v1.12.1) (2025-12-29)

### Bug Fixes

* **ci:** add CODE_SIGN_IDENTITY and destination for iOS archive build ([247ad86](https://github.com/stevendejongnl/guidr/commit/247ad86492d8266a4ee5abd2ab1fc92b9e02f9a5))

## [1.12.0](https://github.com/stevendejongnl/guidr/compare/v1.11.1...v1.12.0) (2025-12-29)

### Features

* add TestFlight 'What to Test' notes from changelog ([b7b933b](https://github.com/stevendejongnl/guidr/commit/b7b933b141691b176bff09f55b211629cb8212ed))

## [1.11.1](https://github.com/stevendejongnl/guidr/compare/v1.11.0...v1.11.1) (2025-12-29)

### Bug Fixes

* add ROOT_PATH for FastAPI OpenAPI docs behind reverse proxy ([b0962dd](https://github.com/stevendejongnl/guidr/commit/b0962dd6793b714bb7addd27dbe8b384955bcb22))
* use altool instead of fastlane pilot for TestFlight uploads ([04e0a5c](https://github.com/stevendejongnl/guidr/commit/04e0a5cad17b8408d6bfb0bdb7a5fc8f12c0392b))

## [1.11.0](https://github.com/stevendejongnl/guidr/compare/v1.10.1...v1.11.0) (2025-12-29)

### Features

* add app outdated version screen with version range check ([1aae536](https://github.com/stevendejongnl/guidr/commit/1aae536b379b27e156dba46812959efa53c07cc7))
* **test-server:** add version fields to /config endpoint ([500cea9](https://github.com/stevendejongnl/guidr/commit/500cea96202deff217d08cbfec11f5b0f97fb3e5))

### Bug Fixes

* resolve strict TypeScript errors for CI compliance ([2a13057](https://github.com/stevendejongnl/guidr/commit/2a13057f3c682ea2e7ed32a5800c41688b70ea3e))

## [1.10.1](https://github.com/stevendejongnl/guidr/compare/v1.10.0...v1.10.1) (2025-12-29)

### Bug Fixes

* add platform-specific config loading for Android and iOS ([3ff5adf](https://github.com/stevendejongnl/guidr/commit/3ff5adffcacd54837537b7ffa9be61e0487c8377))

## [1.10.0](https://github.com/stevendejongnl/guidr/compare/v1.9.1...v1.10.0) (2025-12-29)

### Features

* add Jest setup file to suppress expected console warnings during tests ([c956604](https://github.com/stevendejongnl/guidr/commit/c9566047a6b1b4544cc0e5f05ae9586424a7571b))

## [1.9.1](https://github.com/stevendejongnl/guidr/compare/v1.9.0...v1.9.1) (2025-12-28)

### Bug Fixes

* add error handling to logout function to prevent silent failures ([bbbb1c5](https://github.com/stevendejongnl/guidr/commit/bbbb1c59d8330c6657aeb682b3dbaf17e52b01d6))

## [1.9.0](https://github.com/stevendejongnl/guidr/compare/v1.8.13...v1.9.0) (2025-12-28)

### Features

* always navigate to login screen on app start ([6b00b94](https://github.com/stevendejongnl/guidr/commit/6b00b941a5bb4aaa000112dbf634342bbb4d8da9))

### Bug Fixes

* improve Android version extraction robustness in update script ([fa25915](https://github.com/stevendejongnl/guidr/commit/fa25915c584cba2ce4b2e803ec38b275fb37e9e0))

## [1.8.13](https://github.com/stevendejongnl/guidr/compare/v1.8.12...v1.8.13) (2025-12-28)

### Bug Fixes

* add semantic-release npm plugin and sync versions to 1.8.11 ([bde3ec4](https://github.com/stevendejongnl/guidr/commit/bde3ec45ea29192ebede5463acd9e10c577d4b23))

## [1.8.12](https://github.com/stevendejongnl/guidr/compare/v1.8.11...v1.8.12) (2025-12-28)

### Bug Fixes

* use proper JSON format for Fastlane App Store Connect API key ([9d74238](https://github.com/stevendejongnl/guidr/commit/9d7423814d5ad5384c8ab76c34dfd0cf9d56bfb9))

## [1.8.11](https://github.com/stevendejongnl/guidr/compare/v1.8.10...v1.8.11) (2025-12-28)

### Code Refactoring

* simplify TestFlight deployment with automatic provisioning ([5297c69](https://github.com/stevendejongnl/guidr/commit/5297c6935e12300b44b54716f26a782d5d1e8907))

## [1.8.10](https://github.com/stevendejongnl/guidr/compare/v1.8.9...v1.8.10) (2025-12-28)

### Bug Fixes

* add Cloudflare Access credentials for cloudflared authentication ([bd89a3b](https://github.com/stevendejongnl/guidr/commit/bd89a3b7e9c6a5e4653b1ea5403dd44f698f8a75))

## [1.8.9](https://github.com/stevendejongnl/guidr/compare/v1.8.8...v1.8.9) (2025-12-28)

### Bug Fixes

* use cloudflared access ssh instead of tcp to avoid port binding ([dde7387](https://github.com/stevendejongnl/guidr/commit/dde7387866e378ce779611404014aa31ed6b46d3))

## [1.8.8](https://github.com/stevendejongnl/guidr/compare/v1.8.7...v1.8.8) (2025-12-28)

### Bug Fixes

* prevent unnecessary workflow triggers when no release created ([37c5a76](https://github.com/stevendejongnl/guidr/commit/37c5a76017ddf528d1824f1e4c68bbb59359fe43))

### Documentation

* restructure and consolidate project documentation ([b0b3228](https://github.com/stevendejongnl/guidr/commit/b0b3228148166430e8df6996d70f932ff5200d0b))

## [1.8.7](https://github.com/stevendejongnl/guidr/compare/v1.8.6...v1.8.7) (2025-12-28)

### Bug Fixes

* remove cloudflared client, use direct SSH through tunnel ([aa10450](https://github.com/stevendejongnl/guidr/commit/aa10450bb5039bc4776585c856f6cff481d9df27))

## [1.8.6](https://github.com/stevendejongnl/guidr/compare/v1.8.5...v1.8.6) (2025-12-28)

### Bug Fixes

* simplify SSH to use Cloudflare Tunnel without Access auth ([64e5dd8](https://github.com/stevendejongnl/guidr/commit/64e5dd85e85b232a5a9232306556816643375ebc))

### Documentation

* add git workflow guidelines and improve SSH test workflow ([2bae369](https://github.com/stevendejongnl/guidr/commit/2bae3698cf5f35141c44855f08d5f4d443bf9344))

## [1.8.5](https://github.com/stevendejongnl/guidr/compare/v1.8.4...v1.8.5) (2025-12-27)

### Bug Fixes

* pass Cloudflare Access credentials to Fastlane Match step ([d5e7ada](https://github.com/stevendejongnl/guidr/commit/d5e7ada63eb905ae3e818ead08d35bbbfa6cb16f))

## [1.8.4](https://github.com/stevendejongnl/guidr/compare/v1.8.3...v1.8.4) (2025-12-27)

### Bug Fixes

* add verbose logging for Cloudflare Access SSH connection ([0a8be06](https://github.com/stevendejongnl/guidr/commit/0a8be06554b2f668111b6a5dded6f83fc7f7638a))

## [1.8.3](https://github.com/stevendejongnl/guidr/compare/v1.8.2...v1.8.3) (2025-12-27)

### Bug Fixes

* persist Cloudflare Access credentials across workflow steps ([dfa710a](https://github.com/stevendejongnl/guidr/commit/dfa710ab93f1546955e54ac2703806aae66cc43e))

## [1.8.2](https://github.com/stevendejongnl/guidr/compare/v1.8.1...v1.8.2) (2025-12-27)

### Bug Fixes

* use ssh instead of ssh-keyscan for Cloudflare Access tunnel ([d90c127](https://github.com/stevendejongnl/guidr/commit/d90c12749f951f9900298d6512a68d9289d928b6))

## [1.8.1](https://github.com/stevendejongnl/guidr/compare/v1.8.0...v1.8.1) (2025-12-27)

### Bug Fixes

* resolve Fastlane Match SSH authentication through Cloudflare Access ([59fed99](https://github.com/stevendejongnl/guidr/commit/59fed996b6fba50eba7d596e7a2c288f87a4b029))

## [1.8.0](https://github.com/stevendejongnl/guidr/compare/v1.7.1...v1.8.0) (2025-12-27)

### Features

* configure Cloudflare Access for SSH certificate repository access ([790468b](https://github.com/stevendejongnl/guidr/commit/790468bda39c31149af16a1bf7ac1c642bc72178))

## [1.7.1](https://github.com/stevendejongnl/guidr/compare/v1.7.0...v1.7.1) (2025-12-27)

### Bug Fixes

* switch Fastlane Match to SSH authentication to bypass Cloudflare ([1eeb083](https://github.com/stevendejongnl/guidr/commit/1eeb08321157ba66ce17d6fb803e55a884608a52))

## [1.7.0](https://github.com/stevendejongnl/guidr/compare/v1.6.4...v1.7.0) (2025-12-27)

### Features

* implement Fastlane Match for automated certificate management ([b855e49](https://github.com/stevendejongnl/guidr/commit/b855e495d7c195c9d65e8b6ab87fd681c47d59be))

## [1.6.4](https://github.com/stevendejongnl/guidr/compare/v1.6.3...v1.6.4) (2025-12-27)

### Bug Fixes

* use JSON format for Fastlane pilot API key authentication ([ea420c5](https://github.com/stevendejongnl/guidr/commit/ea420c518d249e518ca5759dafd72a9fce66386a))

## [1.6.3](https://github.com/stevendejongnl/guidr/compare/v1.6.2...v1.6.3) (2025-12-27)

### Bug Fixes

* add missing API key ID and issuer ID to Fastlane pilot ([1785a94](https://github.com/stevendejongnl/guidr/commit/1785a9479f0d8094ba8ec55217dca5286ac0d337))

## [1.6.2](https://github.com/stevendejongnl/guidr/compare/v1.6.1...v1.6.2) (2025-12-27)

### Bug Fixes

* expand $HOME in bash before passing to Fastlane pilot ([27e26c1](https://github.com/stevendejongnl/guidr/commit/27e26c1b7ee36db0fe83daa64dc23904fe22d710))

## [1.6.1](https://github.com/stevendejongnl/guidr/compare/v1.6.0...v1.6.1) (2025-12-27)

### Bug Fixes

* resolve API key path expansion issue in TestFlight deployment ([00bb18d](https://github.com/stevendejongnl/guidr/commit/00bb18daedaff45842f8528760bafcba5afae2ba))

## [1.6.0](https://github.com/stevendejongnl/guidr/compare/v1.5.1...v1.6.0) (2025-12-27)

### Features

* add debug screen with server configuration endpoint ([1f8912f](https://github.com/stevendejongnl/guidr/commit/1f8912f53eeb88737cfaf303ab2b19428174e2d7))
* automate TestFlight encryption compliance and group assignment ([4a59725](https://github.com/stevendejongnl/guidr/commit/4a5972509aa466958255a94e1d574b2a5eed23dc))
* load server URL from TOML configuration file ([403dfa2](https://github.com/stevendejongnl/guidr/commit/403dfa21eadee9dde9fb657fd67260c06c83f7f4))

### Bug Fixes

* replace @iarna/toml with React Native-compatible smol-toml ([b91ecbf](https://github.com/stevendejongnl/guidr/commit/b91ecbf9ca11fcd18be06c0d10e03cd742d6d6ca))

## [1.5.1](https://github.com/stevendejongnl/guidr/compare/v1.5.0...v1.5.1) (2025-12-26)

### Bug Fixes

* add pydantic[email] extra for EmailStr validation ([bfd44e3](https://github.com/stevendejongnl/guidr/commit/bfd44e37fc04204bbd5eccea3d399653d0af91ba))

### Documentation

* add Kubernetes deployment manifests for test-server ([80b61bc](https://github.com/stevendejongnl/guidr/commit/80b61bcf0acdff93b07da46468b6715c14f8affc))

## [1.5.0](https://github.com/stevendejongnl/guidr/compare/v1.4.1...v1.5.0) (2025-12-26)

### Features

* add Poetry and Docker support to test-server ([c068bc4](https://github.com/stevendejongnl/guidr/commit/c068bc411016221380517cc4a9ad97da93f384fb))

### Bug Fixes

* improve server setup screen UX and branding ([6808d53](https://github.com/stevendejongnl/guidr/commit/6808d5333f78ca106b663d2d7628ef0ee8793ece))

## [1.4.1](https://github.com/stevendejongnl/guidr/compare/v1.4.0...v1.4.1) (2025-12-26)

### Bug Fixes

* correct TestFlight workflow condition to detect new releases ([56ad0c7](https://github.com/stevendejongnl/guidr/commit/56ad0c7835ccd369606bfae0feae357bbb96ae11))

## [1.4.0](https://github.com/stevendejongnl/guidr/compare/v1.3.3...v1.4.0) (2025-12-26)

### Features

* test TestFlight automatic deployment ([24bd2a4](https://github.com/stevendejongnl/guidr/commit/24bd2a42d69ea52c4dc8ab160b6265bd29d37e79))

## [1.3.3](https://github.com/stevendejongnl/guidr/compare/v1.3.2...v1.3.3) (2025-12-26)

### Bug Fixes

* enable TestFlight auto-trigger by removing [skip ci] ([19f08a0](https://github.com/stevendejongnl/guidr/commit/19f08a0570b8f1e27d610b9fa6ff7e2c2c850f7f))
* use workflow_run to trigger TestFlight after releases ([1f3f44f](https://github.com/stevendejongnl/guidr/commit/1f3f44fc7e1844e7ec2eacd2c48bb7a0ce422a2f))

## [1.3.2](https://github.com/stevendejongnl/guidr/compare/v1.3.1...v1.3.2) (2025-12-26)

### Bug Fixes

* add explicit text color to input fields for iOS visibility ([c5374e3](https://github.com/stevendejongnl/guidr/commit/c5374e3295567b9c960d5ef0674fc0329a9aa449))

## [1.3.1](https://github.com/stevendejongnl/guidr/compare/v1.3.0...v1.3.1) (2025-12-26)

### Bug Fixes

* resolve TestFlight workflow trigger permissions error ([f36b578](https://github.com/stevendejongnl/guidr/commit/f36b578f05f14359b5bc2dd1d12ea7703fbe4aec))

## [1.3.0](https://github.com/stevendejongnl/guidr/compare/v1.2.1...v1.3.0) (2025-12-26)

### Features

* add app version display and server change option ([bb6fd84](https://github.com/stevendejongnl/guidr/commit/bb6fd84934e946dd25ef42cc6f44cafe2953aad8))
* sync versions across package.json, iOS, and Android ([bf9c3f9](https://github.com/stevendejongnl/guidr/commit/bf9c3f94a26c5f6f46454141e4035babc7075f85))

## [1.2.1](https://github.com/stevendejongnl/guidr/compare/v1.2.0...v1.2.1) (2025-12-26)

### Bug Fixes

* add app icons and CFBundleIconName for TestFlight ([cc7b98b](https://github.com/stevendejongnl/guidr/commit/cc7b98b408801d91d0ad76ef9ff0621b9d8053ea))

## [1.2.0](https://github.com/stevendejongnl/guidr/compare/v1.1.1...v1.2.0) (2025-12-26)

### Features

* add iOS TestFlight distribution ([82d3c9b](https://github.com/stevendejongnl/guidr/commit/82d3c9bd0db2b6f27db0265ebfb134b5f28eb1f4))

### Bug Fixes

* add App Store Connect API authentication to xcodebuild commands ([84b338d](https://github.com/stevendejongnl/guidr/commit/84b338d6333331823484f0f37f9622f6e75488e9))

### Documentation

* add manual setup TODO list for TestFlight ([0a802f6](https://github.com/stevendejongnl/guidr/commit/0a802f601f92bfcfa85c81e9d84d56b8eb8b0229))
* mark Apple Developer setup as completed ([eb65903](https://github.com/stevendejongnl/guidr/commit/eb659039c7741875996d364068e1d5378fe4a57e))
* remove Keychain Sharing capability requirement ([cdfa6c6](https://github.com/stevendejongnl/guidr/commit/cdfa6c63583dd66021a0ef5918c325312deaef33))
* simplify cost information for public repository ([3783086](https://github.com/stevendejongnl/guidr/commit/37830863de33b703675af4fb391ffdae950ab2aa))

## [1.1.1](https://github.com/stevendejongnl/guidr/compare/v1.1.0...v1.1.1) (2025-12-26)

### Performance Improvements

* eliminate double builds by optimizing CI/CD workflow ([23dc6f9](https://github.com/stevendejongnl/guidr/commit/23dc6f9c41301be97f9f987488d3ab71738286dc))

## [1.1.0](https://github.com/stevendejongnl/guidr/compare/v1.0.0...v1.1.0) (2025-12-26)

### Features

* configure iOS build for AltStore Classic sideloading ([95edb11](https://github.com/stevendejongnl/guidr/commit/95edb11a4a27dfcd2f2e0f45264b7372b8b70722))

### Bug Fixes

* correct IPA file path in fallback creation ([3a0e0dd](https://github.com/stevendejongnl/guidr/commit/3a0e0dd2214d22e60a33d3d53e55489eef70676d))

## [1.0.0](https://github.com/stevendejongnl/guidr/compare/v0.0.1...v1.0.0) (2025-12-25)

### ⚠ BREAKING CHANGES

* Release process now requires conventional commit messages.
Use feat: for features, fix: for bugs, or BREAKING CHANGE: for majors.

### Features

* add semantic-release with iOS and Android builds ([fdb67d5](https://github.com/stevendejongnl/guidr/commit/fdb67d52dcd9ded3e0fa482ccd91338cabb0fa5a))
* First releases ([0b2b66d](https://github.com/stevendejongnl/guidr/commit/0b2b66dc0f572a47f37501d413f5ad37fdf24510))
