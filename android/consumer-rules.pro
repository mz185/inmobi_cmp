# InMobi CMP core
-keep class com.inmobi.cmp.ChoiceCmp { *; }
-keep interface com.inmobi.cmp.ChoiceCmpCallback { *; }
-keep class com.inmobi.cmp.model.ChoiceError { *; }
-keep class com.inmobi.cmp.model.NonIABData { *; }
-keep class com.inmobi.cmp.model.PingReturn { *; }
-keep class com.inmobi.cmp.core.model.ACData { *; }
-keep class com.inmobi.cmp.core.model.GDPRData { *; }
-keep class com.inmobi.cmp.core.model.gbc.GoogleBasicConsents { *; }
-keep class com.inmobi.cmp.core.model.Vector { *; }
-keep class com.inmobi.cmp.core.model.mspa.USRegulationData { *; }
-keep class com.inmobi.cmp.data.model.ChoiceStyle { *; }
-keep class com.inmobi.cmp.data.model.ChoiceColor { *; }
-keep class com.inmobi.cmp.model.DisplayInfo { *; }
-keep class com.inmobi.cmp.model.ActionButton { *; }

# Gson support
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class * extends com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken
-keepclassmembers,allowobfuscation class * {
  @com.google.gson.annotations.SerializedName *;
}