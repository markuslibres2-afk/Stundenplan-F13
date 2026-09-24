plugins {
    id("com.android.application")
}

android {
    namespace = "at.markuslibres2afk.stundenplanf13"
    compileSdk = 35

    defaultConfig {
        applicationId = "at.markuslibres2afk.stundenplanf13"
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
