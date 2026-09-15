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

  spm_dependency(s,
    url: 'https://github.com/Mobile-Telematics/telematicsSDK-iOS-new-SPM.git',
    requirement: { kind: 'exactVersion', version: '7.2.0' },
    products: ['TelematicsSDK']
  )
end
