require "json"

react_native_pods = File.join(__dir__, "example", "node_modules", "react-native", "scripts", "react_native_pods.rb")
require react_native_pods if File.exist?(react_native_pods)

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
new_arch_enabled = ENV["RCT_NEW_ARCH_ENABLED"] == "1"

Pod::Spec.new do |s|
  s.name         = "react-native-telematics-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/maximcodm/react-native-telematics-sdk.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.swift_version = '5.0'

  s.dependency "React-Core"
  s.dependency 'TelematicsSDK', '~> 7.0.3'

  if new_arch_enabled
    install_modules_dependencies(s)
  end
end
