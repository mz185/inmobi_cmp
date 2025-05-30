Pod::Spec.new do |s|
  s.name             = 'inmobi_cmp'
  s.version          = '0.1.0'
  s.summary          = 'A Flutter plugin for InMobi CMP (Consent Management Platform)'
  s.description      = 'Flutter plugin integrating the InMobi CMP SDK for iOS consent management.'
  s.homepage         = 'https://github.com/mz185/inmobi_cmp'
  s.license          = { :type => 'MIT', :file => '../LICENSE' }
  s.authors          = { 'inmobi_cmp_team' => 'marinoszenonos@gmail.com' }
  s.source           = { :path => '.' }
  s.platform         = :ios, '15.0'
  s.source_files     = 'Classes/**/*'
  s.dependency       'InMobi-CMP'
  s.dependency       'Flutter'
  s.swift_version    = '5.0'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386'
  }
end
