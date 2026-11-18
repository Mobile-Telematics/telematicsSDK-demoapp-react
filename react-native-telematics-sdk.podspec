require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-telematics-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => "https://github.com/Mobile-Telematics/telematicsSDK-demoapp-react.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{m,mm,swift}"
  s.swift_version = '5.0'

  install_modules_dependencies(s)

  unless respond_to?(:spm_dependency, true)
    raise "react-native-telematics requires React Native 0.83 or newer, which provides spm_dependency in react_native_pods.rb."
  end

  # TEMPORARY (pre-release 3.2.0): TelematicsSDK 7.3.0-rc10 is not published to
  # the SPM repository yet, so the plugin ships it as a vendored xcframework.
  # When 7.3.0 is released: delete ios/Frameworks, drop the two lines below and
  # restore the spm_dependency block with the released version. Also re-enable
  # withPodfileSpmAppTarget in plugin/index.js (see the note there).
  s.vendored_frameworks = "ios/Frameworks/TelematicsSDK.xcframework"
  s.preserve_paths = "ios/Frameworks/TelematicsSDK-LICENSE.txt"

  # spm_dependency(s,
  #   url: 'https://github.com/Mobile-Telematics/telematicsSDK-iOS-new-SPM.git',
  #   requirement: { kind: 'exactVersion', version: '7.2.0' },
  #   products: ['TelematicsSDK']
  # )
end
