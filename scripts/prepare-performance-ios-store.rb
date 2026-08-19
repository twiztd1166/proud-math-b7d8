require 'xcodeproj'

root = Dir.pwd
project_path = File.join(root, 'ios', 'App', 'App.xcodeproj')
raise 'Generated Capacitor iOS project is missing; run npx cap add ios --packagemanager SPM first' unless File.exist?(project_path)

version_name = ENV.fetch('PARADISE_STORE_VERSION', '1.0.0')
build_number = ENV.fetch('PARADISE_STORE_BUILD', '1')
bundle_id = 'com.paradiseexteriors.performance'
targeted_device_family = '1'

raise "PARADISE_STORE_VERSION must use x.y.z form; received #{version_name}" unless version_name.match?(/^\d+\.\d+\.\d+$/)
raise "PARADISE_STORE_BUILD must be a positive integer; received #{build_number}" unless build_number.match?(/^\d+$/) && build_number.to_i.positive?

project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |item| item.name == 'App' }
raise 'Unable to find generated iOS App target' unless target

target.build_configurations.each do |configuration|
  settings = configuration.build_settings
  settings['PRODUCT_BUNDLE_IDENTIFIER'] = bundle_id
  settings['MARKETING_VERSION'] = version_name
  settings['CURRENT_PROJECT_VERSION'] = build_number
  settings['INFOPLIST_KEY_CFBundleDisplayName'] = 'Paradise Performance'
  settings['TARGETED_DEVICE_FAMILY'] = targeted_device_family
end
project.save

release = target.build_configurations.find { |configuration| configuration.name == 'Release' }
raise 'Generated iOS App target is missing Release configuration' unless release
settings = release.build_settings
raise 'iOS bundle identifier control failed' unless settings['PRODUCT_BUNDLE_IDENTIFIER'] == bundle_id
raise 'iOS marketing version control failed' unless settings['MARKETING_VERSION'] == version_name
raise 'iOS build number control failed' unless settings['CURRENT_PROJECT_VERSION'] == build_number
raise 'iOS device-family control failed; Paradise Performance store v1 must be iPhone-only' unless settings['TARGETED_DEVICE_FAMILY'] == targeted_device_family

puts "Prepared unsigned iPhone-only App Store candidate: #{bundle_id}, version #{version_name} (#{build_number}), TARGETED_DEVICE_FAMILY=#{targeted_device_family}; signing intentionally external to repository."
