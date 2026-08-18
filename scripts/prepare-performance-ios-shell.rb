require 'fileutils'
require 'xcodeproj'
require 'xcodeproj/plist'

root = Dir.pwd
ios_root = File.join(root, 'ios', 'App')
project_path = File.join(ios_root, 'App.xcodeproj')
app_dir = File.join(ios_root, 'App')
raise 'Generated Capacitor iOS project is missing; run npx cap add ios --packagemanager SPM first' unless File.exist?(project_path)

sources = %w[
  PerformanceLocationPlugin.swift
  PerformanceSecureStoragePlugin.swift
  PerformanceBridgeViewController.swift
]
sources.each do |name|
  FileUtils.cp(File.join(root, 'performance', 'native', 'ios', name), File.join(app_dir, name))
end

project = Xcodeproj::Project.open(project_path)
target = project.targets.find { |item| item.name == 'App' }
raise 'Unable to find generated iOS App target' unless target
app_group = project.main_group['App'] || project.main_group.find_subpath('App', false)
raise 'Unable to find generated iOS App group' unless app_group

sources.each do |name|
  ref = app_group.files.find { |file| file.path == name } || app_group.new_file(name)
  unless target.source_build_phase.files_references.include?(ref)
    target.source_build_phase.add_file_reference(ref, true)
  end
end
project.save

plist_path = File.join(app_dir, 'Info.plist')
plist = Xcodeproj::Plist.read_from_path(plist_path)
background_modes = Array(plist['UIBackgroundModes'])
background_modes << 'location' unless background_modes.include?('location')
plist['UIBackgroundModes'] = background_modes
plist['NSLocationWhenInUseUsageDescription'] = 'Paradise Performance records location only during an employee-started active workday so the employee and team can review the work route and location evidence.'
Xcodeproj::Plist.write_to_path(plist, plist_path)

storyboard_path = File.join(app_dir, 'Base.lproj', 'Main.storyboard')
storyboard = File.read(storyboard_path)
replaced = storyboard.gsub!(
  /customClass="CAPBridgeViewController"(?:\s+customModule="Capacitor")?(?:\s+customModuleProvider="target")?/,
  'customClass="PerformanceBridgeViewController" customModule="App" customModuleProvider="target"'
)
raise 'Unable to bind generated storyboard to PerformanceBridgeViewController' unless replaced || storyboard.include?('customClass="PerformanceBridgeViewController"')
File.write(storyboard_path, storyboard)

sources.each do |name|
  raise "Missing integrated iOS source: #{name}" unless File.exist?(File.join(app_dir, name))
end
raise 'iOS background location mode was not applied' unless Xcodeproj::Plist.read_from_path(plist_path).fetch('UIBackgroundModes', []).include?('location')

puts 'Prepared generated iOS shell with registered Performance location + Keychain secure-storage plugins.'
