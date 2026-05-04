require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-telematics-sdk"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/Mobile-Telematics/telematicsSDK-demoapp-react.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{m,mm,swift}"
  s.swift_version = '5.0'

  install_modules_dependencies(s)
  s.dependency 'TelematicsSDK', '~> 7.0.3'
end
