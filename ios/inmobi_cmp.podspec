Pod::Spec.new do |s|
  s.name             = 'inmobi_cmp'
  s.version          = '0.1.0'
  s.summary          = 'A Flutter plugin for InMobi CMP (Consent Management Platform)'
  s.description      = 'A Flutter plugin to integrate InMobi CMP on iOS.'
  s.homepage         = 'https://github.com/yourusername/inmobi_cmp'
  s.license          = { :file => '../LICENSE' }
  s.source           = { :path => '.' }

  # You can safely omit the author line if not publishing to CocoaPods Central
  # s.author         = { 'Your Name' => 'you@example.com' }

  # You can bump platform to 15.0 if you're not supporting older iOS versions
  s.platform         = :ios, '15.0'

  s.source_files     = 'Classes/**/*'
  s.vendored_frameworks = 'Frameworks/InMobiCMP.framework'

  s.dependency       'Flutter'
  s.swift_version    = '5.0'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386' # Exclude legacy simulator archs
  }
end
