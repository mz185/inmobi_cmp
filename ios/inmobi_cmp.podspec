Pod::Spec.new do |s|
  s.name             = 'inmobi_cmp'
  s.version          = '0.1.0'
  s.summary          = 'A Flutter plugin for InMobi CMP (Consent Management Platform)'
  s.description      = <<-DESC
A Flutter plugin to integrate InMobi CMP on iOS.
                         DESC
  s.homepage         = 'https://github.com/yourusername/inmobi_cmp'
  s.license          = { :file => '../LICENSE' }
  s.author           = { 'Your Name' => 'you@example.com' }
  s.source           = { :path => '.' }
  s.platform         = :ios, '12.0'
  s.source_files     = 'Classes/**/*'
  s.vendored_frameworks = 'Frameworks/InMobiCMP.framework'
  s.dependency       'Flutter'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'i386'
  }
  s.swift_version    = '5.0'
end
