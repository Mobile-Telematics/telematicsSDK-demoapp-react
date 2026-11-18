# Consumer R8/ProGuard rules for apps using react-native-telematics.
#
# com.telematicssdk:tracking depends on hivemq-mqtt-client, which references
# optional netty modules (native epoll transport, HTTP/WebSocket codecs, proxy
# handlers, netty-tcnative, ALPN/NPN) and logging backends (log4j, log4j2,
# slf4j) that the SDK does not ship and does not use. Without these rules R8 stops with "Missing classes detected" on every
# minified release build, e.g. Expo SDK 58, whose template enables
# android.enableMinifyInReleaseBuilds by default.
-dontwarn io.netty.channel.epoll.**
-dontwarn io.netty.handler.codec.http.**
-dontwarn io.netty.handler.proxy.**
-dontwarn io.netty.internal.tcnative.**
-dontwarn org.apache.log4j.**
-dontwarn org.apache.logging.log4j.**
-dontwarn org.slf4j.**
-dontwarn org.eclipse.jetty.alpn.**
-dontwarn org.eclipse.jetty.npn.**
-dontwarn reactor.blockhound.**
